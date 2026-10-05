# GitLab Learning & Assessment Portal
### Course: 25CSAE370 — Project Management with Git
**Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM), Bantakal, Udupi**

---

## 1. Overview

The **GitLab Learning & Assessment Portal** is a production-grade academic laboratory learning management and examination platform developed specifically for college laboratory courses (`25CSAE370: Project Management with Git`).

The portal provides an end-to-end laboratory assessment workflow across four tightly integrated modules:
1. **Self-Learning Videos**: 12 structured curriculum units, sequential unlocking, custom video player with server-authoritative anti-skip heartbeats, and PDF reference notes.
2. **Faculty-Controlled Exam Floor**: Real-time live floor management, section and operational batch filters, roll-number quick entry, QR check-in, late-finisher auto-opening, and non-blocking faculty broadcasts.
3. **Proctored Randomized MCQ Quiz**: Stratified question selection across syllabus units and difficulties, server-side option shuffling, authoritative countdown timers, and anti-cheat deterrence (fullscreen lock, watermark, shortcut blocks, and auto-submit on 3 violations).
4. **Typed Viva Voce with AI Auto-Evaluation**: Server-side Google Gemini (`gemini-2.5-flash`) evaluation with prompt-injection defense, strict JSON rubric matching, confidence scoring, and faculty manual mark override with audit logs.
5. **Marks Freeze & Release**: Three-phase state machine (`Draft` → `Frozen` → `Released`) ensuring complete confidentiality until formal faculty release, followed by instant PDF Certificate generation.

---

## 2. Architecture & Technology Stack

### Frontend Architecture
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 with custom academic LMS theme (Deep navy `#0f172a`, cool-grey neutral base, module-specific badges)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Video progression & score distribution histograms)
- **Utilities**: `jspdf` & `jspdf-autotable` (PDF certificate & printable registers), `xlsx` & `papaparse` (Excel & CSV import/export)
- **Validation**: Zod schema validation

### Backend Architecture
- **Database**: PostgreSQL with normalized schema, foreign keys, unique constraints, and Row Level Security (RLS)
- **Server Platform**: Supabase (Database, Auth, Storage, Realtime, and Edge Functions)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash` at temperature 0.0) invoked exclusively through server-side Supabase Edge Functions with zero API key leakage to browser bundles
- **Dual-Mode Engine**: Operates against live Supabase backend when environment variables are supplied, with seamless client-side high-fidelity simulation engine for offline local demonstration and automated testing.

---

## 3. Project Structure

```text
git_lab_portal/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Header.tsx             # Multi-role simulator, announcements, course metadata
│   │       └── Sidebar.tsx            # Role-scoped student & faculty console navigation
│   ├── features/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx      # Video watch metrics & score distribution charts
│   │   │   ├── AdminLearningManagement.tsx # Curriculum unit publication toggle
│   │   │   ├── AuditLogViewer.tsx     # Chronological security ledger
│   │   │   ├── ExamSessionsManagement.tsx # Multi-batch exam creation & lifecycle controls
│   │   │   ├── ExportsAndPrintables.tsx # Excel/CSV export & printable attendance/marks register
│   │   │   ├── ProctoringReview.tsx   # Violation telemetry and risk indicator review
│   │   │   ├── QuestionBankManagement.tsx # MCQ (40) & Viva (15) question repositories
│   │   │   └── StudentsManagement.tsx  # Section/Batch assignments & CSV import
│   │   ├── auth/
│   │   │   ├── PracticeMode.tsx       # Untimed, unproctored student practice sandbox
│   │   │   └── StudentDashboard.tsx   # Video progress ring & exam stage stepper
│   │   ├── exam/
│   │   │   ├── ExamFloor.tsx          # Realtime faculty live floor, roll quick entry, QR check-in
│   │   │   └── StudentExamPortal.tsx  # Pre-exam integrity checks & assessment launcher
│   │   ├── learning/
│   │   │   ├── LearningPath.tsx       # 12 units sequential progression & video list
│   │   │   └── VideoPlayer.tsx        # Anti-skip, pause-on-blur, server heartbeat player
│   │   ├── quiz/
│   │   │   └── QuizArena.tsx          # Distraction-free proctored MCQ arena with watermark
│   │   ├── results/
│   │   │   ├── ResultsAndMarksControl.tsx # Marks state machine & manual viva override
│   │   │   └── StudentResults.tsx     # Student score breakdown & PDF certificate generator
│   │   └── viva/
│   │       └── VivaArena.tsx          # Typed viva with paste-blocking & Gemini AI submission
│   ├── lib/
│   │   └── supabase.ts                # Supabase client connector with live detection
│   ├── services/
│   │   ├── mockData.ts                # SMVITM initial syllabus seed data & roster
│   │   └── store.ts                   # Server-authoritative reactive state engine
│   ├── tests/
│   │   └── portal.test.ts             # 13 Vitest tests asserting all 9 build phases
│   ├── types/
│   │   └── index.ts                   # Comprehensive TypeScript definitions
│   ├── App.tsx                        # Main application router
│   ├── index.css                      # Tailwind v4 academic LMS design tokens
│   └── main.tsx                       # React DOM entry point
├── supabase/
│   ├── functions/                     # 12 Supabase Edge Functions (Deno / TypeScript)
│   │   ├── _shared/cors.ts            # CORS headers
│   │   ├── close-session/index.ts     # Auto-submits lingering attempts
│   │   ├── evaluate-viva/index.ts     # Gemini AI evaluation with prompt-injection defense
│   │   ├── extend-time/index.ts       # Server-side timer extension
│   │   ├── import-questions/index.ts  # Bulk question import validation
│   │   ├── mark-lab-complete/index.ts # Lab execution confirmation & auto-open
│   │   ├── open-exam/index.ts         # Granular student/batch/lab-done opening
│   │   ├── proctor-event/index.ts     # Realtime risk recalculation & auto-submit
│   │   ├── release-marks/index.ts     # Draft -> Frozen -> Released state transitions
│   │   ├── save-answer/index.ts       # Server-side answer autosave without client grading
│   │   ├── start-attempt/index.ts     # Eligibility, video gate, stratification, & shuffling
│   │   ├── submit-attempt/index.ts    # Authoritative grading & receipt generation
│   │   └── video-heartbeat/index.ts   # Anti-skip progression & parallel session rejection
│   ├── migrations/
│   │   └── 20261004000000_init_schema.sql # Complete PostgreSQL schema with RLS & indexes
│   └── seed.sql                       # Initial seed with 12 units, 40 MCQs, 15 Viva rubrics
├── .env.example                       # Environment configuration template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Academic Structure: Sections vs Operational Batches

As specified in **Section 4 & 5**, the portal strictly decouples academic sections from operational lab batches:

```text
Section A (CSE)
├── Batch A1 (Roll 001 - 030)
└── Batch A2 (Roll 031 - 060)

Section B (CSE)
├── Batch B1 (Roll 001 - 030)
└── Batch B2 (Roll 031 - 060)

Section C (CSE)
├── Batch C1 (Roll 001 - 030)
└── Batch C2 (Roll 031 - 060)
```

- **Sections**: Broad administrative cohorts (`A`, `B`, `C`).
- **Operational Lab Batches**: Physical laboratory floor units (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`).
- **Batch Unassigned State**: Imported student rosters without finalized batch allocations appear as `Batch Unassigned`. They can browse self-learning units, but are prevented from starting batch-specific proctored exam sessions until explicitly assigned to an operational batch.

---

## 5. Security & Server Authoritativeness

To eliminate client-side cheating and bypasses, all critical rules execute server-side:

| Sensitive Logic | Frontend Role | Server Role (PostgreSQL & Edge Functions) |
|---|---|---|
| **MCQ Correct Answers** | Renders shuffled options with display IDs | Stores true keys; client **never** receives `is_correct` flags before submission |
| **Exam Eligibility** | Shows contextual status messaging | Checks token, target batch, lab completion, video gate, and retake grants |
| **Exam Timers** | Displays local countdown | Authoritative start timestamp + duration; refresh or local clock tampering cannot extend time |
| **Video Completion** | Sends 4s heartbeats | Rejects forward skips > 2.5s; blocks parallel tabs; marks complete only at >=95% watch time |
| **Grading** | Sends selected option ID | Evaluates marks in `submit-attempt` using server database keys |
| **Viva Rubrics** | Captures typed student textarea | Reference answer & rubric kept private; Gemini evaluates on Edge Function |
| **Marks Release** | Displays "Awaiting Release" placeholder | Restricts score breakdown until state is transitioned to `Released` |

---

## 6. Exam Workflow

The assessment lifecycle strictly follows the university laboratory sequence:

```text
Self-Learning Videos (95% Watch Req)
        ↓
Lab Program Execution in Laboratory
        ↓
Faculty Verifies & Marks Lab Complete (Marks: 0-30)
        ↓
Faculty / Auto-Open Unlocks Assessment Paper
        ↓
Pre-Exam Checks (Fullscreen, Camera Consent, Watermark)
        ↓
Proctored Randomized MCQ Quiz (20 Mins, 12 MCQs, Anti-Cheat)
        ↓
Typed Viva Voce (20 Mins, 5 Questions, AI Rubrics)
        ↓
Submission Receipt Generated (SMVITM-...)
        ↓
Draft Results → Frozen → Released by Faculty
        ↓
Student Score Breakdown & Downloadable PDF Certificate
```

---

## 7. Local Setup & Running

### Prerequisites
- Node.js >= 18 (Tested on v22.19.0)
- npm >= 9

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

If connecting to your Supabase project, set:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
GEMINI_API_KEY=AIzaSy...
```
*Note: If left empty, the portal operates in high-fidelity sandbox mode with full offline simulation!*

### Step 3: Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 4: Run Automated Tests
```bash
npm test
```
All 13 unit & security tests will run with Vitest.

### Step 5: Build for Production
```bash
npm run build
```

---

## 8. Deployment to Production

### Deploying Database & Edge Functions to Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Run the database migration script in SQL Editor:
   ```sql
   -- Run contents of supabase/migrations/20261004000000_init_schema.sql
   -- Run contents of supabase/seed.sql
   ```
3. Deploy Edge Functions using the Supabase CLI:
   ```bash
   supabase functions deploy video-heartbeat
   supabase functions deploy start-attempt
   supabase functions deploy save-answer
   supabase functions deploy submit-attempt
   supabase functions deploy evaluate-viva
   supabase functions deploy proctor-event
   supabase functions deploy mark-lab-complete
   supabase functions deploy open-exam
   supabase functions deploy extend-time
   supabase functions deploy close-session
   supabase functions deploy release-marks
   supabase functions deploy import-questions
   ```
4. Set Edge Function Secrets in Supabase Dashboard:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key GEMINI_MODEL=gemini-2.5-flash
   ```

### Deploying Frontend to Vercel / Netlify
1. Connect the GitHub repository to Vercel or Netlify.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`

---

## 9. Browser Proctoring Limitations & Assumptions

As required by **Section 87 & 104**, browser-based proctoring functions as a **deterrence and evidence system**, not foolproof surveillance. The following limitations are acknowledged:

### Proctoring Limitations
1. **Secondary Physical Devices**: Browser software cannot detect smartphones, second laptops, or reference textbooks placed adjacent to the monitor.
2. **External Cameras & Hardware Splitters**: HDMI splitters and hardware video capture devices cannot be detected through JavaScript browser APIs.
3. **Virtual Machines & Sandboxes**: Sophisticated hypervisors and VMs cannot be reliably detected from browser user-space.
4. **DevTools Advanced Techniques**: Undetected headless browsers or detached DevTools sessions cannot be guaranteed against.

### Platform Assumptions
1. **Academic Honesty Policy**: In-person lab proctors and faculty remain the primary supervisory authority; the portal provides real-time telemetry alerts, watermarks, and audit evidence.
2. **Camera Snapshots**: Webcams take snapshots strictly when consent is granted by the student; snapshots are stored in private storage and retained for 90 days following semester grade finalization.
3. **Violation Policy**: 3 cumulative violations (fullscreen exits, tab switches, blocked shortcuts) automatically submit the student's paper and flag the attempt with risk rating `High`. Faculty retain final override authority.

---

## 10. License

Developed for **Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM)** for academic course `25CSAE370`. All rights reserved.
