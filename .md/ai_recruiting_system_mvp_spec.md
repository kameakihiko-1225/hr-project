
# 🧠 AI-Based Recruiting System — MVP Specification

## 🎯 Objective
Build a full-stack, AI-powered recruiting system that enables companies to:
- Publish open roles publicly
- Automate interviews via Telegram bots
- Train custom GPT agents per position
- Sync leads with Bitrix CRM
- Control everything from a secure `/admin` dashboard

---

## 🧱 Technology Stack

| Layer        | Tech                          |
|--------------|-------------------------------|
| Frontend     | Next.js App Router + Tailwind + ShadCN |
| Auth         | Supabase or custom token auth |
| Bot Platform | Node.js + Telegraf            |
| AI Backend   | OpenAI API, pgvector, LangChain (optional) |
| Transcription| `navaistt_v2_medium` (HuggingFace) |
| CRM          | Bitrix24 (webhook only)       |
| DB           | Neon (PostgreSQL)             |
| Hosting      | Vercel (UI), Render/VM (bot)  |

---

## 🔐 Roles

- **Super Admin**: can create/manage admins, limit usage (e.g. max companies per admin)
- **Admin**: owns companies, bots, Bitrix mappings, positions, training data
- **Candidate**: Telegram-only user; applies via bot, no login required

---

## 📁 System Structure

### 🔹 1. Public Recruiting Website (built in Cursor UI)
- `/` homepage with:
  - Real-time job stats
  - `JobCard.tsx` from live DB
  - Filter bar (`SectionFilter.tsx`) with dynamic filters from DB
  - "Apply via AI" button linking to job-specific bot conversation

---

### 🔹 2. Admin Panel (`/admin`)
- Auth-protected (Supabase/email)
- Routes:
  - `/admin/dashboard`: stats (companies, bots, applicants)
  - `/admin/companies`: CRUD with theming (logo, color)
  - `/admin/departments`: scoped to selected company
  - `/admin/positions`: multi-department mapping
  - `/admin/bitrix`: webhooks, stages, field map test
  - `/admin/sms`: bulk SMS UI to filtered users
  - `/admin/ai-trainer`: document upload + training chat
  - `/admin/admins`: only for super admin

---

### 🔹 3. Telegram Bot (per company)
- Registered by admin via token
- Hardcoded Phase 1 questions:
  - Name, Phone, Email, Country, Region, Preferred Modality
  - Can you work in {city}?
  - Start date, salary expectations
- Phase 2:
  - ChatGPT-generated questions (based on trained docs)
  - Audio + text input
  - Transcription with `navaistt_v2_medium`
- Outputs:
  - % match score
  - Text summary
  - Sent to candidate + stored + synced to Bitrix deal
- Inactivity reminders:
  - 1h, 2h, 3h, 5h, 8h... (configurable)
  - Stop if: reply / “I won’t apply” / bot blocked
  - If no reply in 5 days → move to “No response” deal stage

---

### 🔹 4. Database (Neon PostgreSQL)
- RLS enforced via `app.current_admin`
- Key tables:
  - `admins`, `companies`, `departments`, `positions`
  - `bots`, `candidates`, `interviews`, `chat_sessions`
  - `bitrix_mappings`, `crm_deals`, `documents`
  - `sms_logs`, `messages_queue`
- Enhanced fields:
  - `companies`: logo, city, country, address
  - `positions`: modality, expected start, salary range, city

---

### 🔹 5. Bitrix Integration
- Webhook setup UI per company
- Stage mapping:
  - `stage_new`, `stage_no_response`, `stage_rejected`
- Field map: custom JSON per deal/contact field
- Duplicate check on contact (email/phone)
- Deal auto-creation on Phase 1 start

---

### 🔹 6. AI Interview Assistant
- Document training by position (PDF, .md, .txt)
- Chat training: corrections like “Respond more formally” or “Use this example”
- Live GPT inference for Phase 2
- Real-time summarization and scoring
- Stored per candidate → visible in admin dashboard

---

### 🔹 7. Automation Layer
- Cron jobs to:
  - Track inactivity timestamps
  - Schedule CTA messages
  - Move silent users to `stage_no_response`
  - Clean up abandoned leads
- Priority queue for bots to avoid rate limits

---

## 🧪 Optional Future Features

| Feature                        | Description                                       |
|-------------------------------|---------------------------------------------------|
| Recruiter chat                | Admin → Candidate real-time messaging             |
| Multi-language support        | Bot + UI in multiple locales                      |
| GPT-based CV parsing          | Upload → auto-match to best positions             |
| Feedback to rejected users    | Custom messages for rejected stage                |
| AI scoring tuner              | Adjust GPT scoring logic by admin input           |
| Candidate ranking             | Within department/position view                   |

---

## ⏳ Timeline Recommendation (Phased Delivery)

| Phase | Name            | Duration | Priority |
|-------|-----------------|----------|----------|
| 1     | DB Schema + RLS | 2–3 days | ✅ High  |
| 2     | Admin UI        | 4–6 days | ✅ High  |
| 3     | Bot Integration | 3–5 days | ✅ High  |
| 4     | Bitrix Sync     | 2–3 days | ✅ Medium|
| 5     | AI Training     | 4–6 days | 🟡 Mid  |
| 6     | Analytics       | 3–4 days | 🟡 Mid  |
| 7     | Automation      | 2–3 days | 🟡 Mid  |

---

## ✅ Deliverables Summary

- [ ] Public recruiting website with live job updates
- [ ] Telegram bot with 2-phase interviews and GPT scoring
- [ ] Admin panel with full CRUD and access control
- [ ] AI assistant that can be trained per role
- [ ] CRM integration with Bitrix24 and smart deal stage sync
- [ ] Cron-based automation for reminder workflows
