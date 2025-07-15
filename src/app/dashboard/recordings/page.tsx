'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Mic, AlertCircle, Loader2 } from 'lucide-react';
import { AudioRecorder } from '@/components/audio-recorder';
import { supabase } from '@/lib/supabaseClient';
import { topicsService, Topic } from '@/lib/topicsService';

interface EvaluationResult {
  overallScore: number;
  confidence?: string;
  fillerWords?: {
    count: number;
    words: string[];
  };
  grammarFeedback?: string;
  alternativePhrasing?: Array<{
    original: string;
    suggested: string;
  }>;
  topicAdherence?: number | null;
}

export default function RecordingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [isLoadingTopic, setIsLoadingTopic] = useState(true);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState<string | null>(null);
  const [recordedEvaluation, setRecordedEvaluation] = useState<EvaluationResult | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchCurrentTopic();
    }
  }, [user, router]);

  const fetchCurrentTopic = async () => {
    try {
      setIsLoadingTopic(true);
      const topic = await topicsService.getActiveTopic();
      setCurrentTopic(topic);
    } catch (error) {
      console.error('Error fetching current topic:', error);
    } finally {
      setIsLoadingTopic(false);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob, audioUrl: string, topic?: string) => {
    setIsProcessingRecording(true);
    setRecordingError(null);
    setShowResults(false);
    
    try {
      // 1. Upload audio to Supabase Storage
      const fileName = `recordings/${user!.id}/${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, audioBlob);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // 2. Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      // 3. Get transcription
      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: publicUrl }),
      });

      if (!transcriptionResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcript = transcriptionData.transcript;
      setRecordedTranscript(transcript);

      // 4. Get AI evaluation
      const evaluationResponse = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript,
          topic: topic || currentTopic?.title 
        }),
      });

      if (!evaluationResponse.ok) {
        const errorData = await evaluationResponse.json();
        throw new Error(`Evaluation failed: ${errorData.error || 'Unknown error'}`);
      }

      const evaluation = await evaluationResponse.json();
      setRecordedEvaluation(evaluation);

      // 5. Save to database
      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          user_id: user!.id,
          audio_url: publicUrl,
          transcript: transcript,
          topic: topic || currentTopic?.title || null,
          ai_feedback: evaluation,
          score: evaluation.overallScore
        });

      if (dbError) throw new Error(`Database save failed: ${dbError.message}`);

      // 6. Show results in UI
      setShowResults(true);
      
    } catch (error) {
      console.error('Recording processing error:', error);
      setRecordingError(error instanceof Error ? error.message : 'Failed to process recording');
    } finally {
      setIsProcessingRecording(false);
    }
  };

  const renderEvaluation = () => {
    if (!recordedEvaluation) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>AI Feedback</CardTitle>
          <CardDescription>Here's your speaking evaluation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Overall Score:</span>
            <span className="font-bold">{recordedEvaluation.overallScore}/100</span>
          </div>
          {recordedEvaluation.confidence && (
            <div>
              <h4 className="font-semibold mb-1">Confidence Analysis</h4>
              <p>{recordedEvaluation.confidence}</p>
            </div>
          )}
          {recordedEvaluation.fillerWords && (
            <div>
              <h4 className="font-semibold mb-1">Filler Words Used ({recordedEvaluation.fillerWords.count})</h4>
              <p>{recordedEvaluation.fillerWords.words.join(', ')}</p>
            </div>
          )}
          {recordedEvaluation.grammarFeedback && (
            <div>
              <h4 className="font-semibold mb-1">Grammar Feedback</h4>
              <p>{recordedEvaluation.grammarFeedback}</p>
            </div>
          )}
          {recordedEvaluation.alternativePhrasing && recordedEvaluation.alternativePhrasing.length > 0 && (
            <div>
              <h4 className="font-semibold mb-1">Suggested Improvements</h4>
              <ul className="list-disc pl-5">
                {recordedEvaluation.alternativePhrasing.map((phrase, index) => (
                  <li key={index} className="mb-2">
                    <div className="text-red-500">Original: "{phrase.original}"</div>
                    <div className="text-green-500">Better: "{phrase.suggested}"</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/recordings/history')}
          >
            View History
          </Button>
          <Button
            onClick={() => {
              setRecordedTranscript(null);
              setRecordedEvaluation(null);
              setShowResults(false);
            }}
          >
            Record Another
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Record Your Beautiful Voice</CardTitle>
          <CardDescription>
            {currentTopic ? (
              <>
                <strong>Practice Speaking:</strong> {currentTopic.title}
                <br />
                <span className="text-sm">Speak about the topic above for at least 3 minutes</span>
              </>
            ) : (
              'Loading topic...'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recordingError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {recordingError}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setRecordingError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {!showResults ? (
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              topic={currentTopic?.title}
            />
          ) : null}

          {isProcessingRecording && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Processing your recording...</p>
            </div>
          )}

          {showResults && recordedTranscript && (
            <>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Your speech in words</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {recordedTranscript}
                </div>
              </div>
              {renderEvaluation()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
