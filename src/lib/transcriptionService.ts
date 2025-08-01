// src/lib/transcriptionService.ts

export interface TranscriptionResult {
  transcription: string; // Changed from 'transcript' to 'transcription'
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

export class TranscriptionError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'TranscriptionError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Transcribes an audio file using our Next.js API route.
 * @param audioUrl - The public URL of the audio file.
 * @returns A promise that resolves to the transcription result or an error.
 */
export async function transcribeAudio(audioUrl: string): Promise<{ transcription: string; error: string | null }> {
  try {
    console.log('Sending audio URL to transcription API:', audioUrl);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) {
      let errorMessage = `Transcription API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${response.statusText}`;
      }
      return { transcription: '', error: errorMessage };
    }

    const result: TranscriptionResult = await response.json();
    
    // The API returns { transcription: "..." }, so we use result.transcription
    if (!result.transcription) {
        return { transcription: '', error: 'API returned an empty transcription.' };
    }

    return { transcription: result.transcription, error: null };

  } catch (err: any) {
    console.error('Transcription service error:', err);
    return { transcription: '', error: err.message || 'An unknown error occurred during transcription.' };
  }
}
