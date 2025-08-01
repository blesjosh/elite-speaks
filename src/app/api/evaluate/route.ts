import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse, NextRequest } from "next/server";
import requestQueue from "@/lib/requestQueue";

/**
 * Expected request data structure for the evaluation endpoint
 */
interface RequestData {
  /** The speech transcript to be evaluated */
  transcript: string;
  /** Optional topic that the speaker was supposed to address */
  topic?: string;
}

/**
 * Structure of the evaluation result from the AI model
 */
interface EvaluationResult {
  /** Overall score out of 100 */
  overallScore: number;
  /** Assessment of speaker confidence */
  confidence: string;
  /** Analysis of filler words */
  fillerWords: {
    count: number;
    words: string[];
  };
  /** Feedback on grammar usage */
  grammarFeedback: string;
  /** Suggestions for better phrasing */
  alternativePhrasing: Array<{
    original: string;
    suggested: string;
  }>;
  /** Score for staying on topic (null if no topic was assigned) */
  topicAdherence: number | null;
}

/**
 * Type guard to verify that the data returned from the AI
 * matches the expected EvaluationResult structure
 * 
 * @param data - The data to validate
 * @returns A type predicate indicating if data is a valid EvaluationResult
 */
function isValidEvaluation(data: unknown): data is EvaluationResult {
  if (!data || typeof data !== 'object') return false;
  const evaluation = data as Partial<EvaluationResult>;
  
  return (
    typeof evaluation.overallScore === 'number' &&
    typeof evaluation.confidence === 'string' &&
    typeof evaluation.fillerWords === 'object' &&
    typeof evaluation.grammarFeedback === 'string' &&
    Array.isArray(evaluation.alternativePhrasing)
  );
}

/**
 * API endpoint for evaluating speech transcriptions using AI
 * 
 * This route:
 * 1. Manages request queueing to handle API rate limits
 * 2. Processes speech transcriptions via Gemini AI
 * 3. Returns structured evaluation data
 * 
 * @param request - The incoming HTTP request
 * @returns JSON response with evaluation data or error information
 */
export async function POST(request: NextRequest) {
  try {
    // Check queue size first - if it's too large, immediately return a friendly queue message
    // This provides backpressure to prevent overwhelming the queue
    if (requestQueue.queueLength > 5) {
      console.log(`Queue size limit reached (${requestQueue.queueLength} pending requests)`);
      return NextResponse.json({ 
        error: "The evaluation service is experiencing high demand right now. Please try again in a few moments.",
        inQueue: true
      }, { status: 429 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("Gemini API key is not set in environment variables");
      return NextResponse.json({ 
        error: "Gemini API key not set",
        errorType: "MISSING_API_KEY", 
        message: "The AI evaluation service is not properly configured. Please add a GEMINI_API_KEY to your environment variables."
      }, { status: 500 });
    }

    const data = await request.json() as RequestData;
    if (!data.transcript) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      As an expert English communication coach, analyze the following transcript. Provide a detailed evaluation in a valid JSON format.
      The user is practicing their communication skills and give very low score if the user is speaking something out of the given topic.

      ${data.topic ? `Speaking Topic: "${data.topic}"` : "No specific topic was assigned."}

      Transcript: "${data.transcript}"

      Your evaluation must include these fields:
      1.  "overallScore": An integer score out of 100, where 100 is perfect.
      2.  "confidence": A brief analysis of the speaker's confidence, noting hesitations or strong phrasing.
      3.  "fillerWords": An object containing a "count" (integer) and a "words" (array of strings) of filler words like "um", "uh", "like", etc.
      4.  "grammarFeedback": Constructive feedback on grammar and syntax, with specific examples from the transcript.
      5.  "alternativePhrasing": An array of objects, where each object has "original" and "suggested" keys, offering better ways to phrase parts of the transcript.
      6.  "topicAdherence": If a speaking topic was assigned, provide a score from 0-10 on how well the speaker stayed on topic, with feedback on relevance. If no topic was assigned, set this to null.

      Strictly return only the JSON object, with no extra text or markdown formatting.
    `;

    try {
      // Add the API call to the queue to manage rate limits
      const aiResponseTask = async () => {
        console.log("Processing Gemini API request from queue...");
        
        try {
          // Make the actual API call to Gemini
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        } catch (apiError: any) {
          // Enhanced error handling for API-specific errors
          console.error(`Gemini API error: ${apiError.message || 'Unknown error'}`);
          
          // Add more context to the error for better debugging
          if (apiError.message) {
            apiError.message = `Gemini API: ${apiError.message}`;
          }
          
          throw apiError;
        }
      };

      // Wait for the queue to process this request (with automatic retries)
      const aiResponse = await requestQueue.enqueue(aiResponseTask);
      
      // Remove any markdown code block syntax and clean up the response
      const cleanedJson = aiResponse.replace(/```json\n|```json|```\n|```/g, "").trim();
      let parsedData;
      
      try {
        // Attempt to parse the cleaned response as JSON
        parsedData = JSON.parse(cleanedJson);
      } catch (jsonError) {
        console.error('Failed to parse AI response as JSON:', cleanedJson);
        
        // Check for common rate limit or quota messages in the raw response
        // These might be returned as plain text errors instead of JSON
        if (aiResponse.toLowerCase().includes('quota exceeded') || 
            aiResponse.toLowerCase().includes('rate limit') || 
            aiResponse.toLowerCase().includes('too many requests')) {
          
          // Return a user-friendly message and indicate this request can be retried later
          return NextResponse.json({
            error: 'The evaluation service is currently at capacity. Please try again in a few moments.',
            inQueue: true
          }, { status: 429 });
        }
        
        throw new Error('AI response was not valid JSON');
      }

      if (!isValidEvaluation(parsedData)) {
        console.error('Invalid evaluation format:', parsedData);
        throw new Error('Invalid evaluation format from AI response');
      }

      const evaluation: EvaluationResult = {
        overallScore: parsedData.overallScore,
        confidence: parsedData.confidence,
        fillerWords: {
          count: parsedData.fillerWords.count || 0,
          words: parsedData.fillerWords.words || []
        },
        grammarFeedback: parsedData.grammarFeedback,
        alternativePhrasing: parsedData.alternativePhrasing,
        topicAdherence: data.topic ? (parsedData.topicAdherence || 0) : null
      };

      return NextResponse.json(evaluation);
    } catch (error: unknown) {
      console.error('Error processing AI response:', error);
      return NextResponse.json({
        error: 'Failed to process AI evaluation',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error('General evaluation error:', err);
    return NextResponse.json({
      error: 'Failed to evaluate transcript',
      details: err instanceof Error ? err.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}