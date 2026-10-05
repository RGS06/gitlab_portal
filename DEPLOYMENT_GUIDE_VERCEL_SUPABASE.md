# GitLab Learning & Assessment Portal — Production Deployment Guide
**Course**: `25CSAE370 - Project Management with Git`  
**Institution**: Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM), Bantakal  
**Stack**: React 19 + TypeScript + Vite + Tailwind CSS + Supabase (PostgreSQL + RLS + Edge Functions) + Vercel

---

## Architecture Overview

```
                               ┌────────────────────────┐
                               │   Vercel Edge CDN      │
                               │  (Vite React Frontend) │
                               └───────────┬────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                        ▼                                     ▼
           ┌────────────────────────┐            ┌────────────────────────┐
           │   Supabase Database    │            │ 12 Supabase Functions  │
           │  (Postgres 15 + RLS)   │            │   (Server-Authoritative│
           │  • Sections A, B, C    │            │    Timer, MCQ & Viva)  │
           │  • 145 CSE Students    │            └────────────────────────┘
           │  • Course Units 1–12   │
           └────────────────────────┘
```

The portal runs in **two modes**:
1. **Cloud Production Mode**: Connects directly to Supabase with PostgreSQL Row Level Security (RLS) and Edge Functions.
2. **Offline / Fallback Simulation Mode**: If Supabase environment variables are omitted, the application runs entirely in reactive client simulation mode with localStorage persistence, allowing instant zero-dependency testing.

---

## Pre-Requisites

Before starting, ensure you have:
- [x] A **GitHub account** (with this repository pushed to your GitHub)
- [x] A free account on [Supabase](https://supabase.com)
- [x] A free account on [Vercel](https://vercel.com)
- [x] (Optional) Google Gemini API Key from [Google AI Studio](https://aistudio.google.com) for automated AI Viva grading

---

## Phase 1: Supabase Setup (Database & Security)

### Step 1.1: Create a New Supabase Project
1. Log in to [database.new](https://database.new) (Supabase Console).
2. Click **"New Project"**.
3. Fill in:
   - **Name**: `git-lab-portal-smvitm` (or your choice)
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Select `ap-south-1 (Mumbai)` for fastest latency to college lab workstations.
4. Click **"Create new project"** (takes ~1-2 minutes to provision).

---

### Step 1.2: Retrieve Project Credentials
Once the project is created:
1. Navigate to **Project Settings** (gear icon in left sidebar) -> **API**.
2. Note down the following values:
   - **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
   - **`anon` `public` key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **`service_role` `secret` key** (keep this confidential)

---

### Step 1.3: Run Database Migrations & Schemas
1. Open your Supabase Dashboard and go to the **SQL Editor** (terminal icon in left menu).
2. Click **"New Query"**.
3. Open [`supabase/migrations/20261004000000_init_schema.sql`](file:///E:/git_lab_portal/supabase/migrations/20261004000000_init_schema.sql) in your editor, copy the entire file contents, paste into the Supabase SQL Editor, and click **"Run"**.
   - *This creates all tables (`sections`, `batches`, `profiles`, `units`, `videos`, `exam_sessions`, `attempts`, `audit_logs`), Row-Level Security policies, and performance indexes.*

---

### Step 1.4: Seed Initial Course Data & Faculty
1. Click **"New Query"** in the Supabase SQL Editor.
2. Open [`supabase/seed.sql`](file:///E:/git_lab_portal/supabase/seed.sql), copy all content, paste into the SQL Editor, and click **"Run"**.
   - *This seeds:*
     - **Section A**: Mr. Raghavendra G.S (`raghugs.cs@sode-edu.in`)
     - **Section B**: Ms. Ashritha K P (`ashritha.cs@sode-edu.in`)
     - **Section C**: Ms. R. Soundharya (`soundharya.cs@sode-edu.in`)
     - **Batches A1, A2, B1, B2, C1, C2**
     - **12 Course Units (Exp 1 to Exp 12)**
     - Video tutorials, initial MCQs, and Viva Rubrics

---

### Step 1.5: Seed Official 145 Student Roster
1. Click **"New Query"** in the Supabase SQL Editor.
2. Open [`supabase/seed_students.sql`](file:///E:/git_lab_portal/supabase/seed_students.sql), copy all content, paste into the SQL Editor, and click **"Run"**.
   - *This automatically registers all **145 actual CSE students** sourced from `Updated 2026-2027 ODD Sem CSE Student List.xlsx` with their official USNs, emails, section allocations, and lab batches.*

---

### Step 1.6: Enforce @sode-edu.in Domain Policy in Supabase
To ensure only institutional college accounts can authenticate:
1. In Supabase Dashboard, navigate to **Authentication** (lock icon) -> **Sign In / Up Providers** -> **Email**.
2. Under **Allowed Domains / Domain Allowlist**, add:
   ```
   sode-edu.in
   ```
3. Save settings.
4. *Database-level security*: The migration in `init_schema.sql` contains `chk_sode_edu_domain` which automatically rejects any profile insert or update that does not match `^[A-Za-z0-9._%+-]+@sode-edu\.in$`. All personal email providers (@gmail, @yahoo, etc.) are strictly ignored.

---

### Step 1.7: (Optional) Deploy Supabase Edge Functions
If you wish to host the server-authoritative proctoring and Gemini AI evaluation on Supabase Edge Functions:
1. Install Supabase CLI locally:
   ```powershell
   npm install -g supabase
   ```
2. Login and link your project:
   ```powershell
   supabase login
   supabase link --project-ref <YOUR_SUPABASE_PROJECT_ID>
   ```
3. Set your server secrets:
   ```powershell
   supabase secrets set GEMINI_API_KEY="your_gemini_api_key_here"
   supabase secrets set GEMINI_MODEL="gemini-2.5-flash"
   ```
4. Deploy all 12 Edge Functions:
   ```powershell
   supabase functions deploy
   ```

---

## Phase 2: Vercel Frontend Deployment

### Step 2.1: Push to GitHub
Make sure your project repository is committed and pushed to your GitHub account:
```powershell
git add .
git commit -m "feat: complete SMVITM GitLab Learning & Assessment Portal ready for production"
git push origin main
```

---

### Step 2.2: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** -> **"Project"**.
3. Select your GitHub repository (`git_lab_portal`) and click **"Import"**.

---

### Step 2.3: Configure Build & Environment Settings
In the Vercel project configuration screen:

1. **Framework Preset**: Detects automatically as **Vite** (leave as Vite).
2. **Root Directory**: `./`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

#### Expand "Environment Variables" and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | From Supabase Project Settings -> API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR...` | From Supabase Project Settings -> API |
| `VITE_APP_URL` | `https://your-vercel-app.vercel.app` | Leave blank or your custom domain |

*(Note: If you want to deploy the app with the high-performance offline simulation store first before connecting Supabase, you can deploy without setting these env vars—the app will automatically run smoothly in standalone mode).*

6. Click **"Deploy"**.

---

### Step 2.4: Single Page Application Routing (`vercel.json`)
The repository includes [`vercel.json`](file:///E:/git_lab_portal/vercel.json):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
*This ensures refreshing any internal route never throws a 404 error on Vercel.*

---

## Phase 3: Post-Deployment Verification Checklist

Once Vercel completes deployment (usually under 60 seconds):

### 1. Faculty Roles & Section Assignments
1. Click your live Vercel URL (e.g. `https://git-lab-portal-smvitm.vercel.app`).
2. Open the user switcher in the top right header:
   - Verify **Mr. Raghavendra G.S** (`raghugs.cs@sode-edu.in`) — **Section A In-Charge**
   - Verify **Ms. Ashritha K P** (`ashritha.cs@sode-edu.in`) — **Section B In-Charge**
   - Verify **Ms. R. Soundharya** (`soundharya.cs@sode-edu.in`) — **Section C In-Charge**

### 2. Marks Excel Export Verification
1. Click **"Marks Excel Export"** in the sidebar.
2. Confirm the 3 section cards display:
   - Section A: **50 Students**
   - Section B: **49 Students**
   - Section C: **46 Students**
3. Click **"Download Master Excel (.xlsx)"**:
   - Verify the downloaded file opens in Microsoft Excel.
   - Verify all 5 sheets exist:
     - `Section Summary`
     - `Section A - Raghavendra`
     - `Section B - Ashritha`
     - `Section C - Soundharya`
     - `All Students - Question-Wise`
   - Confirm granular question-wise columns **Q1–Q12**, **Viva V1–V5**, **Lab (30)**, and **Grand Total CIE (50)**.

### 3. Lab Workstation Mode (No Webcams)
1. Switch to student role (`Aditya Nayak`).
2. Go to **"Lab Exam / Assessment"** -> Click **"Take Assessment"**.
3. Verify that the Pre-Exam check shows **"Lab Workstation Mode: No Webcam Required"** and allows students on lab PCs to enter the exam floor seamlessly.

---

## Faculty Quick-Reference

| Task | Navigation Path | Responsible Faculty |
| :--- | :--- | :--- |
| **Mark Lab Execution (0–30)** | Faculty Console -> **Live Exam Floor** | Section Faculty In-Charge |
| **Authorize Student Exam Access** | Faculty Console -> **Live Exam Floor** -> Quick Open | Handling Faculty |
| **Download Question-Wise Marks Excel** | Faculty Console -> **Marks Excel Export** -> Download | Any Faculty / HOD |
| **Freeze / Lock Final CIE Marks** | Faculty Console -> **Marks Freeze & Release** | Section In-Charge / Exam Coordinator |

---

## Troubleshooting & FAQ

#### Q: How do I update or add new students after deployment?
**A:** Navigate to **"Students & Batches"** in the faculty console. Click **"Import Students (CSV / Excel)"** to upload an updated spreadsheet at any time.

#### Q: Can students skip video lessons before exam day?
**A:** The portal enforces sequential lesson unlocking with server-authoritative heartbeat telemetry. Fast-forward seeking is capped at 2.5 seconds ahead of watched position, ensuring authentic 95% completion before a unit marks complete.

#### Q: What if a student accidentally closes the browser tab during the MCQ or Viva?
**A:** The portal caches the active attempt token and question order. When the student opens the page again on the same machine, they are resumed at the exact same question paper with remaining time intact.
