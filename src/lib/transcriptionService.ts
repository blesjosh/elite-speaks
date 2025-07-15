// src/lib/transcriptionService.ts

export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  duration?: number;
  language?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export interface TranscriptionErrorInfo {
  message: string;
  code: string;
  status?: number;
}

export interface TranscriptionProgress {
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
}

/**
 * Transcribes an audio file using the FastAPI Whisper endpoint
 * @param fileUrl - The public URL of the audio file from Supabase Storage
 * @returns Promise<TranscriptionResult> - The transcription result
 */
export async function transcribeAudio(fileUrl: string): Promise<TranscriptionResult> {
  try {
    console.log('Starting transcription for:', fileUrl);

    // First, fetch the audio file from Supabase with proper headers
    const audioResponse = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });
    
    if (!audioResponse.ok) {
      console.error('Failed to fetch audio file:', audioResponse.status, audioResponse.statusText);
      throw new TranscriptionError(
        `Failed to fetch audio file: ${audioResponse.status} ${audioResponse.statusText}. This might be due to CORS or access permissions. Please check your Supabase Storage bucket policies.`,
        'FETCH_ERROR',
        audioResponse.status
      );
    }

    const audioBlob = await audioResponse.blob();
    
    // Validate file size (limit to 25MB for most APIs)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioBlob.size > maxSize) {
      throw new TranscriptionError(
        'Audio file is too large. Maximum size is 25MB.',
        'FILE_TOO_LARGE'
      );
    }

    // Create FormData for the API request
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    
    // Optional: Add language parameter if needed
    // formData.append('language', 'en');

    console.log('Sending audio to transcription API...');

    // Send to our Next.js API route that uses Deepgram
    const transcriptionResponse = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioUrl: fileUrl
      }),
    });

    if (!transcriptionResponse.ok) {
      let errorMessage = `Transcription API error: ${transcriptionResponse.status}`;
      try {
        const errorData = await transcriptionResponse.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = `${errorMessage} - ${transcriptionResponse.statusText}`;
      }
      
      throw new TranscriptionError(
        errorMessage,
        'API_ERROR',
        transcriptionResponse.status
      );
    }

    const result = await transcriptionResponse.json();
    
    console.log('Transcription completed:', result);
    
    // Handle different possible response formats
    const transcript = result.transcript || result.text || result.transcription || '';
    
    if (!transcript) {
      throw new TranscriptionError(
        'No transcript received from API',
        'EMPTY_TRANSCRIPT'
      );
    }

    return {
      transcript,
      confidence: result.confidence,
      duration: result.duration,
      language: result.language || result.detected_language || 'auto',
      segments: result.segments || result.words || undefined,
    };

  } catch (error) {
    console.error('Transcription error:', error);
    
    // If it's already a TranscriptionError, re-throw it
    if (error instanceof TranscriptionError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TranscriptionError(
        'Network error: Unable to connect to transcription service. Please check your internet connection.',
        'NETWORK_ERROR'
      );
    }
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TranscriptionError(
        'Request timeout: Transcription took too long',
        'TIMEOUT_ERROR'
      );
    }
    
    // Generic error handling
    throw new TranscriptionError(
      error instanceof Error ? error.message : 'Unknown transcription error',
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Transcribes audio with timeout support
 * @param fileUrl - The public URL of the audio file
 * @param timeoutMs - Timeout in milliseconds (default: 60 seconds)
 * @returns Promise<TranscriptionResult>
 */
export async function transcribeAudioWithTimeout(
  fileUrl: string, 
  timeoutMs: number = 60000
): Promise<TranscriptionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    // Note: We'd need to modify transcribeAudio to accept AbortSignal
    // For now, we'll use Promise.race
    const transcriptionPromise = transcribeAudio(fileUrl);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TranscriptionError(
          'Transcription timeout',
          'TIMEOUT_ERROR'
        ));
      }, timeoutMs);
    });
    
    return await Promise.race([transcriptionPromise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Alternative transcription function that uses the local API endpoint
 * This can be useful for better error handling and server-side processing
 * @param fileUrl - The public URL of the audio file from Supabase Storage
 * @returns Promise<TranscriptionResult> - The transcription result
 */
export async function transcribeAudioViaAPI(fileUrl: string): Promise<TranscriptionResult> {
  try {
    console.log('Starting transcription via API for:', fileUrl);

    // First, fetch the audio file from Supabase
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new TranscriptionError(
        `Failed to fetch audio file: ${audioResponse.statusText}`,
        'FETCH_ERROR',
        audioResponse.status
      );
    }

    const audioBlob = await audioResponse.blob();
    
    // Create FormData for the local API request
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');

    console.log('Sending audio to local transcription API...');

    // Send to the local API endpoint
    const transcriptionResponse = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.json();
      throw new TranscriptionError(
        errorData.error || `API error: ${transcriptionResponse.status}`,
        errorData.code || 'API_ERROR',
        transcriptionResponse.status
      );
    }

    const result = await transcriptionResponse.json();
    
    console.log('Transcription completed via API:', result);
    
    return result;

  } catch (error) {
    console.error('Transcription via API error:', error);
    
    // If it's already a TranscriptionError, re-throw it
    if (error instanceof TranscriptionError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TranscriptionError(
        'Network error: Unable to connect to transcription service',
        'NETWORK_ERROR'
      );
    }
    
    // Generic error handling
    throw new TranscriptionError(
      error instanceof Error ? error.message : 'Unknown transcription error',
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Transcribes an audio file directly from a File object using local API (recommended)
 * This bypasses CORS issues by routing through your own server
 * @param audioFile - The File object to transcribe
 * @returns Promise<TranscriptionResult> - The transcription result
 */
export async function transcribeAudioFile(audioFile: File): Promise<TranscriptionResult> {
  try {
    console.log('Starting transcription for file:', audioFile.name);

    // Validate file size (limit to 25MB for most APIs)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      throw new TranscriptionError(
        'Audio file is too large. Maximum size is 25MB.',
        'FILE_TOO_LARGE'
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/') && !audioFile.type.startsWith('video/')) {
      throw new TranscriptionError(
        'Invalid file type. Please upload an audio or video file.',
        'INVALID_FILE_TYPE'
      );
    }

    // Create FormData for the API request
    const formData = new FormData();
    formData.append('audio', audioFile); // Note: changed from 'file' to 'audio' to match your API route
    
    console.log('Sending audio file to local transcription API...');

    // Send to the LOCAL API endpoint (this bypasses CORS)
    const transcriptionResponse = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      let errorMessage = `Transcription API error: ${transcriptionResponse.status}`;
      try {
        const errorData = await transcriptionResponse.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${transcriptionResponse.statusText}`;
      }
      
      throw new TranscriptionError(
        errorMessage,
        'API_ERROR',
        transcriptionResponse.status
      );
    }

    const result = await transcriptionResponse.json();
    
    console.log('Transcription completed:', result);
    
    // Handle different possible response formats
    const transcript = result.transcript || result.text || result.transcription || '';
    
    if (!transcript) {
      throw new TranscriptionError(
        'No transcript received from API',
        'EMPTY_TRANSCRIPT'
      );
    }

    return {
      transcript,
      confidence: result.confidence,
      duration: result.duration,
      language: result.language || result.detected_language || 'auto',
      segments: result.segments || result.words || undefined,
    };

  } catch (error) {
    console.error('Transcription error:', error);
    
    // If it's already a TranscriptionError, re-throw it
    if (error instanceof TranscriptionError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TranscriptionError(
        'Network error: Unable to connect to local transcription service. Please check if your server is running.',
        'NETWORK_ERROR'
      );
    }
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TranscriptionError(
        'Request timeout: Transcription took too long',
        'TIMEOUT_ERROR'
      );
    }
    
    // Generic error handling
    throw new TranscriptionError(
      error instanceof Error ? error.message : 'Unknown transcription error',
      'UNKNOWN_ERROR'
    );
  }
}

// Keep the original function as backup for direct API calls (but rename it)
export async function transcribeAudioFileDirect(audioFile: File): Promise<TranscriptionResult> {
  try {
    console.log('Starting DIRECT transcription for file:', audioFile.name);

    // Validate file size (limit to 25MB for most APIs)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      throw new TranscriptionError(
        'Audio file is too large. Maximum size is 25MB.',
        'FILE_TOO_LARGE'
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/') && !audioFile.type.startsWith('video/')) {
      throw new TranscriptionError(
        'Invalid file type. Please upload an audio or video file.',
        'INVALID_FILE_TYPE'
      );
    }

    // Create FormData for the API request
    const formData = new FormData();
    formData.append('file', audioFile);
    
    console.log('Sending audio file DIRECTLY to transcription API...');

    // Send DIRECTLY to the FastAPI transcription endpoint (may have CORS issues)
    const transcriptionResponse = await fetch('https://whisper-api-cpp-5.onrender.com/transcribe', {
      method: 'POST',
      body: formData,
      mode: 'cors', // Explicitly set CORS mode
    });

    if (!transcriptionResponse.ok) {
      let errorMessage = `Transcription API error: ${transcriptionResponse.status}`;
      try {
        const errorData = await transcriptionResponse.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${transcriptionResponse.statusText}`;
      }
      
      throw new TranscriptionError(
        errorMessage,
        'API_ERROR',
        transcriptionResponse.status
      );
    }

    const result = await transcriptionResponse.json();
    
    console.log('DIRECT transcription completed:', result);
    
    // Handle different possible response formats
    const transcript = result.transcript || result.text || result.transcription || '';
    
    if (!transcript) {
      throw new TranscriptionError(
        'No transcript received from API',
        'EMPTY_TRANSCRIPT'
      );
    }

    return {
      transcript,
      confidence: result.confidence,
      duration: result.duration,
      language: result.language || result.detected_language || 'auto',
      segments: result.segments || result.words || undefined,
    };

  } catch (error) {
    console.error('DIRECT transcription error:', error);
    
    // If it's already a TranscriptionError, re-throw it
    if (error instanceof TranscriptionError) {
      throw error;
    }
    
    // Handle network errors (likely CORS)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TranscriptionError(
        'CORS error: The transcription service does not allow direct browser requests. Using the local API route instead is recommended.',
        'CORS_ERROR'
      );
    }
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TranscriptionError(
        'Request timeout: Transcription took too long',
        'TIMEOUT_ERROR'
      );
    }
    
    // Generic error handling
    throw new TranscriptionError(
      error instanceof Error ? error.message : 'Unknown transcription error',
      'UNKNOWN_ERROR'
    );
  }
}

// Custom error class for better error handling
class TranscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}
