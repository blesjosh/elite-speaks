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
    const { audioUrl } = await request.json();

    if (!audioUrl) {
      return NextResponse.json({ error: "No audio URL provided" }, { status: 400 });
    }

    // Fetch the audio from the URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
    }

    // Get the audio data as a buffer
    const buffer = Buffer.from(await audioResponse.arrayBuffer());

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

    // Extract just the transcript from the result
    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('No transcription result found in response');
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;
    
    return NextResponse.json({
      transcript,
      confidence: result.results.channels[0].alternatives[0].confidence,
      duration: result.metadata?.duration,
      language: result.metadata?.language
    });

  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : "Failed to transcribe audio",
        details: err
      },
      { status: 500 }
    );
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}