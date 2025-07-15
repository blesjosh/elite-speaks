This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Setup

This application requires a Supabase database with proper tables and columns set up. To ensure your database is correctly configured:

1. Create a Supabase project at [https://app.supabase.com/](https://app.supabase.com/)
2. Set up your environment variables as described in the Environment Setup section below
3. Run the database setup scripts:
   - For new installations: Follow the instructions in [DATABASE_SETUP.md](DATABASE_SETUP.md)
   - This will create the necessary tables and columns for the application to work properly

### Storage Setup

The application stores audio recordings in Supabase Storage. Make sure to:

1. Create a storage bucket called "recordings" in your Supabase project
2. Set appropriate permissions as described in [supabase-audio-storage-setup.md](supabase-audio-storage-setup.md)

## Environment Setup

Create a `.env.local` file with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

Replace the placeholder values with your actual credentials.

## API Keys

This application requires the following API keys to enable all functionality:

### Required API Keys

- **DEEPGRAM_API_KEY**: Required for audio transcription
  - Get a key from [Deepgram's website](https://console.deepgram.com/signup)
  
### Optional API Keys

- **GEMINI_API_KEY**: Required for AI evaluation of speech
  - Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey)
  - Without this key, speech recording and transcription will work, but AI evaluation will be disabled

Add these keys to your `.env.local` file:

```
DEEPGRAM_API_KEY=your_deepgram_key_here
GEMINI_API_KEY=your_gemini_key_here
```

You can run the included script to check if your API keys are properly configured:

```bash
./check-api-keys.sh
```

## Features

- 🎤 **Audio Recording**: Record and upload audio for analysis
- 🔍 **AI Transcription**: Transcribe audio to text using Deepgram
- 📝 **Speech Analysis**: Get AI feedback on your speaking patterns
- 📊 **Historical Data**: View your past recordings and performance
# elite-speaks
