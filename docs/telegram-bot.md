# Telegram Bot Integration

This document provides information about the Telegram bot integration in Aurora HRMS Portal.

## Overview

The Telegram bot integration allows HR managers to automate candidate interviews and data collection through Telegram. Each admin can have their own bot that conducts structured interviews with candidates, collects their information, and stores it in the database.

## Features

- **Personalized Bots**: Each admin can create and manage their own Telegram bot
- **Multilingual Support**: Bots can communicate in English, Russian, and Uzbek
- **Structured Interviews**: Pre-defined interview flow with customizable questions
- **Candidate Management**: View and manage candidates interviewed by the bot
- **Position-Specific Questions**: Tailor questions based on the position the candidate is applying for
- **Data Collection**: Automatically collect and store candidate information

## Setup Instructions

### Creating a Bot

1. Log in to your admin account
2. Navigate to "Bot Manager" in the sidebar
3. Click "Create New Bot"
4. Enter the following information:
   - Bot Name: A descriptive name for your bot
   - Bot Token: The token obtained from BotFather on Telegram
   - Default Language: The primary language your bot will use
5. Click "Create Bot"

### Getting a Bot Token

To get a bot token from Telegram:

1. Open Telegram and search for "BotFather"
2. Start a chat with BotFather
3. Send the command `/newbot`
4. Follow the instructions to create a new bot
5. Once created, BotFather will provide you with a token
6. Copy this token and use it when creating your bot in Aurora HRMS

### Setting Up Webhook

After creating your bot, you need to set up a webhook to receive messages:

1. Go to your bot's settings page
2. In the "Webhook Configuration" section, click "Set Webhook"
3. The system will automatically configure the webhook URL
4. You can test the webhook connection by clicking "Test Connection"

## Bot Configuration

### Languages

The bot supports the following languages:

- English (default)
- Russian
- Uzbek

You can change the bot's language in the bot settings page.

### Interview Flow

The standard interview flow consists of:

1. **Welcome Message**: Introduces the bot and company
2. **Personal Information**: Collects name, contact details, etc.
3. **Position Selection**: Asks which position the candidate is applying for
4. **Position-Specific Questions**: Asks questions relevant to the selected position
5. **Additional Information**: Collects any other relevant information
6. **Conclusion**: Thanks the candidate and explains next steps

### Customizing Questions

You can customize the questions asked by the bot:

1. Go to your bot's settings page
2. Navigate to the "Interview Questions" section
3. Edit existing questions or add new ones
4. Save your changes

## Candidate Management

### Viewing Candidates

1. Navigate to "Bot Manager" > "Candidates" in the sidebar
2. View a list of all candidates interviewed by your bot
3. Use the search function to find specific candidates
4. Click on a candidate to view their detailed information

### Candidate Details

The candidate details page shows:

- Personal information (name, contact details, etc.)
- Position applied for
- Responses to interview questions
- Full conversation history
- Assessment data (if available)

### Exporting Data

You can export candidate data in various formats:

1. From the candidates list, click the "Export" button
2. Select the desired format (CSV, Excel, etc.)
3. Choose which data to include
4. Click "Export" to download the file

## Technical Details

### Bot Architecture

The bot system consists of:

- **Bot Model**: Stores bot configuration and settings
- **Candidate Model**: Stores candidate information
- **ChatSession Model**: Tracks conversation state
- **Message Model**: Stores individual messages

### Webhook Handler

The webhook handler processes incoming messages from Telegram:

1. Receives updates from Telegram
2. Identifies the bot and candidate
3. Processes the message based on the current conversation state
4. Sends an appropriate response
5. Updates the conversation state

### Security Considerations

- Bot tokens are stored securely in the database
- All communication between the system and Telegram is encrypted
- Access to candidate data is restricted to the admin who owns the bot

## Troubleshooting

### Common Issues

1. **Bot Not Responding**:
   - Check if the webhook is properly configured
   - Ensure the bot is active in settings
   - Verify the bot token is correct

2. **Webhook Errors**:
   - Make sure your server is accessible from the internet
   - Check server logs for any errors
   - Try resetting the webhook

3. **Language Issues**:
   - Verify the language setting in bot configuration
   - Check if all translations are available for the selected language

### Support

For additional support, please contact the system administrator or refer to the technical documentation.

## API Reference

The following API endpoints are available for bot management:

- `POST /api/bots`: Create a new bot
- `GET /api/bots/:id`: Get bot details
- `GET /api/bots/admin/:adminId`: Get bot by admin ID
- `PUT /api/bots/:id`: Update bot settings
- `DELETE /api/bots/:id`: Delete a bot
- `POST /api/bots/:id/webhook`: Set webhook URL
- `DELETE /api/bots/:id/webhook`: Remove webhook
- `GET /api/bots/:id/candidates`: Get candidates interviewed by a bot
- `GET /api/candidates/:id`: Get candidate details 