# AI Interview Pipeline Documentation

## Overview

This document outlines the refactored AI training and interview pipeline for the recruitment platform. The system now generates position-specific questions only once during training, streams candidate answers (text or audio) directly to GPT without storing them in the database, and generates a comprehensive candidate summary at the end of the interview process.

## Key Components

### 1. Train Once – Use Many (AI Training Logic)

When an admin uploads a document with position information:

- The system extracts core responsibilities, requirements, and competencies
- GPT generates:
  - A position summary/description
  - A set of 10 structured Phase 2 questions
- The summary is stored in `position.description`
- The 10 questions are stored in `position.phase2Questions` (JSON)

### 2. Pre-Generated Questions in Phase 2

In Phase 2:
- The system loads pre-generated questions from the position object
- No more live question generation at this stage
- Questions are presented to the candidate in sequence

### 3. Answer Handling – Voice or Text

Candidates may answer:
- In text
- Or using Telegram voice messages
- Voice messages are transcribed using OpenAI's audio API
- **No answers are stored** in the application database

### 4. Streaming to GPT

As each answer is received:
- The bot sends the question and corresponding answer to GPT in sequence
- Answers are accumulated in the conversation session context
- After all 10 answers are received, GPT is instructed to generate a final summary

### 5. Final Summary Only

GPT produces:
- A comprehensive evaluation summary of the candidate
- Summary includes insights, strengths, concerns, and a recommendation or score
- **Only this final summary is stored** in the candidate's profile (`aiAssessment` field)
- No audio files or raw answers are stored in the system

## Database Changes

- Added `phase2Questions` field to the Position model
- Removed `phase2Responses` field from the Candidate model (no longer storing answers)

## Code Changes

1. **documentTrainingService.js**
   - Enhanced to generate position-specific questions during document processing
   - Questions are stored in position.phase2Questions

2. **telegramWebhookHandler.js**
   - Updated phase2InterviewConversation to use pre-generated questions
   - Implemented streaming of answers to GPT without storing them
   - Added audio transcription for voice messages
   - Modified completePhase2Interview to generate a final summary from accumulated context

3. **enhancedAiService.js**
   - Added transcribeAudio function for voice message transcription
   - Added helper functions for parsing the final summary

## Flow Summary

| Step | Action |
|------|--------|
| /ai-train | Admin uploads document → GPT generates questions + description → Saved in position |
| Candidate Phase 2 | Questions retrieved from position → Bot sends answers (voice/text) to GPT live → No storage of answers |
| End of Phase 2 | GPT uses accumulated answers to generate summary → Summary stored in candidate profile |

## Benefits

- **Privacy Compliance**: No storage of raw candidate answers
- **Lightweight Infrastructure**: Reduced database storage requirements
- **Consistent Evaluation**: Position-specific questions are generated once and used consistently
- **Streamlined Process**: Simplified workflow with clear separation of concerns

## Implementation Notes

- The system uses OpenAI's GPT-4o for question generation and final summary
- OpenAI's Whisper model is used for voice transcription
- The conversation context is maintained in memory during the interview session
- If the session is interrupted, the interview can be resumed 