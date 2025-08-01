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
  onRecordingComplete: (blob: Blob) => void;
  className?: string;
  disabled?: boolean;
}

const checkBrowserCompatibility = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Your browser does not support audio recording. Please try using a modern browser like Chrome, Firefox, or Edge.');
  }
};

export function AudioRecorder({ 
  onRecordingComplete, 
  className = '',
  disabled = false
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();

  // No need to fetch topic here, it's a presentation component
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
    setError(null);
    try {
      checkBrowserCompatibility();
      await checkMicrophonePermission();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        onRecordingComplete(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
      setError(err.message || 'Could not start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Stop all media tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const togglePauseResume = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setRecordingTime((prevTime) => prevTime + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  const handleCancel = () => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPaused(false);
    setError(null);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`w-full max-w-md p-4 bg-card text-card-foreground rounded-lg shadow-md ${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!audioBlob ? (
        <div className="flex flex-col items-center">
          <div className="text-2xl font-mono mb-4">{formatTime(recordingTime)}</div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={isRecording ? stopRecording : startRecording} 
              variant={isRecording ? "destructive" : "default"}
              size="icon" 
              className="rounded-full w-16 h-16"
              disabled={disabled}
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            {isRecording && (
              <Button onClick={togglePauseResume} variant="secondary" size="icon" className="rounded-full w-12 h-12">
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Click to start recording'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <audio 
            ref={audioRef} 
            src={audioUrl!} 
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="text-lg font-semibold mb-4">Recording Complete</div>
          <div className="flex items-center space-x-4">
            <Button onClick={togglePlay} size="icon" className="rounded-full w-14 h-14">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button onClick={handleCancel} variant="outline" size="icon" className="rounded-full w-14 h-14">
              <Trash2 className="h-6 w-6" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Preview or discard your recording.</p>
        </div>
      )}
    </div>
  );
}
