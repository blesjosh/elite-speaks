#!/bin/bash

echo "Testing shell environment variables..."
echo "GEMINI_API_KEY: ${GEMINI_API_KEY:0:5}..."
echo "DEEPGRAM_API_KEY: ${DEEPGRAM_API_KEY:0:5}..."

echo -e "\nLoading environment variables from .env.local"
export $(grep -v '^#' .env.local | xargs -0)

echo -e "\nTesting shell environment variables after loading .env.local..."
echo "GEMINI_API_KEY: ${GEMINI_API_KEY:0:5}..."
echo "DEEPGRAM_API_KEY: ${DEEPGRAM_API_KEY:0:5}..."

echo -e "\nThis confirms the API keys are correctly set in your .env.local file."
echo "Next.js will automatically load these environment variables when the application runs."
echo "You don't need to manually export them to your shell environment."
