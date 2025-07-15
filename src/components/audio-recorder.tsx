'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth-context';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { topicsService, Topic } from '@/lib/topicsService';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string, topic?: string) => void;
  onCancel?: () => void;
  className?: string;
  topic?: string;
}

const checkBrowserCompatibility = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Your browser does not support audio recording. Please try using a modern browser like Chrome, Firefox, or Edge.');
  }
};

export function AudioRecorder({ 
  onRecordingComplete, 
  onCancel, 
  className = '',
  topic = ''
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordingTopic, setRecordingTopic] = useState(topic || '');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();

  // Fetch the current active topic when component loads
  useEffect(() => {
    const fetchActiveTopic = async () => {
      setIsLoadingTopic(true);
      try {
        const topic = await topicsService.getActiveTopic();
        setActiveTopic(topic);
        if (topic) {
          setRecordingTopic(topic.title);
        }
      } catch (error) {
        console.error('Error fetching active topic:', error);
      } finally {
        setIsLoadingTopic(false);
      }
    };
    
    fetchActiveTopic();
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (result.state === 'denied') {
        throw new Error('Microphone access is blocked. Please allow microphone access in your browser settings and try again.');
      }
    } catch (err) {
      // If the permissions API isn't supported, we'll try getUserMedia directly
      console.log('Permissions API not supported, will try getUserMedia directly');
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      checkBrowserCompatibility();
      await checkMicrophonePermission();
      audioChunksRef.current = [];
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setAudioBlob(null);
      }

      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      console.log('Microphone access granted, creating MediaRecorder...');
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed. Please try again.');
        stopRecording();
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started successfully');
        setError(null);
      };
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Received ${event.data.size} bytes of audio data`);
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        try {
          console.log('Recording stopped, processing audio...');
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          console.log(`Created audio blob of size ${audioBlob.size} bytes`);
          
          if (audioBlob.size === 0) {
            throw new Error('No audio data was recorded');
          }
          
          const url = URL.createObjectURL(audioBlob);
          setAudioBlob(audioBlob);
          setAudioUrl(url);
          setIsRecording(false);
            
          // Stop all tracks in the stream
          stream.getTracks().forEach(track => track.stop());
        } catch (err: any) {
          console.error('Error processing recording:', err);
          setError('Failed to process recording. Please try again.');
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const uploadToSupabase = async () => {
    if (!audioBlob || !user) {
      return null;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = 'webm';
      const fileName = `${uuidv4()}-recording.${fileExt}`;
      const filePath = `recordings/${user.id}/${fileName}`;
      
      // Start upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('recordings')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Get the public URL
      const { data: publicUrlData } = await supabase
        .storage
        .from('recordings')
        .getPublicUrl(filePath);
        
      if (!publicUrlData?.publicUrl) {
        throw new Error("Couldn't generate public URL");
      }
      
      setIsUploading(false);
      setUploadProgress(100);
      
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Error uploading recording:', err);
      setError(`Upload error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsUploading(false);
      return null;
    }
  };

  const handleSaveRecording = async () => {
    if (!audioBlob) return;
    
    // Upload to Supabase and get the URL
    const uploadedUrl = await uploadToSupabase();
    
    if (uploadedUrl) {
      // Pass the blob, URL and topic to the parent component
      onRecordingComplete(audioBlob, uploadedUrl, recordingTopic);
    }
  };

  const handleStartRecording = async () => {
    setError(null);
    try {
      await checkMicrophonePermission();
      checkBrowserCompatibility();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      mediaRecorderRef.current.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        audioChunksRef.current = [];
      });

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

    } catch (err) {
      console.error('Recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      if (!mediaRecorderRef.current) {
        throw new Error('No active recording');
      }

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      setIsRecording(false);
      setIsPaused(false);

      // Wait for the 'stop' event to process the audio
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!audioBlob || !audioUrl) {
        throw new Error('Recording failed to save');
      }

      onRecordingComplete(audioBlob, audioUrl, recordingTopic);
      
    } catch (err) {
      console.error('Stop recording error:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    if (onCancel) {
      onCancel();
    }
  };

  const RecordingStatus = () => {
    if (error) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      );
    }

    if (isRecording) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>Recording... {formatTime(recordingTime)}</span>
        </div>
      );
    }

    if (audioUrl) {
      return (
        <div className="flex items-center gap-2 text-green-500">
          <span>Recording saved - {formatTime(recordingTime)}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`flex flex-col items-center p-4 border rounded-lg bg-white shadow-sm ${className}`}>
      <RecordingStatus />
      
      <div className="flex flex-col items-center w-full">
        {/* Daily Topic Display */}
        {isLoadingTopic ? (
          <div className="w-full mb-6 p-3 border rounded-lg bg-gray-50">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : activeTopic ? (
          <div className="w-full mb-6 p-4 border rounded-lg bg-indigo-50 border-indigo-100">
            <h3 className="font-medium text-lg text-indigo-900 mb-2">Today's Speaking Topic:</h3>
            <p className="font-bold text-xl text-indigo-800 mb-3">{activeTopic.title}</p>
            <p className="text-sm text-indigo-700 whitespace-pre-wrap">{activeTopic.description}</p>
          </div>
        ) : (
          <div className="w-full mb-6 p-4 border rounded-lg bg-yellow-50 border-yellow-100">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">No topic available</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Please enter your own topic below or check back later when a daily topic is available.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Topic Input */}
        <div className="w-full mb-4">
          <Label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            {activeTopic ? 'Topic (pre-filled with today\'s topic)' : 'Topic (optional)'}
          </Label>
          <Input
            id="topic"
            type="text"
            placeholder="What are you talking about?"
            value={recordingTopic}
            onChange={(e) => setRecordingTopic(e.target.value)}
            className="w-full"
            disabled={isRecording}
          />
        </div>

        {/* Recording Status */}
        <div className="mb-4 text-center">
          {isRecording ? (
            <>
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="font-medium">Recording</span>
              </div>
              <div className="text-2xl font-bold">{formatTime(recordingTime)}</div>
            </>
          ) : audioUrl ? (
            <div className="font-medium text-green-700 mb-2">Recording ready</div>
          ) : (
            <div className="font-medium text-gray-600 mb-2">Ready to record</div>
          )}
        </div>
        
        {/* Audio playback */}
        {audioUrl && (
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            onEnded={handleAudioEnd} 
            className="hidden" 
          />
        )}
        
        {/* Controls */}
        <div className="flex flex-wrap gap-3 justify-center">
          {!isRecording && !audioUrl && (
            <Button 
              onClick={startRecording}
              variant="default"
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          )}
          
          {isRecording && (
            <Button 
              onClick={stopRecording}
              variant="outline"
              size="lg"
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          
          {audioUrl && (
            <>
              <Button 
                onClick={playRecording}
                variant="outline"
                size="sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </>
                )}
              </Button>
              
              <Button 
                onClick={deleteRecording}
                variant="outline"
                size="sm"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              
              <Button 
                onClick={startRecording}
                variant="outline"
                size="sm"
              >
                <Mic className="h-4 w-4 mr-1" />
                Record Again
              </Button>
              
              <Button 
                onClick={handleSaveRecording}
                variant="default"
                size="sm"
                disabled={isUploading}
                className="ml-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  'Use This Recording'
                )}
              </Button>
            </>
          )}
          
          {onCancel && !isRecording && !isUploading && (
            <Button 
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="text-gray-500"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
