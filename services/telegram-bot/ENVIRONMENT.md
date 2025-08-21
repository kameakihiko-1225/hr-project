# Telegram Bot Service - Env

Provide the following environment variables when running the service:

- TELEGRAM_BOT_TOKEN: Telegram bot token used to resolve file_id to a downloadable URL.
- BITRIX_BASE or BITRIX_WEBHOOK_URL: Bitrix24 REST webhook base, e.g.
  https://yourportal.bitrix24.kz/rest/<user-id>/<webhook-token>
- TELEGRAM_BOT_PORT (optional): Port for the simple Express server (default 3001).

Security notes:
- Do NOT commit real tokens to the repository.
- Prefer exporting via your shell, direnv, or a secrets manager.

Example (bash):

export TELEGRAM_BOT_TOKEN={{TELEGRAM_BOT_TOKEN}}
export BITRIX_WEBHOOK_URL={{BITRIX_WEBHOOK_URL}}
export TELEGRAM_BOT_PORT=3001

Then run:

node dist/services/telegram-bot/src/simple-server.js

Or with ts-node during development:

npx ts-node services/telegram-bot/src/simple-server.ts

