'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ChevronLeft, Eye, BarChart, RefreshCw } from 'lucide-react'
import { AudioPlayer } from '@/components/audio-player'

interface Recording {
  id: string
  created_at: string
  topic: string
  audio_url: string
  transcription: string | null
  score: number | null
  feedback: string | null // Stored as JSON string
  submission_date: string;
}

interface ParsedFeedback {
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
    topicAdherence: {
        score: number;
        feedback: string;
    } | number | null;
}

interface DisplayRecording extends Recording {
    parsedFeedback: ParsedFeedback | null;
    audioBlob?: Blob;
}


export default function RecordingHistory() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [recordings, setRecordings] = useState<DisplayRecording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecording, setSelectedRecording] = useState<DisplayRecording | null>(null)
  const [isTranscriptDialogOpen, setIsTranscriptDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const parseFeedback = (feedback: string | null): ParsedFeedback | null => {
    if (!feedback) return null;
    try {
      // Check if feedback is already an object
      if (typeof feedback === 'object') {
        return feedback as ParsedFeedback;
      }
      
      // Check if the string looks like valid JSON before parsing
      if (typeof feedback === 'string') {
        const trimmed = feedback.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return JSON.parse(trimmed);
        }
        // Not JSON format, return null or handle as needed
        console.error('Feedback is not in JSON format:', feedback);
      }
      return null;
    } catch (e) {
      console.error('Error parsing AI feedback:', e);
      return null;
    }
  };

  const fetchRecordings = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('submission_date', { ascending: false });

      if (error) {
        console.error('Error fetching recordings:', error)
        throw error;
      }

      const processedData: DisplayRecording[] = await Promise.all(
          data.map(async (rec) => {
              let audioBlob: Blob | undefined = undefined;
              try {
                  const response = await fetch(rec.audio_url);
                  if(response.ok) {
                    audioBlob = await response.blob();
                  }
              } catch (e) {
                  console.error("Could not fetch audio blob for " + rec.audio_url, e);
              }

              return {
                  ...rec,
                  parsedFeedback: parseFeedback(rec.ai_feedback), // Corrected from rec.feedback
                  audioBlob: audioBlob,
              };
          })
      );

      setRecordings(processedData);
    } catch (err) {
      console.error('Error in fetchRecordings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchRecordings()
    }
  }, [user, fetchRecordings])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (e) {
      return 'Invalid date'
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Submission History</h1>
            <p className="text-muted-foreground">Review your past submissions and AI feedback.</p>
        </div>
        <Button 
            variant="outline"
            size="sm"
            onClick={fetchRecordings}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold">No Submissions Yet</h3>
              <p className="text-muted-foreground mt-2">
                Complete your first recording task to see your history here.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => router.push('/dashboard/recordings')}
              >
                Go to Recordings
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Audio</TableHead>
                  <TableHead>Transcript</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordings.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>{formatDate(rec.submission_date)}</TableCell>
                    <TableCell>{rec.topic}</TableCell>
                    <TableCell>{rec.score ?? 'N/A'}</TableCell>
                    <TableCell>
                      {rec.audioBlob ? (
                        <AudioPlayer audioBlob={rec.audioBlob} />
                      ) : (
                        <span className="text-xs text-muted-foreground">No audio</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedRecording(rec);
                          setIsTranscriptDialogOpen(true);
                        }}
                        disabled={!rec.transcription}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedRecording(rec);
                          setIsFeedbackDialogOpen(true);
                        }}
                        disabled={!rec.parsedFeedback}
                      >
                        <BarChart className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog open={isTranscriptDialogOpen} onOpenChange={setIsTranscriptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transcript</DialogTitle>
            <DialogDescription>
              {selectedRecording?.transcription || "No transcript available."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Feedback Analysis</DialogTitle>
          </DialogHeader>
          {selectedRecording?.parsedFeedback ? (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{selectedRecording.parsedFeedback.overallScore}/100</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Confidence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg">{selectedRecording.parsedFeedback.confidence}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filler Words</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedRecording.parsedFeedback.fillerWords.count > 0 ? (
                    <p>{selectedRecording.parsedFeedback.fillerWords.count} found: <span className="font-mono bg-muted p-1 rounded">{selectedRecording.parsedFeedback.fillerWords.words.join(', ')}</span></p>
                  ) : (
                    <p>None detected. Great job!</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grammar Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{selectedRecording.parsedFeedback.grammarFeedback}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Topic Adherence</CardTitle>
                </CardHeader>
                <CardContent>
                  {typeof selectedRecording.parsedFeedback.topicAdherence === 'object' && selectedRecording.parsedFeedback.topicAdherence !== null ? (
                    <p><span className="font-bold">{selectedRecording.parsedFeedback.topicAdherence.score}/10</span>: {selectedRecording.parsedFeedback.topicAdherence.feedback}</p>
                  ) : (
                    <p>N/A</p>
                  )}
                </CardContent>
              </Card>
              {selectedRecording.parsedFeedback.alternativePhrasing.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Alternative Phrasing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedRecording.parsedFeedback.alternativePhrasing.map((phrase, index) => (
                        <li key={index} className="border-b pb-2">
                          <p className="text-sm text-muted-foreground">Original: "{phrase.original}"</p>
                          <p className="text-sm">Suggested: "{phrase.suggested}"</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p>No detailed feedback available.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
