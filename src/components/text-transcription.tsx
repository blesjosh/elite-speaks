'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import { Mic, Download } from 'lucide-react';

// Define a type for the Deepgram response structure for better type safety
interface DeepgramResponse {
  results?: {
    channels: {
      alternatives: {
        transcript: string;
      }[];
      search?: {
        query: string;
        hits: {
          start: number;
          snippet: string;
        }[];
      }[];
    }[];
  };
  // Also handle the legacy/direct format
  channels?: {
    alternatives: {
      transcript: string;
    }[];
    search?: {
      query: string;
      hits: {
        start: number;
        snippet: string;
      }[];
    }[];
  }[];
  // Simple transcript fallback
  transcript?: string;
}

// Define a type for the AI evaluation response
interface EvaluationResponse {
  overallScore: number;
  confidence: string;
  fillerWords: {
    count: number;
    words: string[];
  };
  grammarFeedback: string;
  alternativePhrasing: Array<{
    original: string;
    suggested: string;
  }>;
}

export interface TranscriptionComponentProps {
  onTranscriptionComplete?: (transcript: string) => void;
  className?: string;
  topic?: string;
}

export default function TranscriptionComponent({ onTranscriptionComplete, className = '', topic = '' }: TranscriptionComponentProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [searchHits, setSearchHits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAudioFile(event.target.files[0]);
      setError(''); // Clear any previous errors
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      setError('Please select an audio file first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setTranscript('');
    setSearchHits([]);
    setEvaluation(null);

    const formData = new FormData();
    formData.append('audio', audioFile);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Error: ${response.statusText}`);
      }

      const result: DeepgramResponse = await response.json();
      
      // Debug the actual response structure
      console.log('Deepgram API response:', JSON.stringify(result, null, 2));
      
      // Handle different response formats from Deepgram
      let transcriptText = '';
      let hits: any[] = [];

      // New Deepgram SDK v2 format (results.channels)
      if (result.results?.channels && result.results.channels.length > 0) {
        console.log('Using results.channels format');
        transcriptText = result.results.channels[0]?.alternatives[0]?.transcript || '';
        hits = result.results.channels[0]?.search?.find(s => s.query === 'ahh')?.hits || [];
      }
      // Older format (channels directly on the response)
      else if (result.channels && result.channels.length > 0) {
        console.log('Using channels format');
        transcriptText = result.channels[0]?.alternatives[0]?.transcript || '';
        hits = result.channels[0]?.search?.find(s => s.query === 'ahh')?.hits || [];
      }
      // Simple format with just a transcript field
      else if (result.transcript) {
        console.log('Using transcript format');
        transcriptText = result.transcript;
      } else {
        console.warn('Unrecognized response format:', result);
      }
      
      // Fallback if no transcript found
      if (!transcriptText) {
        transcriptText = 'No transcript found.';
      }

      setTranscript(transcriptText);
      
      // Call the callback if provided
      if (onTranscriptionComplete) {
        onTranscriptionComplete(transcriptText);
      }

      // Store search hits but don't display them separately
      setSearchHits(hits);
      
      // Get AI evaluation if we have a transcript
      if (transcriptText && transcriptText !== 'No transcript found.') {
        await getAIEvaluation(transcriptText, hits);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getAIEvaluation = async (transcriptText: string, hits: any[] = []) => {
    try {
      setIsEvaluating(true);
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transcript: transcriptText,
          topic: topic || undefined 
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('Evaluation failed:', errData);
        setError('Failed to get AI evaluation. Please try again.');
        return;
      }

      const result = await response.json();
      console.log('AI Evaluation:', result);
      
      // Validate and sanitize the evaluation result
      const sanitizedResult = {
        overallScore: typeof result.overallScore === 'number' ? result.overallScore : 0,
        confidence: typeof result.confidence === 'string' ? result.confidence : 'No confidence data available',
        fillerWords: {
          count: typeof result.fillerWords?.count === 'number' ? result.fillerWords.count : 0,
          words: Array.isArray(result.fillerWords?.words) ? result.fillerWords.words.filter((word: any) => typeof word === 'string') : []
        },
        grammarFeedback: typeof result.grammarFeedback === 'string' ? result.grammarFeedback : '',
        alternativePhrasing: Array.isArray(result.alternativePhrasing) ? 
          result.alternativePhrasing.filter((phrase: any) => 
            phrase && 
            typeof phrase.original === 'string' && 
            typeof phrase.suggested === 'string'
          ) : []
      };
      
      // Add "ahh" sounds to filler words if detected
      if (hits && hits.length > 0) {
        // Add "ahh" to filler words if not already included
        if (!sanitizedResult.fillerWords.words.includes("ahh")) {
          sanitizedResult.fillerWords.words.push("ahh");
          sanitizedResult.fillerWords.count += 1;
        }
        
        setEvaluation(sanitizedResult);
        
        // Save this evaluation to Supabase
        await saveToSupabase(transcriptText, sanitizedResult, audioFile);
      } else {
        setEvaluation(sanitizedResult);
        
        // Save this evaluation to Supabase
        await saveToSupabase(transcriptText, sanitizedResult, audioFile);
      }
      
      // Call onTranscriptionComplete with transcript
      if (onTranscriptionComplete) {
        onTranscriptionComplete(transcriptText);
      }
    } catch (err) {
      console.error('Failed to get AI evaluation:', err);
      setError('Error during AI evaluation: ' + (err as Error).message);
    } finally {
      setIsEvaluating(false);
    }
  };
  
  const saveToSupabase = async (transcript: string, evaluationResult: any, audioFile: File | null) => {
    try {
      console.log('Starting saveToSupabase function with simplified approach...');
      console.log('Evaluation result:', evaluationResult);
      
      // Import supabase client on demand to avoid SSR issues
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }
      
      console.log('Authenticated user found:', user.id);
      
      let audioUrl = null;
      
      // Upload audio file if exists
      if (audioFile) {
        const fileName = `recordings/${user.id}/${Date.now()}-${audioFile.name}`;
        console.log('Uploading audio file to path:', fileName);
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('recordings')
          .upload(fileName, audioFile);
        
        if (uploadError) {
          console.error('Error uploading audio:', uploadError);
        } else if (uploadData) {
          console.log('Audio file uploaded successfully:', uploadData);
          
          // Get public URL
          const { data: publicUrl } = supabase
            .storage
            .from('recordings')
            .getPublicUrl(fileName);
            
          audioUrl = publicUrl?.publicUrl;
          console.log('Generated audio URL:', audioUrl);
        }
      }
      
      try {
        // Skip column checking - directly create record object with all expected fields
        const recordData = {
          user_id: user.id,
          transcript: transcript || null,
          audio_url: audioUrl || null,
          score: evaluationResult.overallScore || null,
          ai_feedback: {
            confidence: evaluationResult.confidence,
            fillerWords: evaluationResult.fillerWords,
            grammarFeedback: evaluationResult.grammarFeedback,
            alternativePhrasing: evaluationResult.alternativePhrasing
          }
        };
        
        console.log('Inserting record with direct approach:', JSON.stringify(recordData, null, 2));
        
        // Insert record into database - ensure we use .select() to see what was actually inserted
        const { data: insertedData, error: insertError } = await supabase
          .from('recordings')
          .insert(recordData)
          .select();
          
        if (insertError) {
          console.error('Error saving to Supabase:', insertError);
          
          // Show a helpful error message
          if (insertError.code === 'PGRST204' || insertError.message?.includes('column') || insertError.message?.includes('does not exist')) {
            console.error('Database setup issue detected.');
            
            // Try a direct approach with only the required fields
            console.log('Trying fallback approach with minimal fields...');
            
            // Create minimal record with only required fields
            const minimalRecord = {
              user_id: user.id
            };
            
            // Try to add each field one by one to identify the problematic column
            try {
              await supabase.from('recordings').insert(minimalRecord);
              console.log('Minimal insert succeeded - problem is with optional fields');
              
              alert('Warning: Some fields could not be saved. The recording was saved with basic information only.');
              return;
            } catch (minimalError) {
              console.error('Even minimal insert failed:', minimalError);
              alert('Could not save recording. Please run the database setup script from the dashboard.');
            }
          } else {
            alert('Error saving recording: ' + insertError.message);
          }
        } else {
          console.log('Successfully saved recording to Supabase with data:', insertedData);
        }
      } catch (err) {
        console.error('Error saving to Supabase:', err);
        alert('Unexpected error saving recording. Please check the console.');
      }
    } catch (err) {
      console.error('Failed in saveToSupabase function:', err);
    }
  };

  const downloadTranscript = () => {
    if (!transcript) return;
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${audioFile?.name || 'audio'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Upload the file and complete the task
        </CardTitle>
        <CardDescription>
          {topic ? (
            <div>
              <div className="font-semibold text-blue-600">Topic: {topic}</div>
              <div className="text-sm text-gray-600 mt-1">
                Upload your audio file where you speak about the topic above
              </div>
            </div>
          ) : (
            "Upload your audio file to get transcription and AI feedback"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select audio file</label>
            <input 
              type="file" 
              accept="audio/*,video/*" 
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {audioFile && (
              <p className="text-xs text-gray-500 mt-1">
                {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleSubmit} 
              disabled={!audioFile || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Transcribe
                </>
              )}
            </Button>
            
            {transcript && (
              <>
                <Button 
                  variant="outline"
                  onClick={downloadTranscript}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => getAIEvaluation(transcript)}
                  disabled={isEvaluating || !transcript}
                  className="flex items-center gap-2"
                >
                  {isEvaluating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Analysis
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Status messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-blue-800 text-sm">Transcribing your audio...</p>
              </div>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-medium mb-2">Transcript:</h3>
              <div className="bg-white border p-3 rounded-md max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>
          )}
          
          {/* We no longer display "Ahh" Sounds separately - they are integrated into the filler words section */}
          
          {/* AI Evaluation Loading */}
          {isEvaluating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-blue-800 text-sm">Analyzing your speech with AI...</p>
              </div>
            </div>
          )}
          
          {/* AI Evaluation Results */}
          {evaluation && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-indigo-900">AI Speech Evaluation</h3>
                <div className="bg-indigo-100 text-indigo-800 font-medium px-3 py-1 rounded-full text-sm">
                  Score: {evaluation.overallScore || 0}/100
                </div>
              </div>
              
              {/* Confidence */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-indigo-800 mb-1">Confidence</h4>
                <p className="text-sm text-indigo-700 bg-white p-2 rounded border border-indigo-100">
                  {typeof evaluation.confidence === 'string' ? evaluation.confidence : 'No confidence data available'}
                </p>
              </div>
              
              {/* Filler Words */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-indigo-800 mb-1">
                  Filler Words ({evaluation.fillerWords?.count || 0})
                </h4>
                {evaluation.fillerWords?.count > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {evaluation.fillerWords.words?.map((word, i) => (
                        <span 
                          key={`filler-${i}`} 
                          className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                        >
                          {typeof word === 'string' ? word : 'unknown'}
                        </span>
                      )) || []}
                    </div>
                    
                    {/* If "ahh" is in the filler words and we have search hits, show timestamps */}
                    {evaluation.fillerWords.words?.includes("ahh") && searchHits.length > 0 && (
                      <div className="bg-yellow-50 rounded p-2 text-sm">
                        <p className="text-yellow-800 font-medium mb-1">Timestamps of "ahh" sounds:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                          {searchHits.map((hit, index) => (
                            <div key={`hit-${index}`} className="text-xs text-yellow-800">
                              {hit?.start ? hit.start.toFixed(2) : 0}s: "{hit?.snippet || ''}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-green-600">No filler words detected! Great job!</p>
                )}
              </div>
              
              {/* Grammar Feedback */}
              <div className="mb-3">
                <h4 className="text-sm font-medium text-indigo-800 mb-1">Grammar Feedback</h4>
                <div className="bg-white rounded border border-indigo-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-indigo-50 hover:bg-indigo-50">
                        <TableHead className="text-indigo-800 font-medium">Issue</TableHead>
                        <TableHead className="text-indigo-800 font-medium">Suggestion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!evaluation.grammarFeedback || typeof evaluation.grammarFeedback !== 'string' || evaluation.grammarFeedback.trim() === '' ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-green-600">
                            No grammar issues detected. Great job!
                          </TableCell>
                        </TableRow>
                      ) : (
                        evaluation.grammarFeedback.split('\n')
                          .filter(line => line && typeof line === 'string' && line.trim())
                          .map((point, index) => {
                            // Try to extract problem and solution
                            let problem = point;
                            let solution = "";
                            
                            // Handle different formats like "problem - solution" or "problem: solution"
                            if (point.includes(" - ")) {
                              [problem, solution] = point.split(" - ", 2).map(p => p.trim());
                            } else if (point.includes(":")) {
                              [problem, solution] = point.split(":", 2).map(p => p.trim());
                            }
                            
                            if (!solution) solution = "Correct this issue";
                            
                            return (
                              <TableRow key={`grammar-${index}`} className={index % 2 === 0 ? '' : 'bg-indigo-50/30'}>
                                <TableCell className="text-indigo-700 text-sm align-top whitespace-normal break-words">
                                  {String(problem || 'Grammar issue')}
                                </TableCell>
                                <TableCell className="text-indigo-700 text-sm align-top whitespace-normal break-words">
                                  {String(solution || 'Review and correct')}
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Alternative Phrasing */}
              {evaluation.alternativePhrasing && Array.isArray(evaluation.alternativePhrasing) && evaluation.alternativePhrasing.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-indigo-800 mb-1">Suggested Improvements</h4>
                  <div className="bg-white rounded border border-indigo-100 overflow-hidden max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-indigo-50 hover:bg-indigo-50">
                          <TableHead className="text-indigo-800 font-medium">Original Phrase</TableHead>
                          <TableHead className="text-indigo-800 font-medium">Suggested Improvement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evaluation.alternativePhrasing.map((phrase, i) => (
                          <TableRow key={`phrase-${i}`} className={i % 2 === 0 ? '' : 'bg-indigo-50/30'}>
                            <TableCell className="text-red-600 text-sm align-top whitespace-normal break-words">
                              "{String(phrase?.original || 'Unknown phrase')}"
                            </TableCell>
                            <TableCell className="text-green-600 text-sm align-top whitespace-normal break-words">
                              "{String(phrase?.suggested || 'No suggestion')}"
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}