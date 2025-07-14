🧾 Unified Task Description Prompt for AI Recruiting System (MVP)

⸻

🎯 Objective:

Build a full-stack, AI-powered recruiting system that enables companies to publish jobs, run AI-enhanced interviews via Telegram bots, sync candidate data with Bitrix24, and manage the entire pipeline from a centralized admin dashboard. Admins can create and manage their own companies, positions, bots, and workflows.

⸻

🔑 Key Components:

1. Main Website (built in Cursor UI)
	•	Displays open positions dynamically from DB
	•	Includes job filters (company, department, location)
	•	JobCard has “Apply via AI” button → launches Telegram bot
	•	Hero/stats sections auto-update with real-time analytics

2. Admin Panel (/admin path only)
	•	Auth-protected dashboard (Supabase or custom auth)
	•	CRUD for: companies, departments, positions, bots, admins
	•	Bitrix24 integration setup with webhook testing & stage mapping
	•	SMS sending to candidates (filter by company/position/stage)
	•	AI Trainer interface for uploading PDFs, .md, .txt, and training the bot
	•	Real-time dashboard: deal stage funnel, bot-user conversion, etc.
	•	Theming (logo, colors) per admin/company

3. Telegram Interview Bot
	•	Created by admin via bot token
	•	Multibot: one bot per admin/company
	•	Two-phase interview:
	•	Phase 1 (hardcoded structured Qs: name, phone, email, age, region, preferred modality, etc.)
	•	Phase 2 (AI-generated questions + audio/text reply support + % assessment summary via GPT)
	•	Uses navaistt_v2_medium for speech-to-text
	•	Summary returned to candidate with HR contact info
	•	Syncs result to Bitrix CRM deal (staged by response behavior)
	•	Contains /getFileId command for Telegram content linking
	•	Inactivity handling with cron jobs + auto reminders + failover deal placement

4. Database (PostgreSQL on Neon with pgvector)
	•	Multi-tenant with admin_id scoped RLS policies
	•	Tables: admins, companies, departments, positions, bots, candidates, interviews, documents, bitrix_mappings, crm_deals, chat_sessions, sms_logs, messages_queue
	•	Documents uploaded per position → used in GPT-based interview training
	•	Fully normalized + extendable schema

5. Bitrix24 Integration
	•	Admin provides Bitrix webhook (1 per company)
	•	Custom field mapping: contact/deal fields
	•	Stage mapping:
	•	stage_new: initial deal when user joins bot
	•	stage_no_response: user didn’t reply in time (cron-triggered)
	•	stage_rejected: user clicked “I won’t apply”
	•	Duplicates checking based on contact/phone/email
	•	Real-time deal creation and updates via webhook triggers

6. AI Interview Logic (ChatGPT-based)
	•	Each position can be trained using:
	•	Uploaded docs (PDF/.md/.txt) → vectorized
	•	Manual chat training (correct GPT answers via interactive chat)
	•	GPT assistant uses RAG or prompt injection
	•	Interview summary includes:
	•	% fit for position
	•	strengths/weaknesses (based on user’s answers)
	•	optional red flags or suggestions

7. Automation (Cron Jobs)
	•	Tracks Telegram bot user inactivity
	•	Sends reminder messages at intervals:
	•	+1h → msg 1
	•	+2h → msg 2
	•	+3h → msg 3
	•	+5h, +8h, etc.
	•	Messages stop if user replies or clicks a CTA
	•	Final fallback: after 5 days → mark deal as failed in Bitrix
	•	All logic should avoid re-sending once user replies or blocks the bot

⸻

🧪 Advanced Features (optional in Phase 1):
	•	Recruiter/candidate chat inside admin panel
	•	Auto-matching engine (GPT-based matching of CV to position)
	•	AI-based candidate ranking by department
	•	Multi-language support (UI & bot flow)

⸻

🧱 Technologies Used:
	•	Frontend: Next.js App Router + ShadCN + Tailwind
	•	Backend: Neon PostgreSQL + Supabase (or pg/Prisma)
	•	Bot: Node.js + Telegraf + Huggingface Whisper
	•	CRM: Bitrix24 (webhooks only)
	•	AI: OpenAI (token-auth), LangChain (optional), pgvector
	•	Hosting: Vercel (web), Render.com (bot) or custom VPS
	•	Database Security: Row-Level Security for tenant isolation

⸻

✅ Output Goals:
	•	All features scoped within /admin dashboard
	•	One bot per admin/company
	•	All candidate data synced to both local DB and Bitrix
	•	AI interviews are feedback-driven and extensible
	•	The system is deployable on cloud without third-party orchestration tools
