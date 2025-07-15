import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface AudioPlayerProps {
  audioUrl: string;
  className?: string;
}

export function AudioPlayer({ audioUrl, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixedUrl, setFixedUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Reset states when URL changes
    setIsPlaying(false);
    setError(null);
    setFixedUrl(null);
    
    const fixAudioUrl = async () => {
      try {
        // Log the original URL we're working with
        console.log('Original audio URL:', audioUrl);
        
        // If URL is already a public URL, use it but make sure it's properly formatted
        if (audioUrl.includes('supabase.co/storage/v1/object/public')) {
          setFixedUrl(audioUrl);
          return;
        }
        
        // Extract the path from the URL if it's a Supabase URL
        let path = audioUrl;
        
        // Handle various Supabase URL formats
        if (audioUrl.includes('supabase.co/storage/v1/object/sign')) {
          // Extract the path part from the signed URL
          const pathMatch = audioUrl.match(/supabase\.co\/storage\/v1\/object\/sign\/([^?]+)/);
          if (pathMatch && pathMatch[1]) {
            path = decodeURIComponent(pathMatch[1]);
            console.log('Extracted path from signed URL:', path);
          }
        } else if (audioUrl.includes('supabase.co/storage/v1/object')) {
          // Handle direct object URLs
          const pathMatch = audioUrl.match(/supabase\.co\/storage\/v1\/object\/([^?]+)/);
          if (pathMatch && pathMatch[1]) {
            path = decodeURIComponent(pathMatch[1]);
            console.log('Extracted path from object URL:', path);
          }
        } else {
          // Try to extract the bucket and path directly
          try {
            const url = new URL(audioUrl);
            const pathParts = url.pathname.split('/');
            // Look for 'recordings' in the path
            const recordingsIndex = pathParts.findIndex(part => part === 'recordings');
            if (recordingsIndex >= 0) {
              path = pathParts.slice(recordingsIndex).join('/');
              console.log('Extracted path from URL pathname:', path);
            }
          } catch (parseError) {
            console.error('Error parsing URL:', parseError);
          }
        }

        // If path starts with 'recordings/', use it as is, otherwise add the prefix
        if (!path.startsWith('recordings/')) {
          path = `recordings/${path}`;
        }

        console.log('Getting public URL for path:', path);
        
        try {
          // Try to get the path with bucket name
          const bucketName = 'recordings';
          let pathInBucket = path;
          
          // If path starts with the bucket name, remove it for getPublicUrl
          if (pathInBucket.startsWith(bucketName + '/')) {
            pathInBucket = pathInBucket.substring(bucketName.length + 1);
          }
          
          console.log('Getting public URL for bucket:', bucketName, 'path:', pathInBucket);
          
          // Get a fresh public URL
          const { data } = await supabase
            .storage
            .from(bucketName)
            .getPublicUrl(pathInBucket);
          
          if (data?.publicUrl) {
            console.log('Generated public URL:', data.publicUrl);
            setFixedUrl(data.publicUrl);
          } else {
            throw new Error('Could not generate public URL');
          }
        } catch (urlError) {
          console.error('Error getting public URL:', urlError);
          
          // As a fallback, try to use the original URL if it's already accessible
          console.log('Falling back to original URL:', audioUrl);
          setFixedUrl(audioUrl);
        }
      } catch (err) {
        console.error('Error fixing audio URL:', err);
        setError(`Error loading audio: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    fixAudioUrl();
  }, [audioUrl]);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setError(`Playback error: ${err.message}`);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => setIsPlaying(false);
  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio element error:', e);
    setError('Failed to load audio file. The file may be inaccessible or in an unsupported format.');
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {fixedUrl ? (
        <>
          <audio 
            ref={audioRef}
            src={fixedUrl}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            crossOrigin="anonymous"
            preload="metadata"
          />
          
          <Button
            onClick={togglePlayback}
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            disabled={!!error}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
          </Button>
        </>
      ) : error ? (
        <div className="text-red-500 text-xs flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      ) : (
        <div className="text-gray-500 text-xs">Loading audio...</div>
      )}
    </div>
  );
}