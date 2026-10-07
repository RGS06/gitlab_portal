-- GitLab Learning & Assessment Portal Schema
-- Course: 25CSAE370 - Project Management with Git
-- SMVITM, Bantakal

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_code TEXT NOT NULL UNIQUE,
    section_name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    program TEXT NOT NULL,
    handling_faculty_name TEXT,
    handling_faculty_email TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. OPERATIONAL BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    batch_code TEXT NOT NULL,
    batch_name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    program TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_section_batch UNIQUE(section_id, batch_code)
);

-- 3. PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_number TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_sode_edu_domain CHECK (email ~* '^[A-Za-z0-9._%+-]+@sode-edu\.in$')
);

-- Drop auth.users FK constraint if it exists (allows pre-seeding the 145 student/faculty roster before auth signup)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 4. UNITS (12 Lab Units from Course Syllabus)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_number INT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    program_number TEXT NOT NULL,
    description TEXT NOT NULL,
    notes_url TEXT,
    key_takeaways TEXT[] DEFAULT '{}',
    published BOOLEAN DEFAULT false,
    learning_closes_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. VIDEOS
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('youtube', 'self_hosted')),
    source_url TEXT NOT NULL,
    duration_seconds INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. VIDEO PROGRESS
CREATE TABLE IF NOT EXISTS public.video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    watched_seconds NUMERIC DEFAULT 0,
    max_position_seconds NUMERIC DEFAULT 0,
    last_position_seconds NUMERIC DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    session_id TEXT,
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_student_video UNIQUE(student_id, video_id)
);

-- 7. VIDEO HEARTBEATS (Auditing Watch Progress)
CREATE TABLE IF NOT EXISTS public.video_heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    position NUMERIC NOT NULL,
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ DEFAULT now(),
    delta_seconds NUMERIC NOT NULL,
    valid BOOLEAN DEFAULT true,
    rejection_reason TEXT
);

-- 8. MCQ QUESTIONS
CREATE TABLE IF NOT EXISTS public.mcq_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_text TEXT NOT NULL,
    code_snippet TEXT,
    explanation TEXT,
    tags TEXT[] DEFAULT '{}',
    is_practice BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. MCQ OPTIONS
CREATE TABLE IF NOT EXISTS public.mcq_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.mcq_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_key TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false
);

-- 10. VIVA QUESTIONS (Grading keys protected from students)
CREATE TABLE IF NOT EXISTS public.viva_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    question_text TEXT NOT NULL,
    reference_answer TEXT NOT NULL,
    key_concepts TEXT[] NOT NULL,
    rubric TEXT,
    max_marks NUMERIC NOT NULL DEFAULT 10,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. EXAM SESSIONS
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'lab_in_progress', 'active', 'paused', 'closed')),
    video_gate_mode TEXT NOT NULL DEFAULT 'strict' CHECK (video_gate_mode IN ('strict', 'warn_only', 'off')),
    part_order TEXT NOT NULL DEFAULT 'quiz_then_viva' CHECK (part_order IN ('quiz_then_viva', 'viva_then_quiz', 'both_tabs')),
    quiz_duration_seconds INT NOT NULL DEFAULT 1200,
    number_of_mcqs INT NOT NULL DEFAULT 12,
    number_of_viva_questions INT NOT NULL DEFAULT 5,
    proctoring_settings JSONB NOT NULL DEFAULT '{"webcam": true, "fullscreen": true, "anti_cheat": true}'::jsonb,
    violation_threshold INT NOT NULL DEFAULT 3,
    auto_open_when_lab_done BOOLEAN DEFAULT true,
    close_grace_seconds INT NOT NULL DEFAULT 120,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. EXAM SESSION BATCHES (Normalized targeting)
CREATE TABLE IF NOT EXISTS public.exam_session_batches (
    session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, batch_id)
);

-- 13. SESSION STUDENTS
CREATE TABLE IF NOT EXISTS public.session_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    section_id_snapshot UUID REFERENCES public.sections(id),
    batch_id_snapshot UUID REFERENCES public.batches(id),
    lab_status TEXT NOT NULL DEFAULT 'pending' CHECK (lab_status IN ('pending', 'completed')),
    lab_completed_at TIMESTAMPTZ,
    lab_completed_by UUID REFERENCES public.profiles(id),
    lab_marks NUMERIC,
    lab_remarks TEXT,
    quiz_open BOOLEAN DEFAULT false,
    viva_open BOOLEAN DEFAULT false,
    opened_by UUID REFERENCES public.profiles(id),
    opened_at TIMESTAMPTZ,
    extra_time_seconds INT DEFAULT 0,
    gate_override_reason TEXT,
    retake_allowed BOOLEAN DEFAULT false,
    marks_state TEXT NOT NULL DEFAULT 'draft' CHECK (marks_state IN ('draft', 'frozen', 'released')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_session_student UNIQUE(session_id, student_id)
);

-- 14. ATTEMPTS
CREATE TABLE IF NOT EXISTS public.attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    part_type TEXT NOT NULL CHECK (part_type IN ('quiz', 'viva', 'practice')),
    token TEXT NOT NULL UNIQUE,
    device_session_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'flagged', 'invalidated', 'auto_submitted')),
    started_at TIMESTAMPTZ DEFAULT now(),
    duration_seconds INT NOT NULL,
    extra_time_seconds INT DEFAULT 0,
    submitted_at TIMESTAMPTZ,
    submission_receipt TEXT,
    score NUMERIC,
    max_score NUMERIC,
    integrity_score NUMERIC DEFAULT 100,
    risk_level TEXT DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Medium', 'High')),
    violations_count INT DEFAULT 0,
    reviewed_by UUID REFERENCES public.profiles(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. ATTEMPT QUESTIONS (Frozen randomized order per student paper)
CREATE TABLE IF NOT EXISTS public.attempt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.mcq_questions(id) ON DELETE CASCADE,
    display_order INT NOT NULL,
    shuffled_option_ids UUID[] NOT NULL,
    CONSTRAINT uq_attempt_question UNIQUE(attempt_id, question_id)
);

-- 16. ATTEMPT ANSWERS
CREATE TABLE IF NOT EXISTS public.attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.mcq_questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.mcq_options(id),
    is_flagged BOOLEAN DEFAULT false,
    is_correct BOOLEAN,
    marks_awarded NUMERIC DEFAULT 0,
    saved_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_attempt_answer UNIQUE(attempt_id, question_id)
);

-- 17. VIVA ANSWERS (With AI evaluation and faculty override)
CREATE TABLE IF NOT EXISTS public.viva_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.viva_questions(id) ON DELETE CASCADE,
    student_answer TEXT NOT NULL,
    ai_marks NUMERIC,
    final_marks NUMERIC,
    ai_feedback TEXT,
    concepts_covered TEXT[] DEFAULT '{}',
    concepts_missing TEXT[] DEFAULT '{}',
    confidence NUMERIC,
    needs_manual_review BOOLEAN DEFAULT false,
    model_name TEXT,
    raw_model_response JSONB,
    override_reason TEXT,
    overridden_by UUID REFERENCES public.profiles(id),
    overridden_at TIMESTAMPTZ,
    similarity_flag BOOLEAN DEFAULT false,
    saved_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_attempt_viva UNIQUE(attempt_id, question_id)
);

-- 18. PROCTOR EVENTS
CREATE TABLE IF NOT EXISTS public.proctor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    severity INT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    snapshot_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. ANNOUNCEMENTS & BROADCASTS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'section', 'batch', 'session', 'student')),
    target_id TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES FOR HIGH-TRAFFIC & REALTIME QUERIES
CREATE INDEX IF NOT EXISTS idx_batches_section ON public.batches(section_id);
CREATE INDEX IF NOT EXISTS idx_profiles_section_batch ON public.profiles(section_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_roll ON public.profiles(roll_number);
CREATE INDEX IF NOT EXISTS idx_video_progress_student ON public.video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_session_students_session ON public.session_students(session_id);
CREATE INDEX IF NOT EXISTS idx_session_students_student ON public.session_students(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_session ON public.attempts(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON public.attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctor_events_attempt ON public.proctor_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcq_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_session_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viva_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read own profile; faculty/admin can read/manage all
DROP POLICY IF EXISTS "Profiles read own" ON public.profiles;
CREATE POLICY "Profiles read own" ON public.profiles FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Profiles admin manage" ON public.profiles;
CREATE POLICY "Profiles admin manage" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Sections & Batches: Read by all authenticated; write by faculty/admin
DROP POLICY IF EXISTS "Sections readable" ON public.sections;
CREATE POLICY "Sections readable" ON public.sections FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Sections admin" ON public.sections;
CREATE POLICY "Sections admin" ON public.sections FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Batches readable" ON public.batches;
CREATE POLICY "Batches readable" ON public.batches FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Batches admin" ON public.batches;
CREATE POLICY "Batches admin" ON public.batches FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Units & Videos: Published units readable by authenticated students; all readable by faculty/admin
DROP POLICY IF EXISTS "Units read" ON public.units;
CREATE POLICY "Units read" ON public.units FOR SELECT TO authenticated USING (published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Units admin" ON public.units;
CREATE POLICY "Units admin" ON public.units FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Videos read" ON public.videos;
CREATE POLICY "Videos read" ON public.videos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.units WHERE units.id = videos.unit_id AND (units.published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')))));

DROP POLICY IF EXISTS "Videos admin" ON public.videos;
CREATE POLICY "Videos admin" ON public.videos FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Video Progress: Student reads own; write through functions or faculty/admin
DROP POLICY IF EXISTS "Video progress read own" ON public.video_progress;
CREATE POLICY "Video progress read own" ON public.video_progress FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Video progress update own" ON public.video_progress;
CREATE POLICY "Video progress update own" ON public.video_progress FOR ALL USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Questions: Students CANNOT read is_correct from mcq_options before submit, or reference answers from viva_questions!
-- MCQ Questions readable
DROP POLICY IF EXISTS "MCQ questions read" ON public.mcq_questions;
CREATE POLICY "MCQ questions read" ON public.mcq_questions FOR SELECT TO authenticated USING (active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "MCQ options read student" ON public.mcq_options;
CREATE POLICY "MCQ options read student" ON public.mcq_options FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Viva questions student protected" ON public.viva_questions;
CREATE POLICY "Viva questions student protected" ON public.viva_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Exam Sessions: Read by authenticated; manage by faculty/admin
DROP POLICY IF EXISTS "Sessions read" ON public.exam_sessions;
CREATE POLICY "Sessions read" ON public.exam_sessions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Sessions faculty" ON public.exam_sessions;
CREATE POLICY "Sessions faculty" ON public.exam_sessions FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Session Students: Student reads own; faculty reads/manages all
DROP POLICY IF EXISTS "Session students read own" ON public.session_students;
CREATE POLICY "Session students read own" ON public.session_students FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Session students faculty" ON public.session_students;
CREATE POLICY "Session students faculty" ON public.session_students FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Attempts & Answers: Students read/write own; faculty reads all
DROP POLICY IF EXISTS "Attempts read own" ON public.attempts;
CREATE POLICY "Attempts read own" ON public.attempts FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Attempts faculty" ON public.attempts;
CREATE POLICY "Attempts faculty" ON public.attempts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

DROP POLICY IF EXISTS "Attempt answers read own" ON public.attempt_answers;
CREATE POLICY "Attempt answers read own" ON public.attempt_answers FOR SELECT USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = attempt_answers.attempt_id AND (attempts.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')))));

DROP POLICY IF EXISTS "Viva answers read own" ON public.viva_answers;
CREATE POLICY "Viva answers read own" ON public.viva_answers FOR SELECT USING (EXISTS (SELECT 1 FROM public.attempts WHERE attempts.id = viva_answers.attempt_id AND (attempts.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')))));

-- Proctor events: Write own, read own or faculty
DROP POLICY IF EXISTS "Proctor events insert" ON public.proctor_events;
CREATE POLICY "Proctor events insert" ON public.proctor_events FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Proctor events select" ON public.proctor_events;
CREATE POLICY "Proctor events select" ON public.proctor_events FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Announcements: Read by all; write by faculty/admin
DROP POLICY IF EXISTS "Announcements read" ON public.announcements;
CREATE POLICY "Announcements read" ON public.announcements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Announcements write" ON public.announcements;
CREATE POLICY "Announcements write" ON public.announcements FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));

-- Audit Logs: Read/write by faculty/admin only
DROP POLICY IF EXISTS "Audit logs faculty only" ON public.audit_logs;
CREATE POLICY "Audit logs faculty only" ON public.audit_logs FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin')));
