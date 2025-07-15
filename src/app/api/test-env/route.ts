// app/api/test-env/route.ts
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    geminiApiKey: process.env.GEMINI_API_KEY ? "Set (starts with: " + process.env.GEMINI_API_KEY.substring(0, 5) + "...)" : "Not set",
    deepgramApiKey: process.env.DEEPGRAM_API_KEY ? "Set (starts with: " + process.env.DEEPGRAM_API_KEY.substring(0, 5) + "...)" : "Not set",
  });
}
