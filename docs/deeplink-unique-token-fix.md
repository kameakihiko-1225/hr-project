# Deeplink Unique Token Fix

## Issue

After implementing the fix to use the position ID in the deeplink, we encountered a unique constraint error when multiple users tried to apply for the same position:

```
Invalid `prisma.candidate.create()` invocation:

Unique constraint failed on the fields: (`start_token`)
```

This error occurred because we were using the position ID directly as the `start_token` for candidates, but the database has a unique constraint on the `start_token` field. When multiple users tried to apply for the same position, they all had the same token, causing the unique constraint error.

## Solution

We fixed this issue by modifying the `createDeeplink` function in `deeplinkService.js` to create a unique token that includes both the position ID and a random component:

```javascript
// Before:
const token = positionId;

// After:
const randomComponent = uuidv4().split('-')[0]; // Use just the first part of UUID for brevity
const token = `${positionId}:${randomComponent}`;
```

We also updated the `/start` command handler in `telegramWebhookHandler.js` to extract the position ID from the token when it contains a colon:

```javascript
// Extract position ID from token if it's in the format "positionId:randomComponent"
let positionId = maybeToken;
if (maybeToken.includes(':')) {
  positionId = maybeToken.split(':')[0];
  console.log('[Bot] Extracted position ID from token:', positionId);
}

// Check if the extracted ID is a valid UUID
if (isUuid(positionId)) {
  // Try to find the position
  try {
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      // ...
    });
    // ...
  }
}
```

## How It Works Now

1. When a user clicks "Apply via AI" on a position card or job card, the system creates a deeplink with a unique token that includes both the position ID and a random component.
2. The Telegram bot receives this token as the start parameter and extracts the position ID from it.
3. The bot then uses the position ID to look up the position and display its details.
4. The unique token ensures that each candidate has a unique `start_token` value, avoiding the unique constraint error.

## Related Files

- `src/api/bots/deeplinkService.js` - Modified to create a unique token that includes both the position ID and a random component.
- `src/api/bots/telegramWebhookHandler.js` - Updated to extract the position ID from the token when it contains a colon.

## Testing

To test this fix:
1. Click on the "Apply via AI" button for any position card or job card.
2. The system should generate a deeplink with a unique token that includes the position ID.
3. When the Telegram bot opens, it should display the details of the selected position.
4. Multiple users should be able to apply for the same position without getting a unique constraint error. 