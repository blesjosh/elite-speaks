// Audio URL Diagnostic Tool
// Add this to any page where you're having audio playback issues
'use client';

import { useState, useEffect } from 'react';

const AudioDiagnosticTool = ({ audioUrl }: { audioUrl?: string }) => {
  const [testStatus, setTestStatus] = useState<string>('Not tested');
  const [directUrl, setDirectUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Attempt to fix a potentially problematic Supabase URL
  const fixSupabaseUrl = (url: string) => {
    if (!url) return '';
    
    try {
      // Check if it's a Supabase URL
      if (url.includes('supabase.co/storage')) {
        const urlObj = new URL(url);
        
        // Extract path components
        const pathParts = urlObj.pathname.split('/');
        
        // Find key parts of the path
        const bucketIndex = pathParts.indexOf('object') + 1;
        if (bucketIndex > 0 && bucketIndex < pathParts.length) {
          const bucket = pathParts[bucketIndex];
          const objectPath = pathParts.slice(bucketIndex + 1).join('/');
          
          // Create public URL
          return `${urlObj.origin}/storage/v1/object/public/${bucket}/${objectPath}`;
        }
      }
    } catch (e) {
      console.error('Error fixing URL:', e);
    }
    
    return url;
  };
  
  // Test if the URL is directly accessible
  const testDirectAccess = async (url: string) => {
    if (!url) {
      setTestStatus('No URL provided');
      return;
    }
    
    setTestStatus('Testing...');
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        setTestStatus(`Success! URL is directly accessible (${response.status})`);
      } else {
        setTestStatus(`Failed with status: ${response.status}`);
      }
    } catch (e) {
      setTestStatus(`Error: ${(e as Error).message || 'Unknown error'}`);
    }
  };
  
  // Play audio with the Audio API
  const testPlay = (url: string) => {
    if (!url) return;
    
    try {
      const audio = new Audio(url);
      
      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setTestStatus('Audio playing...');
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setTestStatus('Audio playback completed');
      });
      
      audio.addEventListener('error', (e) => {
        setIsPlaying(false);
        setTestStatus(`Audio error: ${audio.error?.message || 'Unknown error'}`);
      });
      
      audio.play().catch(e => {
        setIsPlaying(false);
        setTestStatus(`Play error: ${(e as Error).message || 'Unknown error'}`);
      });
    } catch (e) {
      setTestStatus(`Error creating Audio object: ${(e as Error).message || 'Unknown error'}`);
    }
  };
  
  useEffect(() => {
    if (audioUrl) {
      setDirectUrl(fixSupabaseUrl(audioUrl));
    }
  }, [audioUrl]);
  
  return (
    <div className="p-4 border rounded-md bg-gray-50 my-4">
      <h3 className="font-semibold mb-2">Audio Diagnostic Tool</h3>
      
      {audioUrl ? (
        <>
          <div className="mb-2">
            <p className="text-sm font-medium">Original URL:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{audioUrl}</pre>
          </div>
          
          <div className="mb-2">
            <p className="text-sm font-medium">Fixed URL:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{directUrl}</pre>
          </div>
          
          <div className="mb-2">
            <p className="text-sm font-medium">Status:</p>
            <p className="text-xs">{testStatus}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
              onClick={() => testDirectAccess(directUrl)}
            >
              Test URL Access
            </button>
            
            <button
              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
              onClick={() => testPlay(directUrl)}
              disabled={isPlaying}
            >
              {isPlaying ? 'Playing...' : 'Test Play'}
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">No audio URL provided</p>
      )}
    </div>
  );
};

export default AudioDiagnosticTool;
