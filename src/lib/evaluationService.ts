// src/lib/evaluationService.ts

/**
 * Represents the structured evaluation results from the AI analysis
 * 
 * This interface defines the expected structure of the evaluation data
 * returned by the AI model when analyzing a speech transcript.
 */
export interface EvaluationResult {
  /** Overall numerical score from 0-100 */
  overallScore: number;
  
  /** Assessment of the speaker's confidence */
  confidence: string;
  
  /** Analysis of filler words used in the speech */
  fillerWords: {
    /** Number of filler words detected */
    count: number;
    /** List of actual filler words found */
    words: string[];
  };
  
  /** Detailed feedback on grammar and syntax */
  grammarFeedback: string;
  
  /** Suggestions for better phrasing */
  alternativePhrasing: Array<{
    /** Original phrase from transcript */
    original: string;
    /** Suggested improved phrasing */
    suggested: string;
  }>;
  
  /** Assessment of how well the speech stayed on topic */
  topicAdherence: {
    /** Score from 0-10 for topic relevance */
    score: number;
    /** Detailed feedback on topic adherence */
    feedback: string;
  } | number | null; // Can be a number or null if no topic was assigned
}

/**
 * Sends a transcript to the evaluation API for AI analysis.
 * 
 * This function handles:
 * 1. Sending the transcript to the backend API
 * 2. Implementing timeout protection (60 seconds)
 * 3. Handling queuing status for rate-limited requests
 * 4. Processing error messages into user-friendly formats
 * 
 * @param transcript - The speech transcript text to be evaluated
 * @param topic - The assigned speaking topic for topic adherence scoring
 * @returns A promise resolving to an object containing:
 *   - evaluation: The AI evaluation results if successful
 *   - error: Error message if unsuccessful
 *   - inQueue: Boolean indicating if the request is queued due to API limits
 */
export async function evaluateTranscription(transcript: string, topic: string): Promise<{ 
  evaluation: EvaluationResult | null; 
  error: string | null; 
  inQueue?: boolean 
}> {
  try {
    console.log('Sending transcript for evaluation...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript, topic }),
      signal: controller.signal,
    }).catch(error => {
      if (error.name === 'AbortError') {
        // Request was aborted due to timeout
        return { 
          ok: false, 
          status: 408, 
          statusText: 'Request Timeout',
          json: async () => ({ 
            error: 'The evaluation is taking longer than expected due to high demand. Your request has been queued - please try again in a few moments.',
            inQueue: true 
          })
        };
      }
      throw error;
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Evaluation API error: ${response.status}`;
      let inQueue = false;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        inQueue = errorData.inQueue || false;

        // Handle special cases
        if (response.status === 429) {
          inQueue = true;
          errorMessage = 'The evaluation service is currently busy. Your request has been queued - please try again in a few moments.';
        } else if (response.status === 503) {
          inQueue = true;
          errorMessage = 'The evaluation service is temporarily unavailable due to high demand. Please try again shortly.';
        }
      } catch {
        errorMessage = `${errorMessage} - ${response.statusText}`;
      }

      return { 
        evaluation: null, 
        error: errorMessage,
        inQueue
      };
    }

    const result: EvaluationResult = await response.json();
    
    return { evaluation: result, error: null };

  } catch (err: any) {
    console.error('Evaluation service error:', err);
    return { evaluation: null, error: err.message || 'An unknown error occurred during evaluation.' };
  }
}
