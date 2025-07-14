# Voice Transcription Setup Guide

This guide explains how to set up voice transcription for the Aurora HRMS Telegram bot.

## Overview

The system uses OpenAI's Whisper API for voice transcription.

## Requirements

### Environment Variables

Add to your `.env` file:

```env
# OpenAI API Key (required for transcription)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Set transcription preferences
VOICE_MAX_DURATION=300              # seconds
VOICE_MAX_FILE_SIZE=20971520        # bytes (20MB)
```

## Features

### ✅ **Implemented Features:**

- **Cloud-based Transcription**: Using OpenAI's Whisper API for reliable results
- **Real-time Processing**: Voice messages are transcribed as they're received
- **User Choice**: Candidates can choose to use transcription or provide text correction
- **Multilingual Support**: English, Russian, and limited support for other languages
- **File Validation**: Size, duration, and format validation
- **Error Handling**: Graceful handling when transcription fails
- **Resource Management**: Automatic cleanup of temporary files

### 🎯 **Voice Message Flow:**

1. **Receive**: Candidate sends voice message in Phase 2
2. **Validate**: Check file size, duration, and format
3. **Download**: Securely download file from Telegram
4. **Transcribe**: Convert audio to text using OpenAI Whisper API
5. **Present**: Show transcription to the candidate
6. **Choose**: Let candidate use transcription or provide text
7. **Process**: Continue with AI assessment
8. **Cleanup**: Remove temporary files

### 📊 **Quality Features:**

- **Multi-language Support**: Good support for major languages
- **Error Recovery**: Robust error handling
- **Secure Processing**: Temporary files with automatic cleanup

## Testing

### Test Voice Transcription:

1. Complete Phase 1 interview
2. Start Phase 2 with `/phase2` command
3. Send a voice message when prompted
4. Review transcription quality
5. Choose to use transcription or provide text correction

### Troubleshooting:

**Poor Transcriptions:**
- Speak clearly and slowly
- Record in a quiet environment
- Use good quality microphone
- Keep messages under 2 minutes

**Transcription Failures:**
- Verify OpenAI API key is set correctly
- Check network connectivity to OpenAI API
- Ensure sufficient disk space for temporary files

## Production Setup

### For Production Deployment:

1. **Set Resource Limits:**
```env
# Recommended production limits
VOICE_MAX_DURATION=180        # 3 minutes
VOICE_MAX_FILE_SIZE=10485760  # 10MB
```

2. **Monitor Performance:**
- Set up logging for transcription errors
- Monitor API usage for OpenAI
- Track transcription success rates
- Set up alerts for high failure rates

## Security Considerations

- Voice files are temporarily stored and immediately deleted
- No permanent storage of audio content
- API keys should be secured and rotated regularly
- File validation prevents malicious uploads

## Cost Optimization

- **OpenAI Whisper API**: ~$0.006 per minute of audio
- Consider implementing rate limiting for voice messages
- Set appropriate maximum duration limits

---

**Need Help?** Check the troubleshooting section or contact the development team. 