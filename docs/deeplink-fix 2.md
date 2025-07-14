# Deeplink Functionality Fix

## Issue

The "Apply via AI" button in the website was generating a random UUID instead of using the actual position ID when creating a deeplink to the Telegram bot. This caused the Telegram bot to show "Position not found" errors when users clicked on the button.

## Solution

We made the following changes to fix the issue:

1. Modified `deeplinkService.js` to use the actual position ID as the token in the deeplink instead of generating a random UUID:

```javascript
// Before:
const token = uuidv4();

// After:
const token = positionId;
```

2. Updated the `JobCard.tsx` component to use the `createPositionDeepLink` function with the job's ID when the "Apply via AI" button is clicked:

```javascript
// Before:
const handleApplyClick = () => {
  // TODO: Replace with router push or deep-link invocation
  alert(`You\'ll be redirected to Telegram to chat with ${job.company}\'s AI recruiter!`);
};

// After:
const handleApplyClick = async () => {
  if (isApplying) return;
  
  try {
    setIsApplying(true);
    
    // Call the API to create a deeplink with the job's ID
    const linkResp = await createPositionDeepLink(job.id.toString());
    
    if (!linkResp.success) {
      toast({ title: 'Failed to generate link', description: linkResp.error || 'Unexpected error' });
      return;
    }
    
    const rawLink: string | undefined = linkResp.data?.link;
    if (!rawLink) {
      toast({ title: 'No link returned', description: 'The server did not return a deep-link.' });
      return;
    }
    
    // Open the deeplink in a new tab
    window.open(rawLink.startsWith('http') ? rawLink : `https://t.me/${''}?start=${rawLink}`, '_blank', 'noopener');
  } catch (error: any) {
    console.error('Apply via AI error:', error);
    toast({ title: 'Error', description: error?.message || 'Something went wrong' });
  } finally {
    setIsApplying(false);
  }
};
```

## How It Works Now

1. When a user clicks "Apply via AI" on a position card or job card, the system creates a deeplink using the actual position ID.
2. The Telegram bot receives this position ID as the start parameter and uses it to look up the position directly.
3. The bot then displays the position details and starts the application process.

## Testing

To test this functionality:
1. Click on the "Apply via AI" button for any position card or job card.
2. The system should generate a deeplink with the actual position ID.
3. When the Telegram bot opens, it should display the details of the selected position.
4. The bot should then guide the user through the application process for that specific position.

## Related Files

- `src/api/bots/deeplinkService.js` - Modified to use position ID as token
- `src/components/JobCard.tsx` - Updated to implement the Apply via AI functionality
- `src/components/PositionCard.tsx` - Already using the correct implementation
- `src/api/bots/telegramWebhookHandler.js` - Handles the position ID in the start command 