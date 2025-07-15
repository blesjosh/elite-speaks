'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Mic, Video, BarChart3, Settings, LogOut, FileText, Database, AlertCircle } from 'lucide-react'
import TranscriptionComponent from '@/components/text-transcription'
import { AudioRecorder } from '@/components/audio-recorder'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { topicsService, Topic } from '@/lib/topicsService'



export default function RecordingsPage() {
  const { user, loading, signOut, isAdmin, checkAdminStatus } = useAuth()
  const router = useRouter()
  const [dbStatus, setDbStatus] = useState<{ ok: boolean, message: string }>({ ok: true, message: 'Checking database status...' })
  const [isCheckingDb, setIsCheckingDb] = useState(false)
  const [showDatabaseHelp, setShowDatabaseHelp] = useState(false)
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null)
  const [isLoadingTopic, setIsLoadingTopic] = useState(true)
  
  // State for recording feature
  const [isProcessingRecording, setIsProcessingRecording] = useState(false)
  const [recordedTranscript, setRecordedTranscript] = useState<string | null>(null)
  const [recordedEvaluation, setRecordedEvaluation] = useState<any | null>(null)
  const [recordingError, setRecordingError] = useState<string | null>(null)

  // Debug logging for evaluation data
  useEffect(() => {
    if (recordedEvaluation) {
      console.log('🔍 Debug - recordedEvaluation updated:', JSON.stringify(recordedEvaluation, null, 2));
      console.log('🔍 Debug - recordedEvaluation type:', typeof recordedEvaluation);
      console.log('🔍 Debug - recordedEvaluation keys:', Object.keys(recordedEvaluation));
      
      // Check each property
      Object.entries(recordedEvaluation).forEach(([key, value]) => {
        console.log(`🔍 Debug - ${key}:`, typeof value, value);
      });
    }
  }, [recordedEvaluation]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      checkDatabaseStatus()
      fetchCurrentTopic()
      // Make sure admin status is updated
      checkAdminStatus()
    }
  }, [user, loading, router, checkAdminStatus])

  const fetchCurrentTopic = async () => {
    try {
      setIsLoadingTopic(true)
      const topic = await topicsService.getActiveTopic()
      setCurrentTopic(topic)
    } catch (error) {
      console.error('Error fetching current topic:', error)
    } finally {
      setIsLoadingTopic(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const checkDatabaseStatus = async () => {
    if (!user) return
    
    setIsCheckingDb(true)
    try {
      // Check if recordings table exists and has required columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('recordings')
        .select('id, audio_url, transcript')
        .limit(1)
      
      if (columnsError) {
        console.error('Database check error:', columnsError)
        setDbStatus({
          ok: false,
          message: columnsError.message || 'Database issue detected. Table or columns may be missing.'
        })
        setShowDatabaseHelp(true)
      } else {
        setDbStatus({
          ok: true,
          message: 'Database is properly configured.'
        })
      }
    } catch (err) {
      console.error('Failed to check database:', err)
      setDbStatus({
        ok: false,
        message: 'Could not verify database setup.'
      })
      setShowDatabaseHelp(true)
    } finally {
      setIsCheckingDb(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 md:py-6 space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-['Inter_Tight']">
                Elite Speaks Dashboard
              </h1>
              <p className="text-sm md:text-base text-gray-600">Welcome back, {user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="w-full md:w-auto">
                  Dashboard Home
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/dashboard/admin/topics">
                  <Button variant="outline" size="sm" className="w-full md:w-auto bg-amber-50 border-amber-200 text-amber-800">
                    <Database className="w-4 h-4 mr-2" />
                    Manage Topics
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" className="w-full md:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full md:w-auto">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Main Card: Recording/Upload */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div>
                  <CardTitle className="py-2">
                    {currentTopic ? `Practice Speaking: ${currentTopic.title}` : 'Practice Speaking'}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    {currentTopic 
                      ? `Speak about the topic above for at least 3 minutes` 
                      : 'Record your voice or upload an audio file to practice speaking'
                    }
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/recordings/history')}
                  className="flex items-center w-full md:w-auto justify-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Past Recordings
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="text-sm md:text-base">Upload Audio</TabsTrigger>
                    <TabsTrigger value="record" className="text-sm md:text-base">Record Audio</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload">
                    <div className="py-4">
                      <TranscriptionComponent 
                        topic={currentTopic?.title || ''}
                        onTranscriptionComplete={(transcript) => {
                          console.log("Transcription completed:", transcript.substring(0, 100) + "...");
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="record">
                    <div className="py-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium">Record Your Beautiful Voice</h3>
                        <p className="text-sm text-gray-600">Click the record button to start</p>
                      </div>
                      
                      {/* Show AudioRecorder if no transcript yet, or processing */}
                      {(!recordedTranscript || isProcessingRecording) && (
                        <AudioRecorder
                          topic={currentTopic?.title || ''}
                          onRecordingComplete={async (audioBlob, audioUrl, topic) => {
                            // ...existing code...
                          }}
                        />
                      )}
                      {/* Loading indicator */}
                      {isProcessingRecording && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-sm text-gray-600">Processing your recording...</p>
                        </div>
                      )}
                      {/* Error message */}
                      {recordingError && (
                        <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
                          <p className="font-medium">Error</p>
                          <p className="text-sm">{recordingError}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setRecordingError(null)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                      {/* Show transcript and evaluation if available */}
                      {recordedTranscript && !isProcessingRecording && (
                        <div className="mt-6">
                          {/* Transcript Section */}
                          <div className="mb-4">
                            <h3 className="text-lg font-medium">Your speech in words</h3>
                            <div className="mt-2 p-3 bg-white border rounded-lg whitespace-pre-wrap text-sm">
                              {String(recordedTranscript)}
                            </div>
                          </div>
                          {/* Evaluation Section */}
                          <div className="mt-6">
                            {/* ...existing code for evaluation rendering... */}
                          </div>
                          {/* Record Another Button */}
                          <div className="mt-6 flex justify-end">
                            <Button
                              onClick={() => {
                                // Reset state to allow another recording
                                setRecordedTranscript(null);
                                setRecordedEvaluation(null);
                              }}
                            >
                              Record Another
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Card */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <BarChart3 className="w-5 h-5" />
                    Your Progress
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Track your speaking improvements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar: Recordings this week */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-sm md:text-base mb-1">
                        <span className="text-gray-700">Recordings this week</span>
                        <span className="font-semibold text-gray-900">3/5</span>
                      </div>
                      <div className="relative h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>

                    {/* Progress Bar: Average score */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-sm md:text-base mb-1">
                        <span className="text-gray-700">Average score</span>
                        <span className="font-semibold text-gray-900">76/100</span>
                      </div>
                      <div className="relative h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full bg-green-500 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>

                    {/* Progress Bar: Weekly goal */}
                    <div>
                      <div className="flex justify-between items-center text-sm md:text-base mb-1">
                        <span className="text-gray-700">Weekly goal</span>
                        <span className="font-semibold text-gray-900">60%</span>
                      </div>
                      <div className="relative h-2 md:h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link 
                    href="/dashboard/recordings/history" 
                    className="text-blue-600 hover:text-blue-800 text-sm md:text-base w-full text-center md:text-left"
                  >
                    View detailed stats →
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
