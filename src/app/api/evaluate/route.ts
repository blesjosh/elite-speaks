// app/api/evaluate/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error("Gemini API key is not set in environment variables");
    return NextResponse.json({ 
      error: "Gemini API key not set",
      errorType: "MISSING_API_KEY", 
      message: "The AI evaluation service is not properly configured. Please add a GEMINI_API_KEY to your environment variables."
    }, { status: 500 });
  }

  const { transcript, topic } = await request.json();
  if (!transcript) {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      As an expert English communication coach, analyze the following transcript. Provide a detailed evaluation in a valid JSON format.
      The user is practicing their communication skills.

      ${topic ? `Speaking Topic: "${topic}"` : "No specific topic was assigned."}

      Transcript: "${transcript}"

      Your evaluation must include these fields:
      1.  "overallScore": An integer score out of 100, where 100 is perfect.
      2.  "confidence": A brief analysis of the speaker's confidence, noting hesitations or strong phrasing.
      3.  "fillerWords": An object containing a "count" (integer) and a "words" (array of strings) of filler words like "um", "uh", "like", etc.
      4.  "grammarFeedback": Constructive feedback on grammar and syntax, with specific examples from the transcript.
      5.  "alternativePhrasing": An array of objects, where each object has "original" and "suggested" keys, offering better ways to phrase parts of the transcript.
      6.  "topicAdherence": If a speaking topic was assigned, provide a score from 0-10 on how well the speaker stayed on topic, with feedback on relevance. If no topic was assigned, set this to null.

      Strictly return only the JSON object, with no extra text or markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean the response to ensure it's valid JSON
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const evaluation = JSON.parse(cleanedJson);

    return NextResponse.json(evaluation);

  } catch (err) {
    console.error("Evaluation error:", err);
    
    // Check if it's likely an API key issue
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('API key') || errorMsg.includes('authentication') || errorMsg.includes('auth')) {
      return NextResponse.json({ 
        error: "API authentication error", 
        errorType: "API_KEY_ERROR",
        message: "There was a problem with the AI service authentication. Please check your API key configuration."
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: "Failed to evaluate transcript",
      message: errorMsg 
    }, { status: 500 });
  }
}