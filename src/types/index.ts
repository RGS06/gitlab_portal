export type UserRole = 'student' | 'faculty' | 'admin';

export interface Section {
  id: string;
  section_code: string; // e.g. 'A', 'B', 'C'
  section_name: string;
  academic_year: string;
  program: string;
  handling_faculty_name?: string;
  handling_faculty_email?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Batch {
  id: string;
  section_id: string;
  batch_code: string; // e.g. 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  batch_name: string;
  academic_year: string;
  program: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  roll_number: string;
  full_name: string;
  email: string;
  section_id?: string | null;
  batch_id?: string | null;
  section?: Section;
  batch?: Batch;
  role: UserRole;
  active: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Unit {
  id: string;
  unit_number: number;
  title: string;
  program_number: string;
  description: string;
  notes_url?: string;
  key_takeaways: string[];
  published: boolean;
  learning_closes_at?: string | null;
  videos?: Video[];
}

export interface Video {
  id: string;
  unit_id: string;
  title: string;
  source_type: 'youtube' | 'self_hosted';
  source_url: string;
  duration_seconds: number;
}

export interface VideoProgress {
  id: string;
  student_id: string;
  video_id: string;
  watched_seconds: number;
  max_position_seconds: number;
  last_position_seconds: number;
  completed: boolean;
  completed_at?: string | null;
  session_id?: string;
  last_heartbeat_at?: string;
}

export type ExamStatus = 'draft' | 'lab_in_progress' | 'active' | 'paused' | 'closed';
export type VideoGateMode = 'strict' | 'warn_only' | 'off';
export type PartOrder = 'quiz_then_viva' | 'viva_then_quiz' | 'both_tabs';
export type MarksState = 'draft' | 'frozen' | 'released';
export type AttemptStatus = 'in_progress' | 'submitted' | 'flagged' | 'invalidated' | 'auto_submitted';
export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface ExamSession {
  id: string;
  name: string;
  date: string;
  status: ExamStatus;
  video_gate_mode: VideoGateMode;
  part_order: PartOrder;
  quiz_duration_seconds: number;
  number_of_mcqs: number;
  number_of_viva_questions: number;
  proctoring_settings: {
    webcam: boolean;
    fullscreen: boolean;
    anti_cheat: boolean;
  };
  violation_threshold: number;
  auto_open_when_lab_done: boolean;
  close_grace_seconds: number;
  created_by?: string;
  target_batch_ids: string[];
  created_at?: string;
}

export interface SessionStudent {
  id: string;
  session_id: string;
  student_id: string;
  student?: Profile;
  section_id_snapshot?: string;
  batch_id_snapshot?: string;
  lab_status: 'pending' | 'completed';
  lab_completed_at?: string | null;
  lab_completed_by?: string | null;
  lab_marks?: number | null;
  lab_remarks?: string | null;
  quiz_open: boolean;
  viva_open: boolean;
  opened_by?: string | null;
  opened_at?: string | null;
  extra_time_seconds: number;
  gate_override_reason?: string | null;
  retake_allowed: boolean;
  marks_state: MarksState;
  updated_at?: string;
}

export interface MCQOption {
  id: string;
  question_id?: string;
  option_text: string;
  option_key?: string;
  is_correct?: boolean; // PROTECTED: only returned after submission or to faculty/admin
}

export interface MCQQuestion {
  id: string;
  unit_id?: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question_text: string;
  code_snippet?: string | null;
  explanation?: string | null;
  tags: string[];
  is_practice: boolean;
  active: boolean;
  options: MCQOption[];
}

export interface AttemptQuestion {
  id: string;
  display_order: number;
  question_id: string;
  question: MCQQuestion;
  shuffled_options: MCQOption[];
}

export interface AttemptAnswer {
  question_id: string;
  selected_option_id?: string | null;
  is_flagged: boolean;
  is_correct?: boolean;
  marks_awarded?: number;
  saved_at?: string;
}

export interface VivaQuestion {
  id: string;
  unit_id?: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question_text: string;
  reference_answer: string; // PROTECTED
  key_concepts: string[]; // PROTECTED
  rubric?: string | null; // PROTECTED
  max_marks: number;
  active: boolean;
}

export interface VivaAnswer {
  id?: string;
  attempt_id: string;
  question_id: string;
  question?: VivaQuestion;
  student_answer: string;
  ai_marks?: number;
  final_marks?: number;
  ai_feedback?: string;
  concepts_covered?: string[];
  concepts_missing?: string[];
  confidence?: number;
  needs_manual_review?: boolean;
  model_name?: string;
  raw_model_response?: any;
  override_reason?: string;
  overridden_by?: string;
  overridden_at?: string;
  similarity_flag?: boolean;
  saved_at?: string;
}

export interface Attempt {
  id: string;
  session_id: string;
  student_id: string;
  student?: Profile;
  part_type: 'quiz' | 'viva' | 'practice';
  token: string;
  device_session_id: string;
  status: AttemptStatus;
  started_at: string;
  duration_seconds: number;
  extra_time_seconds: number;
  submitted_at?: string | null;
  submission_receipt?: string | null;
  score?: number | null;
  max_score?: number | null;
  integrity_score: number;
  risk_level: RiskLevel;
  violations_count: number;
  reviewed_by?: string | null;
  review_notes?: string | null;
  attempt_answers?: AttemptAnswer[];
  viva_answers?: VivaAnswer[];
}

export interface ProctorEvent {
  id: string;
  attempt_id: string;
  student_id: string;
  event_type: string;
  severity: number;
  metadata?: Record<string, any>;
  snapshot_url?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_type: 'all' | 'section' | 'batch' | 'session' | 'student';
  target_id?: string;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  metadata?: any;
  created_at: string;
}
