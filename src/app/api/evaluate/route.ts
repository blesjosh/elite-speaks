import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse, NextRequest } from "next/server";

interface RequestData {
  transcript: string;
  topic?: string;
}

interface EvaluationResult {
  overallScore: number;
  confidence: string;
  fillerWords: {
    count: number;
    words: string[];
  };
  grammarFeedback: string;
  alternativePhrasing: Array<{
    original: string;
    suggested: string;
  }>;
  topicAdherence: number | null;
}

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

export async function POST(request: NextRequest) {
  try {
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
      The user is practicing their communication skills.

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
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();
      
      // Remove any markdown code block syntax and clean up the response
      const cleanedJson = aiResponse.replace(/```json\n|```json|```\n|```/g, "").trim();
      let parsedData;
      
      try {
        parsedData = JSON.parse(cleanedJson);
      } catch (jsonError) {
        console.error('Failed to parse JSON:', cleanedJson);
        throw new Error('AI response was not valid JSON');
      }

      if (!isValidEvaluation(parsedData)) {
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