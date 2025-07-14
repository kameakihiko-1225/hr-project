# Candidate Position Selection Process

This document details the position selection process for candidates in the Telegram bot.

## Overview

The position selection process allows candidates to browse and select positions they're interested in applying for. This is a critical step in the interview flow as it determines which position-specific questions will be asked during the interview.

## Selection Methods

There are two main ways candidates can select a position:

### 1. Direct Position Link (Deep Link)

HR managers can generate and share direct links to specific positions:

```
https://t.me/your_bot_username?start=position_uuid_here
```

#### Deep Link Flow:

1. Candidate clicks the link and opens the bot
2. The bot extracts the position ID from the link parameter
3. The bot validates the position ID against the database
4. If valid, the candidate is automatically linked to the position
5. The candidate sees position details (title, description, location, etc.)
6. The interview process begins immediately with minimal questions (name, phone)
7. The `languageChosen` flag is automatically set to true to avoid language selection prompt

#### Implementation Details:

- The position ID is extracted from the `/start` command parameter
- The UUID format is validated before database lookup
- If the position is found, the candidate's `positionId` field is updated
- The session's `selectedPositionId` is set for the conversation flow
- The session's `languageChosen` flag is set to true to streamline the process

### 2. Guided Position Selection

When a candidate starts the bot without a position ID, they are offered a guided selection process:

#### Guided Selection Flow:

1. Candidate sends `/start` or `/select_position` command
2. The bot offers two options:
   - "Browse positions" (navigational flow)
   - "Select position" (guided selection)
3. If "Select position" is chosen, the guided flow begins:
   - Step 1: Select a company from the list
   - Step 2: Select a department within that company
   - Step 3: Select a position within that department
4. After selecting a position, the candidate:
   - Sees the position details
   - Is asked if they want to start the interview now or later
5. If they choose to start now, the interview process begins

#### Implementation Details:

- The selection uses reply keyboards for each step (appears at the bottom of the Telegram app)
- Each step filters the next step's options (e.g., departments are filtered by selected company)
- The candidate's `positionId` is updated after final selection
- The session's `selectedPositionId` is set for the conversation flow
- The `languageChosen` flag is set if the candidate already has a preferred language

## Command Reference

- `/start` - Initiates the bot and offers position selection options if no position ID is provided
- `/select_position` - Explicitly starts the guided position selection process

## Database Updates

During the position selection process, the following database updates occur:

1. When a position is selected (either via deep link or guided selection):
   ```javascript
   await prisma.candidate.update({
     where: { id: candidate.id },
     data: { positionId: selectedPositionId }
   });
   ```

2. Session state is updated to track the selection:
   ```javascript
   ctx.session.selectedPositionId = selectedPositionId;
   conversation.session.selectedPositionId = selectedPositionId;
   ```

## Error Handling

The position selection process includes error handling for:

- Invalid position IDs in deep links
- Companies with no departments
- Departments with no positions
- User cancellation during the selection process

## Testing

To test the position selection flow:

1. **Deep Link Testing**:
   - Generate a deep link with a valid position ID
   - Generate a deep link with an invalid position ID
   - Verify the correct error handling and flow

2. **Guided Selection Testing**:
   - Test the complete flow from company to department to position
   - Test with companies that have no departments
   - Test with departments that have no positions
   - Test cancellation at each step

## Troubleshooting

Common issues and their solutions:

1. **Position not found in deep link**:
   - Verify the position ID is correct and exists in the database
   - Check that the position status is 'active'

2. **No companies/departments/positions shown**:
   - Verify that entities exist in the database
   - Check that their status is set to 'active'
   - Verify the relationships between entities are correctly set up

3. **Interview not starting after position selection**:
   - Check if the `languageChosen` flag is properly set
   - Verify the candidate record was successfully updated with the position ID 