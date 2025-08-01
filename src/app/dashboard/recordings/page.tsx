'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { CheckCircle, RefreshCw, Mic, Upload, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AudioPlayer } from '@/components/audio-player';
import { AudioRecorder } from '@/components/audio-recorder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FileUpload from '@/components/ui/file-upload';
import { uploadAudio } from '@/lib/uploadAudio';
import { transcribeAudio } from '@/lib/transcriptionService';
import { evaluateTranscription, EvaluationResult } from '@/lib/evaluationService';


/**
 * Helper function to normalize a date to the start of the day (YYYY-MM-DD)
 * Used for consistent date handling when working with daily submissions
 * 
 * @param date - The date to normalize
 * @returns A string in YYYY-MM-DD format representing the start of the day
 */
const getNormalizedDate = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

export default function RecordingsPage() {
  const { user, profile, fetchProfile } = useAuth();
  const [topic, setTopic] = useState<{ id: string; topic: string; details: string } | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQueued, setIsQueued] = useState(false);
  const [submissionSuccessful, setSubmissionSuccessful] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("record");
  const [showReview, setShowReview] = useState(false);

  const fetchTodaysTopic = useCallback(async () => {
    setError(null);
    try {
      const today = getNormalizedDate(new Date());

      let { data, error } = await supabase
        .from('speaking_topics')
        .select('id, title, description')
        .eq('status', 'active')
        .eq('scheduled_for', today)
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        ({ data, error } = await supabase
          .from('speaking_topics')
          .select('id, title, description')
          .eq('status', 'active')
          .order('scheduled_for', { ascending: false })
          .limit(1)
          .single());
      }

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (data) {
        setTopic({ id: data.id, topic: data.title, details: data.description });
      } else {
        setError("No active speaking topics available at the moment.");
        setTopic(null);
      }
    } catch (err: any) {
      console.error('Error fetching topic:', err.message || err);
      setError("Could not fetch today's topic. Please try again later.");
    }
  }, []);

  const checkExistingSubmission = useCallback(async () => {
    if (!user || !topic) return;

    const today = getNormalizedDate(new Date());

    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic', topic.topic) // Corrected: from 'topic_id' to 'topic'
        .eq('submission_date', today)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setHasSubmittedToday(true);
        setSubmissionSuccessful(true); // Already submitted, so show success state
      } else {
        setHasSubmittedToday(false);
      }
    } catch (err) {
      console.error('Error checking for existing submission:', err);
      setError('Could not verify your submission status. Please refresh.');
      setHasSubmittedToday(null); // Error state
    }
  }, [user, topic]);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        await fetchTodaysTopic();
      }
    };
    loadData();
  }, [user, fetchTodaysTopic]);

  useEffect(() => {
    if (topic && user) {
      checkExistingSubmission();
    }
  }, [topic, user, checkExistingSubmission]);


  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setShowReview(false); // Reset review state
  };

  const handleFileUpload = (file: File) => {
    setAudioBlob(file);
    setShowReview(false); // Reset review state
  };

  /**
   * Reset all state related to the current recording and evaluation
   * This allows the user to start over with a new recording
   */
  const handleRetake = () => {
    setAudioBlob(null);
    setEvaluation(null);
    setTranscription(null);
    setError(null);
    setIsQueued(false);
    setShowReview(false);
  };

  /**
   * Process the current audio recording for review
   * This involves uploading the audio, getting a transcription,
   * and requesting an AI evaluation
   */
  const handleReview = async () => {
    if (!audioBlob || !user || !topic) {
      setError('Missing audio or topic information.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setEvaluation(null);
    setTranscription(null);
    setIsQueued(false);

    try {
      // Step 1: Upload Audio
      const { publicUrl, error: uploadError } = await uploadAudio(audioBlob, user.id);
      if (uploadError) throw new Error(uploadError);

      // Step 2: Get Transcription
      const { transcription: transcript, error: transcribeError } = await transcribeAudio(publicUrl);
      if (transcribeError) throw new Error(transcribeError);
      setTranscription(transcript);

      // Step 3: Get Evaluation from the AI
      const { evaluation: evalResult, error: evaluateError, inQueue } = await evaluateTranscription(transcript, topic.topic);
      
      if (inQueue) {
        // If request was queued due to API rate limits, show a user-friendly message
        setError("Your review request is in a queue due to high demand. Please wait a moment and try again.");
        setIsQueued(true);
        return;
      }
      
      if (evaluateError) throw new Error(evaluateError);
      if (!evalResult) throw new Error("Evaluation returned no result.");
      
      // Successfully received evaluation
      setEvaluation(evalResult);
      setIsQueued(false);
      setShowReview(true); // Show the review card

    } catch (err: any) {
      console.error('Review process failed:', err);
      setError(err.message || 'An unexpected error occurred during evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForCompletion = async () => {
    if (!transcription || !evaluation || !user || !topic || !audioBlob) {
      setError('Cannot submit, evaluation data is missing.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
        // Re-upload audio to get a persistent URL for the final submission
        const { publicUrl, error: uploadError } = await uploadAudio(audioBlob, user.id);
        if (uploadError) throw new Error(uploadError);

        // Save to Database
        const today = getNormalizedDate(new Date());
        const { error: insertError } = await supabase.from('recordings').insert({
            user_id: user.id,
            // No 'topic_id', just 'topic'
            audio_url: publicUrl,
            transcription: transcription,
            score: evaluation.overallScore,
            ai_feedback: JSON.stringify(evaluation), 
            topic: topic.topic, // Corrected: ensure this is the only topic field
            submission_date: today,
        });

        if (insertError) {
            if (insertError.code === '23505') {
                setError("You have already submitted a recording for this topic today.");
                setHasSubmittedToday(true);
            } else {
                throw insertError;
            }
            return;
        }

        // Update user's profile
        const newEliteScore = (profile?.elite_score || 0) + (evaluation.overallScore || 0);
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                last_submission_date: new Date().toISOString(),
                elite_score: newEliteScore,
            })
            .eq('id', user.id);

        if (profileError) throw new Error('Failed to update your profile.');

        await fetchProfile();
        setSubmissionSuccessful(true);
        setHasSubmittedToday(true);
        setShowReview(false);

    } catch (err: any) {
        console.error('Final submission process failed:', err);
        setError(err.message || 'An unexpected error occurred during final submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Practice Your Speaking</CardTitle>
          {topic ? (
            <CardDescription>
              Today's topic is: <span className="font-semibold text-primary">{topic.topic}</span> - {topic.details}
            </CardDescription>
          ) : (
            <CardDescription>Loading today's topic...</CardDescription>
          )}
          <div className="pt-2">
             {hasSubmittedToday === null && <p className="text-sm text-muted-foreground">Verifying submission status...</p>}
             {hasSubmittedToday === true && <p className="text-sm font-semibold text-green-600">You have completed today's recording task. Well done!</p>}
             {hasSubmittedToday === false && <p className="text-sm font-semibold text-orange-600">You have not yet submitted a recording for this topic today.</p>}
          </div>
        </CardHeader>
        <CardContent>
          {!submissionSuccessful && !showReview && (
            <>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="record" disabled={hasSubmittedToday === true}>
                    <Mic className="mr-2 h-4 w-4" /> Record Audio
                  </TabsTrigger>
                  <TabsTrigger value="upload" disabled={hasSubmittedToday === true}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Audio
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="record">
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg mt-4">
                    <AudioRecorder onRecordingComplete={handleRecordingComplete} disabled={hasSubmittedToday === true} />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Click the microphone to start recording.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="upload">
                  <div className="p-8 border-2 border-dashed rounded-lg mt-4">
                    <FileUpload 
                      onUploadSuccess={handleFileUpload}
                      acceptedFileTypes={['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/x-m4a']}
                      maxFileSize={10 * 1024 * 1024} // 10MB
                      disabled={hasSubmittedToday === true}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              {audioBlob && (
                <div className="mt-4 text-center">
                  <p className="mb-2 text-sm text-muted-foreground">Audio ready for evaluation.</p>
                  <AudioPlayer audioBlob={audioBlob} />
                  <div className="flex justify-center gap-4 mt-4">
                    <Button onClick={handleReview} disabled={isSubmitting}>
                      {isSubmitting ? 'Evaluating...' : 'Review & Evaluate'}
                    </Button>
                    <Button onClick={handleRetake} variant="outline">
                      Retake
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Unified container for processing, results, or errors */}
      <div className="mt-6 min-h-[10rem] transition-all duration-300">
        {isSubmitting && !showReview && (
          <Card className="animate-in fade-in-50 duration-500">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-4 h-32">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">Evaluating your recording... Please wait.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {submissionSuccessful && (
          <Card className="border-green-500 bg-green-500/10 animate-in fade-in-50 duration-500">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" />
                <CardTitle className="text-green-800">Submission Successful!</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p>Your recording has been submitted and your daily task is complete. Great job!</p>
              <p className="mt-2">Your Elite Score has been updated.</p>
            </CardContent>
            <CardFooter className="flex gap-4">
               <Link href="/dashboard/recordings/history">
                <Button variant="outline">View Submission History</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* Error or Queue Status Card - shows different UI based on whether request is queued or errored */}
        {error && (
          <Card className={`${isQueued ? 'border-amber-500 bg-amber-50' : 'border-destructive bg-destructive/5'} animate-in fade-in-50 duration-500`}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                {isQueued ? (
                  <RefreshCw className="text-amber-500" />
                ) : (
                  <AlertCircle className="text-destructive" />
                )}
                <CardTitle className={isQueued ? 'text-amber-700' : 'text-destructive'}>
                  {isQueued ? 'Request In Queue' : 'An Error Occurred'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className={isQueued ? 'text-amber-700' : 'text-destructive-foreground'}>
                {error}
              </p>
              {/* Additional explanation for queued requests */}
              {isQueued && (
                <p className="mt-2 text-sm text-amber-700">
                  The free tier API has a limit on simultaneous requests. Your evaluation will be processed as soon as possible.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleRetake} variant={isQueued ? 'outline' : 'destructive'}>
                {isQueued ? 'Cancel' : 'Try Again'}
              </Button>
              {/* Show retry button only for queued requests */}
              {isQueued && (
                <Button 
                  onClick={handleReview} 
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry Evaluation
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {showReview && evaluation && !submissionSuccessful && (
          <Card className="animate-in fade-in-50 duration-500">
            <CardHeader>
              <CardTitle>Review Your Evaluation</CardTitle>
              <CardDescription>
                Review your results below. If you're satisfied, submit to complete your daily task. Otherwise, you can retake it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Overall Score: {evaluation.overallScore}/100</h3>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${evaluation.overallScore}%` }}></div>
                </div>
              </div>

              {transcription && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Transcript</h3>
                  <p className="text-muted-foreground p-4 bg-muted rounded-md">{transcription}</p>
                </div>
              )}

              <Tabs defaultValue="feedback" className="w-full">
                <TabsList>
                  <TabsTrigger value="feedback">Detailed Feedback</TabsTrigger>
                  <TabsTrigger value="phrasing">Alternative Phrasing</TabsTrigger>
                </TabsList>
                <TabsContent value="feedback">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Feedback</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Confidence</TableCell>
                        <TableCell>{evaluation.confidence || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Filler Words</TableCell>
                        <TableCell>
                          {evaluation.fillerWords && evaluation.fillerWords.count > 0
                            ? `${evaluation.fillerWords.count} found: ${evaluation.fillerWords.words.join(', ')}`
                            : 'None detected'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Grammar</TableCell>
                        <TableCell>{evaluation.grammarFeedback || 'Looks good!'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Topic Adherence</TableCell>
                        <TableCell>
                          {typeof evaluation.topicAdherence === 'object' && evaluation.topicAdherence !== null
                            ? `${evaluation.topicAdherence.score}/10 - ${evaluation.topicAdherence.feedback}`
                            : typeof evaluation.topicAdherence === 'number'
                            ? `${evaluation.topicAdherence}/10`
                            : 'Not applicable.'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="phrasing">
                  {evaluation.alternativePhrasing && evaluation.alternativePhrasing.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Original Phrase</TableHead>
                          <TableHead>Suggested Alternative</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evaluation.alternativePhrasing.map((phrase, index) => (
                          <TableRow key={index}>
                            <TableCell>{phrase.original}</TableCell>
                            <TableCell>{phrase.suggested}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground p-4 text-center">No alternative phrasing suggestions available.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end gap-4">
                <Button onClick={handleRetake} variant="outline" disabled={isSubmitting}>Retake</Button>
                <Button onClick={handleSubmitForCompletion} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit to Complete Task'}
                </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
