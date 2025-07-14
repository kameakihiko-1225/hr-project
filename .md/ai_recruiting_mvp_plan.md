## 🧠 MVP Development Plan: AI-Based Recruiting System

### PHASE 1 — DATABASE SCHEMA (NEONDB)

Design secure, multi-tenant schema with auditability.

```sql
-- Role-based access (for RLS)
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;

-- Admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_superadmin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- Companies (enhanced with address, phone, etc.)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  color HEX,
  address TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  country TEXT,
  description TEXT,
  admin_id UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Departments (enhanced with optional description)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Positions (enhanced with employment type, start date, etc.)
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  city TEXT,
  country TEXT,
  salary_range TEXT,
  employment_type TEXT CHECK (employment_type IN ('remote', 'offline', 'hybrid')),
  expected_start_date DATE,
  language_requirements TEXT,
  qualifications TEXT,
  responsibilities TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Many-to-many: positions <-> departments
CREATE TABLE department_positions (
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  PRIMARY KEY (department_id, position_id)
);

-- Telegram Bots
CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  admin_id UUID REFERENCES admins(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  telegram_id TEXT UNIQUE,
  country TEXT,
  region TEXT,
  position_id UUID REFERENCES positions(id),
  bot_id UUID REFERENCES bots(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Interviews (1st and 2nd phase status)
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  phase_1_completed BOOLEAN DEFAULT FALSE,
  phase_2_completed BOOLEAN DEFAULT FALSE,
  summary TEXT,
  score NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

-- ChatGPT Session Logs
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  messages JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Uploaded Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  department_id UUID REFERENCES departments(id),
  position_id UUID REFERENCES positions(id),
  file_url TEXT,
  file_type TEXT,
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Bitrix Webhook Mappings
CREATE TABLE bitrix_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  webhook_url TEXT,
  stage_new TEXT,
  stage_no_response TEXT,
  stage_rejected TEXT,
  field_map JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- CRM Deals Synced
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  deal_id TEXT,
  status TEXT,
  synced_at TIMESTAMP DEFAULT now()
);

-- SMS Logs
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  message TEXT,
  media_type TEXT,
  media_id TEXT,
  sent_at TIMESTAMP DEFAULT now()
);

-- Cron Message Queue
CREATE TABLE messages_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  message TEXT,
  type TEXT CHECK (type IN ('reminder', 'final_warning')),
  scheduled_for TIMESTAMP,
  sent BOOLEAN DEFAULT FALSE
);
```

---

### PHASE 2 — ADMIN PANEL

**Tech**: Next.js (App Router), TailwindCSS + ShadCN, Supabase Auth

**Routes**:

- `/admin/login`, `/admin/dashboard`
- `/admin/companies` — CRUD
- `/admin/departments` — CRUD scoped to company
- `/admin/positions` — CRUD scoped to deps
- `/admin/admins` — for superusers
- `/admin/bot-manager` — per-bot health/test
- `/admin/bitrix` — webhook mapping, test buttons
- `/admin/sms` — filtering UI, message sending, fileId support
- `/admin/ai-trainer` — upload, chat train, assign to position

**Components:**

- `StatsCards.tsx`, `CompanyList.tsx`, `BotTest.tsx`, `MappingPanel.tsx`, `SmsSender.tsx`, `AiTrainer.tsx`

---

### PHASE 3 — TELEGRAM BOT

**Stack**: Node.js + `telegraf`, hosted on render.com or cloud VM

**Flow:**

1. Start → Welcome
2. Phase 1 Questions (stored in DB)
3. Phase 2 — AI-generated Qs
4. Voice/Text answers → Transcribe with `navaistt_v2_medium`
5. Summarize with ChatGPT (trained model)
6. Send summary + % match
7. Provide HR contact info from company record
8. Bitrix sync (deal created)

**Features:**

- `/getFileId` handler
- Cron-based messaging
- Inactivity timeout detection (5 days → failed deal)
- Deep link support for job-position reference

---

### PHASE 4 — PUBLIC RECRUITING WEBSITE

**Built in Cursor UI** — connect to backend

**Pages/Components:**

- `HeroSection.tsx` — stats from DB
- `StatsSection.tsx` — breakdowns
- `JobCard.tsx` — live feed of positions
- `SectionFilter.tsx` — dynamic filters (company, dep, pos)
- `ApplyButton.tsx` — links to Telegram

**Data Flow:**

- SSR or SWR to fetch real-time stats/positions
- Revalidation on position CRUD

---

### PHASE 5 — AI TRAINING SYSTEM

**Functionality:**

- Upload `.pdf`, `.md`, `.txt` to vector DB
- Assign to company/department/position
- Chat training mode: "Answer like this", "Read section 3 again"
- Store training logs
- Real-time retraining (prompt injection or RAG)

**Tools:**

- `pgvector` for Neon
- LangChain or custom embeddings parser

---

### PHASE 6 — ANALYTICS DASHBOARD

**Modules:**

- Leads per stage (bot + Bitrix)
- Funnel conversion (phase 1 → phase 2)
- Top performing positions/departments
- Candidate source map (country/region)
- SMS campaign effectiveness

---

### PHASE 7 — AUTOMATION

**Cron System:**

- Node.js + `node-cron`
- Queue CTA messages
- Resume logic after user activity
- Stop logic on block, reject, timeout

---

Next step: seed dummy data for companies, admins, positions, and test RLS for multitenancy access.

