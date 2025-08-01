import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  audioBlob: Blob;
  className?: string;
}

export function AudioPlayer({ audioBlob, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setError(null);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        setError("Could not play audio.");
      });
    }
    setIsPlaying(!isPlaying);
  };

  if (error) {
    return (
      <div className={`flex items-center text-destructive ${className}`}>
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onEnded={() => setIsPlaying(false)}
        onError={() => setError("Failed to load audio.")}
      />
      <Button onClick={togglePlay} size="icon" variant="ghost">
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>
      <div className="text-sm text-muted-foreground">
        {/* Could add time display here later */}
        Preview
      </div>
    </div>
  );
}