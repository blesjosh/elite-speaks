'use client'

import { useState, useEffect } from 'react'
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
import { ChevronLeft, Eye, Volume2, BarChart, Info } from 'lucide-react'
import { AudioPlayer } from '@/components/audio-player'

interface RecordingHistory {
  id: string
  created_at: string
  user_id: string
  topic?: string
  audio_url?: string
  transcript?: string
  score?: number
  // Define ai_feedback with both object and string possibilities since 
  // Supabase might return it differently depending on how it was saved
  ai_feedback?: {
    confidence?: string
    fillerWords?: {
      count: number
      words: string[]
    }
    grammarFeedback?: string
    alternativePhrasing?: Array<{
      original: string
      suggested: string
    }>
  } | string | null
}

export default function RecordingHistory() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [recordings, setRecordings] = useState<RecordingHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecording, setSelectedRecording] = useState<RecordingHistory | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Function to refresh recordings data
  const fetchRecordings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      console.log('Fetching recordings for user:', user.id)
      
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching recordings:', error)
        return
      }

      console.log('Raw recordings data from Supabase:', data)
      
      // Process the data to ensure ai_feedback is properly structured
      const processedData = data?.map(recording => {
        // Handle case where ai_feedback might be a string
        if (recording.ai_feedback && typeof recording.ai_feedback === 'string') {
          try {
            recording.ai_feedback = JSON.parse(recording.ai_feedback);
            console.log('Parsed ai_feedback from string:', recording.id);
          } catch (e) {
            console.error('Error parsing ai_feedback string:', e);
            // Keep as string if parsing fails
          }
        }
        
        // Fix missing score - if we have an evaluation with overallScore but no score field
        if (!recording.score && recording.ai_feedback && 
            typeof recording.ai_feedback === 'object' && 
            recording.ai_feedback.overallScore) {
          recording.score = parseInt(recording.ai_feedback.overallScore);
          if (isNaN(recording.score)) recording.score = null;
          console.log('Fixed missing score for recording:', recording.id, recording.score);
        }
        
        return recording;
      });
      
      // Check structure of the returned data
      if (processedData && processedData.length > 0) {
        console.log('First recording sample:', {
          id: processedData[0].id,
          created_at: processedData[0].created_at,
          transcript: processedData[0].transcript ? processedData[0].transcript.substring(0, 50) + '...' : 'No transcript',
          audio_url: processedData[0].audio_url || 'No audio URL',
          score: processedData[0].score,
          ai_feedback_type: processedData[0].ai_feedback ? typeof processedData[0].ai_feedback : 'none',
          ai_feedback_keys: processedData[0].ai_feedback && typeof processedData[0].ai_feedback === 'object' 
            ? Object.keys(processedData[0].ai_feedback) : []
        })
      }

      setRecordings(processedData || [])
    } catch (error) {
      console.error('Error fetching recordings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRecordings()
    }
  }, [user])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a')
    } catch (e) {
      return 'Invalid date'
    }
  }

  const playAudio = (audioUrl: string) => {
    console.log('Attempting to play audio from URL:', audioUrl)
    
    // Ensure the URL is properly formatted
    let url = audioUrl
    
    // Handle CORS by potentially fixing URLs
    if (url.includes('supabase.co/storage/v1/object')) {
      // This is a Supabase storage URL, make sure it's using the public URL format
      try {
        // Parse the URL to extract the path
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/')
        
        // Extract bucket and path components
        const bucketIndex = pathParts.indexOf('object') + 1
        if (bucketIndex > 0 && bucketIndex < pathParts.length) {
          const bucket = pathParts[bucketIndex]
          const objectPath = pathParts.slice(bucketIndex + 1).join('/')
          
          // Log what we found for debugging
          console.log('Detected Supabase storage URL:', {
            bucket,
            objectPath,
            originalUrl: url
          })
          
          // Try to create a direct download URL (may help with CORS)
          url = `${urlObj.origin}/storage/v1/object/public/${bucket}/${objectPath}`
          console.log('Converted to public URL:', url)
        }
      } catch (e) {
        console.error('Error parsing audio URL:', e)
      }
    }
    
    try {
      const audio = new Audio(url)
      
      // Add error listener for better diagnostics
      audio.addEventListener('error', (e) => {
        console.error('Audio element error:', e)
        alert(`Could not play the audio file. Error: ${audio.error?.message || 'Unknown error'}`)
      })
      
      // Add loaded listener to confirm successful loading
      audio.addEventListener('canplaythrough', () => {
        console.log('Audio loaded and ready to play')
      })
      
      // Try to play the audio
      audio.play().catch(error => {
        console.error('Error playing audio:', error)
        alert('Could not play the audio file. It may be inaccessible due to permissions or format issues.')
      })
    } catch (e) {
      console.error('Exception creating audio element:', e)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Recording History</h1>
        <p className="text-gray-600">Review your past recordings, transcripts, and AI feedback</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Your Recordings</CardTitle>
          <Button 
            variant="outline"
            size="sm"
            onClick={fetchRecordings}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                </svg>
                <span>Refresh</span>
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recordings found</p>
              <Button 
                className="mt-4" 
                onClick={() => router.push('/dashboard')}
              >
                Record Something New
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Recording</TableHead>
                    <TableHead>Transcript</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordings.map((recording) => (
                    <TableRow key={recording.id}>
                      <TableCell>
                        {new Date(recording.created_at).toLocaleDateString()} • {new Date(recording.created_at).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{recording.topic || 'Untitled'}</TableCell>
                      <TableCell>
                        {recording.audio_url ? (
                          <AudioPlayer audioUrl={recording.audio_url} />
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {recording.transcript ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="p-0 h-8 w-8"
                            onClick={() => {
                              setSelectedRecording(recording);
                              setShowTranscript(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {recording.score !== null && recording.score !== undefined ? (
                          <div className="bg-blue-100 text-blue-800 text-xs font-medium rounded px-2 py-0.5 w-fit">
                            {recording.score}/100
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {recording.ai_feedback ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="p-0 h-8 w-8"
                            onClick={() => {
                              setSelectedRecording(recording);
                              setShowFeedback(true);
                            }}
                          >
                            <BarChart className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transcript</DialogTitle>
            <DialogDescription>
              {selectedRecording?.topic ? `Topic: ${selectedRecording.topic}` : 'Recorded on ' + formatDate(selectedRecording?.created_at || '')}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {selectedRecording?.transcript || 'No transcript available.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Speech Evaluation</DialogTitle>
            <DialogDescription>
              {selectedRecording?.topic ? `Topic: ${selectedRecording.topic}` : 'Recorded on ' + formatDate(selectedRecording?.created_at || '')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-indigo-900">Evaluation Results</h3>
              <div className="bg-indigo-100 text-indigo-800 font-medium px-3 py-1 rounded-full text-sm">
                Score: {selectedRecording?.score || 'N/A'}/100
              </div>
            </div>
            
            {/* Debug info - hidden in production
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Debug info:</strong> AI Feedback type: {selectedRecording?.ai_feedback ? typeof selectedRecording.ai_feedback : 'null'}
              {selectedRecording?.ai_feedback && typeof selectedRecording.ai_feedback === 'string' && (
                <div className="mt-1 overflow-x-auto">
                  <p>AI Feedback content (string): {selectedRecording.ai_feedback.substring(0, 100)}...</p>
                </div>
              )}
              {selectedRecording?.ai_feedback && typeof selectedRecording.ai_feedback === 'object' && (
                <div className="mt-1">
                  <p>AI Feedback keys: {Object.keys(selectedRecording.ai_feedback).join(', ')}</p>
                </div>
              )}
            </div> 
            */}
            
            {/* Handle ai_feedback as object */}
            {selectedRecording?.ai_feedback && typeof selectedRecording.ai_feedback === 'object' && (
              <>
                {/* Confidence */}
                {'confidence' in selectedRecording.ai_feedback && selectedRecording.ai_feedback.confidence && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-indigo-800 mb-1">Confidence</h4>
                    <p className="text-sm text-indigo-700 bg-white p-2 rounded border border-indigo-100">
                      {selectedRecording.ai_feedback.confidence}
                    </p>
                  </div>
                )}
                
                {/* Filler Words */}
                {'fillerWords' in selectedRecording.ai_feedback && selectedRecording.ai_feedback.fillerWords && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-indigo-800 mb-1">
                      Filler Words ({selectedRecording.ai_feedback.fillerWords.count})
                    </h4>
                    {selectedRecording.ai_feedback.fillerWords.count > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(selectedRecording.ai_feedback.fillerWords.words || []).map((word: any, i: number) => (
                          <span 
                            key={`filler-${i}`} 
                            className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
                          >
                            {String(word)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-green-600">No filler words detected! Great job!</p>
                    )}
                  </div>
                )}
                
                {/* Grammar Feedback */}
                {'grammarFeedback' in selectedRecording.ai_feedback && selectedRecording.ai_feedback.grammarFeedback && (
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
                          {typeof selectedRecording.ai_feedback.grammarFeedback !== 'string' || selectedRecording.ai_feedback.grammarFeedback.trim() === '' ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-green-600">
                                No grammar issues detected. Great job!
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedRecording.ai_feedback.grammarFeedback.split('\n')
                              .filter((line: string) => line.trim())
                              .map((point: string, index: number) => {
                                // Try to extract problem and solution
                                let problem = point;
                                let solution = "";
                                
                                // Handle different formats like "problem - solution" or "problem: solution"
                                if (point.includes(" - ")) {
                                  [problem, solution] = point.split(" - ", 2).map((p: string) => p.trim());
                                } else if (point.includes(":")) {
                                  [problem, solution] = point.split(":", 2).map((p: string) => p.trim());
                                }
                                
                                if (!solution) solution = "Correct this issue";
                                
                                return (
                                  <TableRow key={`grammar-${index}`} className={index % 2 === 0 ? '' : 'bg-indigo-50/30'}>
                                    <TableCell className="text-indigo-700 text-sm align-top whitespace-normal break-words">
                                      {String(problem)}
                                    </TableCell>
                                    <TableCell className="text-indigo-700 text-sm align-top whitespace-normal break-words">
                                      {String(solution)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                {/* Alternative Phrasing */}
                {'alternativePhrasing' in selectedRecording.ai_feedback && 
                  selectedRecording.ai_feedback.alternativePhrasing && 
                  selectedRecording.ai_feedback.alternativePhrasing.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-indigo-800 mb-1">Suggested Improvements</h4>
                      <div className="bg-white rounded border border-indigo-100 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-indigo-50 hover:bg-indigo-50">
                              <TableHead className="text-indigo-800 font-medium">Original Phrase</TableHead>
                              <TableHead className="text-indigo-800 font-medium">Suggested Improvement</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedRecording.ai_feedback.alternativePhrasing.map((phrase: any, i: number) => (
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
              </>
            )}
            
            {/* Handle ai_feedback as string */}
            {selectedRecording?.ai_feedback && typeof selectedRecording.ai_feedback === 'string' && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-indigo-800 mb-1">AI Feedback</h4>
                <p className="text-sm text-indigo-700 bg-white p-2 rounded border border-indigo-100 whitespace-pre-wrap">
                  {selectedRecording.ai_feedback}
                </p>
              </div>
            )}
            
            {/* No AI feedback case */}
            {!selectedRecording?.ai_feedback && (
              <div className="text-center py-4">
                <p className="text-indigo-800">No AI feedback available for this recording.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
