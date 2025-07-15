# Audio Transcription Feature

## Overview

The Elite Speaks dashboard now includes an AI-powered audio transcription feature that converts your uploaded audio files into text using advanced speech recognition technology.

## How It Works

1. **Upload Audio File**: Upload your audio file (supported formats: MP3, WAV, M4A, etc.) through the file upload interface
2. **File Storage**: The audio file is securely stored in Supabase Storage
3. **Transcription Processing**: The audio file is sent to a FastAPI Whisper endpoint for processing
4. **Results Display**: The transcript is displayed in the dashboard with additional metadata

## Features

### Core Functionality
- ✅ **Automatic Speech Recognition**: Powered by OpenAI Whisper via FastAPI endpoint
- ✅ **Multiple Audio Formats**: Supports various audio file formats
- ✅ **Real-time Progress**: Shows loading states and progress indicators
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Secure Storage**: Files are stored securely in Supabase Storage

### Advanced Features
- ✅ **Audio Player**: Built-in audio player to listen to uploaded files
- ✅ **Download Transcript**: Export transcripts as text files
- ✅ **Confidence Scores**: Shows transcription confidence levels (when available)
- ✅ **Language Detection**: Automatically detects the language of the audio
- ✅ **Timestamped Segments**: Shows word-level timestamps (when available)
- ✅ **File Size Validation**: Ensures files are within acceptable limits (25MB max)

## Usage Instructions

### Step 1: Upload Audio File
1. Navigate to the Dashboard
2. Use the "Upload Practice Content" section
3. Drag and drop or click to select your audio file
4. Wait for the upload to complete

### Step 2: Start Transcription
1. Once the file is uploaded, the "AI Transcription" section will appear
2. Click the "Start Transcription" button
3. Wait for processing to complete (this may take a few minutes)

### Step 3: Review Results
1. View the transcript in the results section
2. Check confidence scores and detected language
3. Expand timestamped segments if available
4. Download the transcript as a text file if needed

## Technical Details

### API Endpoints

#### External Transcription Service
- **URL**: `https://whisper-api-cpp-5.onrender.com/transcribe`
- **Method**: POST
- **Content-Type**: multipart/form-data
- **File Parameter**: `file`

#### Local API Endpoint (Alternative)
- **URL**: `/api/transcribe`
- **Method**: POST
- **Content-Type**: multipart/form-data
- **File Parameter**: `audio`

### Response Format
```typescript
interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  duration?: number;
  language?: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}
```

### Error Handling

The system handles various types of errors:

- **Network Errors**: Connection issues with the transcription service
- **File Errors**: Invalid file types or sizes that are too large
- **API Errors**: Issues with the transcription service
- **Authentication Errors**: Problems with file access or permissions
- **Timeout Errors**: Processing takes too long

### File Limitations

- **Maximum File Size**: 25MB
- **Supported Formats**: MP3, WAV, M4A, FLAC, OGG, and other common audio formats
- **Processing Time**: Depends on file size and server load (typically 1-5 minutes)

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check that Supabase bucket policies are properly configured
   - Ensure the file is a supported audio format
   - Verify file size is under 25MB

2. **Transcription Fails**
   - Check internet connection
   - Verify the external API is accessible
   - Try again as the service may be temporarily unavailable

3. **No Audio Playback**
   - Ensure the browser supports the audio format
   - Check that the file was uploaded successfully
   - Verify the Supabase storage URL is accessible

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Test with a smaller audio file
4. Try refreshing the page and uploading again

## Future Enhancements

Planned improvements include:
- Support for video file audio extraction
- Real-time transcription from microphone input
- Multiple language selection
- Speaker identification
- Transcript editing capabilities
- Integration with speech coaching features
