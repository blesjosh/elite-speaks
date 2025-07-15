#!/bin/bash

# Check for Gemini API key
echo "Checking for Gemini API key..."
if [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  GEMINI_API_KEY not found in environment variables"
  echo ""
  echo "To enable AI evaluation features, you need to set up a Gemini API key:"
  echo "1. Visit: https://aistudio.google.com/app/apikey"
  echo "2. Create or sign in to a Google account"
  echo "3. Create a new API key"
  echo "4. Add the API key to your .env.local file:"
  echo ""
  echo "GEMINI_API_KEY=your_api_key_here"
  echo ""
  echo "5. Restart your application"
  echo ""
  echo "The application will still run without this key, but AI evaluation features will be disabled."
else
  echo "✅ GEMINI_API_KEY is set correctly"
fi

# Check for Deepgram API key (used for transcription)
echo ""
echo "Checking for Deepgram API key..."
if [ -z "$DEEPGRAM_API_KEY" ]; then
  echo "⚠️  DEEPGRAM_API_KEY not found in environment variables"
  echo "This is required for audio transcription functionality."
else
  echo "✅ DEEPGRAM_API_KEY is set correctly"
fi

echo ""
echo "Starting application..."
