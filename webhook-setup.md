# Telegram Webhook Setup Guide

## For Local Testing (Public URL needed)

Since Telegram bots cannot send webhooks to localhost, you need a public URL. Here are your options:

### Option 1: Replit Development URL (RECOMMENDED)
You're running on Replit! Your service should be automatically accessible at:
```
https://your-project-name.your-username.replit.dev:3001/webhook
```

To find your exact URL:
1. Look at your browser's address bar
2. Copy the domain (e.g., `https://abc123.your-username.replit.dev`)
3. Add `:3001/webhook` to the end

### Option 2: Use ngrok (Manual Installation)
1. Download ngrok: https://ngrok.com/download
2. Extract and run: `./ngrok http 3001`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Your webhook URL: `https://abc123.ngrok.io/webhook`

### Option 3: Use Cloudflare Tunnel (Free)
```bash
# Install cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Create tunnel
cloudflared tunnel --url http://localhost:3001
```

## For Production Deployment

When deployed (e.g., on Replit, Vercel, or any cloud service):
- Your main app: `https://your-domain.com`
- Telegram webhook: `https://your-domain.com/webhook`

## Current Webhook Endpoints

### Local Testing
- Health check: `http://localhost:3001/health`
- Webhook: `http://localhost:3001/webhook`

### With Public URL (replace with your actual URL)
- Health check: `https://your-public-url.com/health`
- Webhook: `https://your-public-url.com/webhook`

## Testing Your Webhook

Test with curl:
```bash
curl -X POST https://your-public-url.com/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_name": "Test User",
    "phone": "+998901234567",
    "position": "Developer",
    "city": "Tashkent"
  }'
```

Expected response:
```json
{
  "message": "Webhook received successfully",
  "timestamp": "2025-07-15T22:43:37.408Z"
}
```