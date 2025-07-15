// app/api/transcribe/route.ts
import { DeepgramClient, createClient } from "@deepgram/sdk";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // Ensure the API key is set
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramApiKey) {
    return NextResponse.json(
      { error: "Deepgram API key not set" },
      { status: 500 }
    );
  }

  const deepgram: DeepgramClient = createClient(deepgramApiKey);

  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: "nova-2",
        smart_format: true,
        filler_words: true,
        punctuate: true,
        search: ["ahh"]
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the result structure to help with debugging
    console.log("Deepgram API result structure:", 
      Object.keys(result || {}).join(", "));

    return NextResponse.json(result);

  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}