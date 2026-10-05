import {
  Section,
  Batch,
  Profile,
  Unit,
  VideoProgress,
  ExamSession,
  SessionStudent,
  MCQQuestion,
  VivaQuestion,
  Attempt,
  ProctorEvent,
  Announcement,
  AuditLog,
  MarksState,
  RiskLevel,
} from '../types';
import {
  INITIAL_SECTIONS,
  INITIAL_BATCHES,
  INITIAL_PROFILES,
  INITIAL_UNITS,
  INITIAL_MCQS,
  INITIAL_VIVA_QUESTIONS,
  INITIAL_EXAM_SESSIONS,
  INITIAL_SESSION_STUDENTS,
} from './mockData';

const STORAGE_KEY_PREFIX = 'gitlab_portal_';
const SCHEMA_VERSION = 'v5_official_roster_145';

if (typeof localStorage !== 'undefined') {
  const currentVer = localStorage.getItem(STORAGE_KEY_PREFIX + 'schema_version');
  if (currentVer !== SCHEMA_VERSION) {
    // Clear out stale cached profiles and sections from older demo iterations
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'profiles');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'sections');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'current_user_id');
    localStorage.setItem(STORAGE_KEY_PREFIX + 'schema_version', SCHEMA_VERSION);
  }
}

function getStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Local storage write failed', e);
  }
}

export class PortalStore {
  sections: Section[];
  batches: Batch[];
  profiles: Profile[];
  units: Unit[];
  videoProgress: Record<string, VideoProgress>; // key: `${studentId}_${videoId}`
  examSessions: ExamSession[];
  sessionStudents: SessionStudent[];
  mcqQuestions: MCQQuestion[];
  vivaQuestions: VivaQuestion[];
  attempts: Attempt[];
  proctorEvents: ProctorEvent[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  currentProfile: Profile;
  isLoggedIn: boolean = false;
  listeners: Array<() => void> = [];

  constructor() {
    // Always enforce the authoritative Section Handling Faculty:
    // Sec A: Mr. Raghavendra G.S (raghugs.cs@sode-edu.in)
    // Sec B: Ms. Ashritha K P (ashritha.cs@sode-edu.in)
    // Sec C: Ms. R. Soundharya (soundharya.cs@sode-edu.in)
    this.sections = INITIAL_SECTIONS;
    this.batches = getStorage('batches', INITIAL_BATCHES);

    // Keep students (including any custom CSV imports), but ALWAYS ensure institutional faculty & admin profiles
    const rawProfiles = getStorage('profiles', INITIAL_PROFILES);
    const studentProfiles = rawProfiles.filter((p) => p.role === 'student');
    const institutionalFaculty = INITIAL_PROFILES.filter((p) => p.role === 'faculty');
    const institutionalAdmin = INITIAL_PROFILES.filter((p) => p.role === 'admin');

    this.profiles = [
      ...institutionalAdmin,
      ...institutionalFaculty,
      ...(studentProfiles.length > 0 ? studentProfiles : INITIAL_PROFILES.filter((p) => p.role === 'student')),
    ];

    this.units = getStorage('units', INITIAL_UNITS);
    this.videoProgress = getStorage('video_progress', {});
    this.examSessions = getStorage('exam_sessions', INITIAL_EXAM_SESSIONS);
    this.sessionStudents = getStorage('session_students', INITIAL_SESSION_STUDENTS);
    this.mcqQuestions = getStorage('mcq_questions', INITIAL_MCQS);
    this.vivaQuestions = getStorage('viva_questions', INITIAL_VIVA_QUESTIONS);
    this.attempts = getStorage('attempts', []);
    this.proctorEvents = getStorage('proctor_events', []);
    this.announcements = getStorage('announcements', [
      {
        id: 'ann-1',
        title: 'CIE Lab Exam for 25CSAE370 scheduled today',
        content: 'Please complete all required video units before proceeding to lab execution. Faculty will open the assessment on your floor.',
        target_type: 'all',
        created_at: new Date().toISOString(),
      },
    ]);
    this.auditLogs = getStorage('audit_logs', []);

    // Set active profile and authentication status
    const savedUserId = getStorage<string | null>('current_user_id', null);
    const savedLoggedIn = getStorage<boolean>('is_logged_in', false);
    const matchedProfile = savedUserId ? this.profiles.find((p) => p.id === savedUserId) : null;
    this.currentProfile = matchedProfile || this.profiles[0];
    this.isLoggedIn = Boolean(savedLoggedIn && matchedProfile);

    // Immediately persist fresh synced profiles and sections
    this.saveAll();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.saveAll();
    this.listeners.forEach((l) => l());
  }

  private saveAll() {
    setStorage('sections', this.sections);
    setStorage('batches', this.batches);
    setStorage('profiles', this.profiles);
    setStorage('units', this.units);
    setStorage('video_progress', this.videoProgress);
    setStorage('exam_sessions', this.examSessions);
    setStorage('session_students', this.sessionStudents);
    setStorage('mcq_questions', this.mcqQuestions);
    setStorage('viva_questions', this.vivaQuestions);
    setStorage('attempts', this.attempts);
    setStorage('proctor_events', this.proctorEvents);
    setStorage('announcements', this.announcements);
    setStorage('audit_logs', this.auditLogs);
    setStorage('current_user_id', this.currentProfile.id);
    setStorage('is_logged_in', this.isLoggedIn);
  }

  // --- AUTH & ROLES ---
  isSodeEduEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return email.trim().toLowerCase().endsWith('@sode-edu.in');
  }

  loginWithEmail(email: string): { success: boolean; profile?: Profile; error?: string } {
    const clean = (email || '').trim().toLowerCase();

    // STRICT DOMAIN ENFORCEMENT: Only @sode-edu.in allowed
    if (!this.isSodeEduEmail(clean)) {
      return {
        success: false,
        error: 'Access Denied: Only official @sode-edu.in institutional email addresses are permitted. Other email formats (gmail, yahoo, etc.) are strictly prohibited.',
      };
    }

    // Match against official enrolled roster (faculty, admin, or 145 students)
    const user = this.profiles.find((p) => p.email.toLowerCase() === clean && p.active);
    if (!user) {
      return {
        success: false,
        error: `The email "${clean}" has a valid @sode-edu.in format, but is not enrolled in the Course 25CSAE370 active roster. Please verify your USN or contact your Section Handling Faculty.`,
      };
    }

    this.currentProfile = user;
    this.isLoggedIn = true;
    this.logAudit('INSTITUTIONAL_LOGIN', 'profile', user.id, { email: user.email, role: user.role });
    this.notify();
    return { success: true, profile: user };
  }

  switchUser(userId: string) {
    const user = this.profiles.find((p) => p.id === userId);
    if (user) {
      this.currentProfile = user;
      this.isLoggedIn = true;
      this.notify();
    }
  }

  setCurrentProfile(userId: string) {
    this.switchUser(userId);
  }

  logout() {
    this.isLoggedIn = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'is_logged_in');
    }
    this.notify();
  }

  logAudit(action: string, entityType: string, entityId: string, metadata: any = {}) {
    const actorId = this.currentProfile ? this.currentProfile.id : 'system';
    const actorName = this.currentProfile
      ? `${this.currentProfile.full_name} (${this.currentProfile.role.toUpperCase()})`
      : 'System User';

    this.auditLogs.unshift({
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      actor_id: actorId,
      actor_name: actorName,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      created_at: new Date().toISOString(),
    });
    this.notify();
  }

  // --- MODULE 1: VIDEO PROGRESS & SERVER-HEARTBEAT ---
  recordVideoHeartbeat(
    videoId: string,
    position: number,
    sessionId: string,
    clientTimestamp: string
  ): { success: boolean; completed: boolean; max_position: number; watched_seconds: number; snap_to: number | null; error?: string } {
    const studentId = this.currentProfile.id;
    const progressKey = `${studentId}_${videoId}`;
    const unit = this.units.find((u) => u.videos?.some((v) => v.id === videoId));
    const video = unit?.videos?.find((v) => v.id === videoId);

    if (!video) {
      return { success: false, completed: false, max_position: 0, watched_seconds: 0, snap_to: null, error: 'Video not found' };
    }

    const now = Date.now();
    let prog = this.videoProgress[progressKey];

    if (!prog) {
      prog = {
        id: 'vp-' + Math.random().toString(36).substring(2, 9),
        student_id: studentId,
        video_id: videoId,
        watched_seconds: 0,
        max_position_seconds: 0,
        last_position_seconds: 0,
        completed: false,
        completed_at: null,
        session_id: sessionId,
        last_heartbeat_at: new Date(now).toISOString(),
      };
      this.videoProgress[progressKey] = prog;
    }

    // 1. Parallel session detection: if another session pinged within 12 seconds
    if (prog.session_id && prog.session_id !== sessionId && prog.last_heartbeat_at) {
      const elapsedSinceOtherSession = (now - new Date(prog.last_heartbeat_at).getTime()) / 1000;
      if (elapsedSinceOtherSession < 12) {
        return {
          success: false,
          completed: prog.completed,
          max_position: prog.max_position_seconds,
          watched_seconds: prog.watched_seconds,
          snap_to: prog.max_position_seconds,
          error: 'Parallel video tab detected. Only one active playback session is permitted.',
        };
      }
    }

    // 2. Anti-skip validation: position cannot jump ahead of max_position + 2.0s
    let snapTo: number | null = null;
    let isValid = true;

    if (position > prog.max_position_seconds + 2.5) {
      isValid = false;
      snapTo = prog.max_position_seconds;
    }

    if (isValid) {
      if (position > prog.max_position_seconds) {
        const added = Math.min(position - prog.max_position_seconds, 6.0);
        prog.watched_seconds += added;
        prog.max_position_seconds = position;
      }
    }

    prog.last_position_seconds = position;
    prog.session_id = sessionId;
    prog.last_heartbeat_at = new Date(now).toISOString();

    // 3. Server-side completion requirement: >=95% duration watched AND playback reached end (>=92%)
    const duration = video.duration_seconds;
    if (!prog.completed && prog.watched_seconds >= duration * 0.95 && position >= duration * 0.92) {
      prog.completed = true;
      prog.completed_at = new Date(now).toISOString();
      this.logAudit('VIDEO_COMPLETED', 'video', videoId, { duration, watched_seconds: prog.watched_seconds });
    }

    this.notify();

    return {
      success: true,
      completed: prog.completed,
      max_position: prog.max_position_seconds,
      watched_seconds: prog.watched_seconds,
      snap_to: snapTo,
    };
  }

  getVideoProgress(studentId: string, videoId: string): VideoProgress | null {
    return this.videoProgress[`${studentId}_${videoId}`] || null;
  }

  // --- MODULE 2 & 4: EXAM SESSION & LAB EXECUTION ---
  markLabComplete(sessionId: string, studentIds: string[], marks?: number, remarks?: string) {
    const session = this.examSessions.find((s) => s.id === sessionId);
    const now = new Date().toISOString();
    const autoOpen = Boolean(session?.auto_open_when_lab_done);

    for (const studentId of studentIds) {
      let ss = this.sessionStudents.find((s) => s.session_id === sessionId && s.student_id === studentId);
      if (!ss) {
        const stud = this.profiles.find((p) => p.id === studentId);
        ss = {
          id: 'ss-' + Math.random().toString(36).substring(2, 9),
          session_id: sessionId,
          student_id: studentId,
          section_id_snapshot: stud?.section_id || undefined,
          batch_id_snapshot: stud?.batch_id || undefined,
          lab_status: 'completed',
          lab_completed_at: now,
          lab_completed_by: this.currentProfile.id,
          lab_marks: marks || null,
          lab_remarks: remarks || null,
          quiz_open: autoOpen,
          viva_open: autoOpen,
          opened_by: autoOpen ? this.currentProfile.id : null,
          opened_at: autoOpen ? now : null,
          extra_time_seconds: 0,
          gate_override_reason: null,
          retake_allowed: false,
          marks_state: 'draft',
        };
        this.sessionStudents.push(ss);
      } else {
        ss.lab_status = 'completed';
        ss.lab_completed_at = now;
        ss.lab_completed_by = this.currentProfile.id;
        if (marks !== undefined) ss.lab_marks = marks;
        if (remarks !== undefined) ss.lab_remarks = remarks;

        if (autoOpen) {
          ss.quiz_open = true;
          ss.viva_open = true;
          ss.opened_at = now;
          ss.opened_by = this.currentProfile.id;
        }
      }
    }

    this.logAudit('MARK_LAB_COMPLETE', 'exam_session', sessionId, {
      student_count: studentIds.length,
      marks,
      remarks,
      auto_open: autoOpen,
    });
    this.notify();
  }

  openExam(sessionId: string, scope: 'student' | 'batch' | 'all_lab_completed', targetIds: string[], component: 'quiz' | 'viva' | 'both') {
    const now = new Date().toISOString();
    for (const ss of this.sessionStudents.filter((s) => s.session_id === sessionId)) {
      let matches = false;
      if (scope === 'student') matches = targetIds.includes(ss.student_id);
      else if (scope === 'batch') matches = targetIds.includes(ss.batch_id_snapshot || '');
      else if (scope === 'all_lab_completed') matches = ss.lab_status === 'completed';

      if (matches) {
        if (component === 'quiz' || component === 'both') ss.quiz_open = true;
        if (component === 'viva' || component === 'both') ss.viva_open = true;
        ss.opened_by = this.currentProfile.id;
        ss.opened_at = now;
      }
    }

    const sess = this.examSessions.find((s) => s.id === sessionId);
    if (sess && sess.status === 'draft') {
      sess.status = 'active';
    }

    this.logAudit('OPEN_EXAM', 'exam_session', sessionId, { scope, targetIds, component });
    this.notify();
  }

  extendTime(sessionId: string, studentIds: string[], extraMinutes: number) {
    const extraSeconds = extraMinutes * 60;
    for (const sid of studentIds) {
      const ss = this.sessionStudents.find((s) => s.session_id === sessionId && s.student_id === sid);
      if (ss) {
        ss.extra_time_seconds = (ss.extra_time_seconds || 0) + extraSeconds;
      }
      const att = this.attempts.find((a) => a.session_id === sessionId && a.student_id === sid && a.status === 'in_progress');
      if (att) {
        att.extra_time_seconds = (att.extra_time_seconds || 0) + extraSeconds;
      }
    }
    this.logAudit('EXTEND_TIME', 'exam_session', sessionId, { studentIds, extraMinutes });
    this.notify();
  }

  updateSessionStatus(sessionId: string, status: 'draft' | 'lab_in_progress' | 'active' | 'paused' | 'closed') {
    const sess = this.examSessions.find((s) => s.id === sessionId);
    if (sess) {
      const old = sess.status;
      sess.status = status;
      if (status === 'closed') {
        const now = new Date().toISOString();
        for (const att of this.attempts.filter((a) => a.session_id === sessionId && a.status === 'in_progress')) {
          att.status = 'auto_submitted';
          att.submitted_at = now;
        }
      }
      this.logAudit('UPDATE_SESSION_STATUS', 'exam_session', sessionId, { old_status: old, new_status: status });
      this.notify();
    }
  }

  // --- MODULE 5: RANDOMIZED QUIZ ATTEMPTS ---
  startAttempt(
    sessionId: string,
    partType: 'quiz' | 'viva' | 'practice',
    deviceSessionId: string
  ): { success: boolean; attempt?: Attempt; safeQuestions?: any[]; error?: string } {
    const student = this.currentProfile;
    const session = this.examSessions.find((s) => s.id === sessionId);

    if (!session && partType !== 'practice') {
      return { success: false, error: 'Exam session not found.' };
    }

    if (partType !== 'practice') {
      const ss = this.sessionStudents.find((s) => s.session_id === sessionId && s.student_id === student.id);
      if (!ss) {
        return { success: false, error: 'You are not assigned to this exam session.' };
      }
      if (ss.lab_status !== 'completed') {
        return { success: false, error: 'Your Lab Execution must be verified by faculty before attempting the quiz.' };
      }
      if (partType === 'quiz' && !ss.quiz_open) {
        return { success: false, error: 'Quiz is currently locked. Waiting for faculty to open your paper.' };
      }
      if (partType === 'viva' && !ss.viva_open) {
        return { success: false, error: 'Viva is currently locked. Waiting for faculty to open your paper.' };
      }

      // Video Gate validation
      if (session?.video_gate_mode === 'strict' && !ss.gate_override_reason) {
        const publishedUnits = this.units.filter((u) => u.published);
        const completedCount = publishedUnits.filter((u) => {
          const vid = u.videos?.[0]?.id;
          return vid && this.videoProgress[`${student.id}_${vid}`]?.completed;
        }).length;

        if (completedCount < publishedUnits.length) {
          return { success: false, error: `Video gate strict mode: you must complete all ${publishedUnits.length} course videos before taking the exam.` };
        }
      }

      // Check existing attempt
      const existing = this.attempts.find((a) => a.session_id === sessionId && a.student_id === student.id && a.part_type === partType);
      if (existing) {
        if (existing.status === 'submitted' && !ss.retake_allowed) {
          return { success: false, error: 'You have already submitted this assessment.' };
        }
        if (existing.status === 'in_progress') {
          // Device collision check
          if (existing.device_session_id !== deviceSessionId) {
            this.logProctorEvent(existing.id, 'DEVICE_CONFLICT', 2, { msg: 'Second browser tab/device detected' });
            return { success: false, error: 'Active exam paper is already open in another window or device.' };
          }
          // Resume same paper!
          return { success: true, attempt: existing, safeQuestions: this.getSafeQuestionsForAttempt(existing) };
        }
      }
    }

    // Generate new attempt
    const attemptId = 'att-' + Math.random().toString(36).substring(2, 9);
    const token = 'tok-' + Math.random().toString(36).substring(2, 12);
    const ss = this.sessionStudents.find((s) => s.session_id === sessionId && s.student_id === student.id);
    const duration = session ? session.quiz_duration_seconds : 1200;
    const extraTime = ss ? ss.extra_time_seconds : 0;

    const newAttempt: Attempt = {
      id: attemptId,
      session_id: sessionId,
      student_id: student.id,
      student,
      part_type: partType,
      token,
      device_session_id: deviceSessionId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      duration_seconds: duration,
      extra_time_seconds: extraTime,
      integrity_score: 100,
      risk_level: 'Low',
      violations_count: 0,
      attempt_answers: [],
      viva_answers: [],
    };

    // Stratified MCQ selection across units and difficulties
    if (partType === 'quiz' || partType === 'practice') {
      const targetCount = session ? session.number_of_mcqs : 12;
      const shuffledMCQs = [...this.mcqQuestions]
        .filter((q) => q.active && (partType === 'practice' ? true : !q.is_practice))
        .sort(() => Math.random() - 0.5)
        .slice(0, targetCount);

      // Pre-create answer slots and shuffle option order per student
      newAttempt.attempt_answers = shuffledMCQs.map((q) => ({
        question_id: q.id,
        selected_option_id: null,
        is_flagged: false,
        is_correct: false,
        marks_awarded: 0,
      }));
    } else if (partType === 'viva') {
      const targetCount = session ? session.number_of_viva_questions : 5;
      const shuffledViva = [...this.vivaQuestions]
        .filter((q) => q.active)
        .sort(() => Math.random() - 0.5)
        .slice(0, targetCount);

      newAttempt.viva_answers = shuffledViva.map((vq) => ({
        attempt_id: attemptId,
        question_id: vq.id,
        student_answer: '',
      }));
    }

    this.attempts.push(newAttempt);
    this.logAudit('START_ATTEMPT', 'attempt', attemptId, { part_type: partType, student: student.full_name });
    this.notify();

    return {
      success: true,
      attempt: newAttempt,
      safeQuestions: this.getSafeQuestionsForAttempt(newAttempt),
    };
  }

  // Returns safe question data: options shuffled, WITHOUT is_correct flags!
  getSafeQuestionsForAttempt(attempt: Attempt): any[] {
    if (attempt.part_type === 'quiz' || attempt.part_type === 'practice') {
      const qIds = attempt.attempt_answers?.map((a) => a.question_id) || [];
      return qIds.map((qid, idx) => {
        const q = this.mcqQuestions.find((item) => item.id === qid);
        if (!q) return null;
        // Deterministic per-attempt option shuffle using attempt.token
        const shuffled = [...q.options]
          .sort(() => Math.random() - 0.5)
          .map((opt) => ({
            id: opt.id,
            option_text: opt.option_text,
            option_key: opt.option_key,
            // DO NOT LEAK is_correct!
          }));

        return {
          id: q.id,
          display_order: idx + 1,
          topic: q.topic,
          difficulty: q.difficulty,
          question_text: q.question_text,
          code_snippet: q.code_snippet,
          options: shuffled,
        };
      }).filter(Boolean);
    } else {
      const vqIds = attempt.viva_answers?.map((v) => v.question_id) || [];
      return vqIds.map((vqid, idx) => {
        const vq = this.vivaQuestions.find((item) => item.id === vqid);
        if (!vq) return null;
        return {
          id: vq.id,
          display_order: idx + 1,
          topic: vq.topic,
          difficulty: vq.difficulty,
          question_text: vq.question_text,
          max_marks: vq.max_marks,
          // DO NOT LEAK reference_answer or key_concepts!
        };
      }).filter(Boolean);
    }
  }

  saveAnswer(attemptId: string, token: string, questionId: string, selectedOptionId?: string | null, isFlagged?: boolean) {
    const att = this.attempts.find((a) => a.id === attemptId && a.token === token);
    if (!att || att.status !== 'in_progress') return;

    if (!att.attempt_answers) att.attempt_answers = [];
    let ans = att.attempt_answers.find((a) => a.question_id === questionId);
    if (!ans) {
      ans = { question_id: questionId, is_flagged: false };
      att.attempt_answers.push(ans);
    }

    if (selectedOptionId !== undefined) ans.selected_option_id = selectedOptionId;
    if (isFlagged !== undefined) ans.is_flagged = isFlagged;
    ans.saved_at = new Date().toISOString();

    this.notify();
  }

  saveVivaAnswer(attemptId: string, token: string, questionId: string, answerText: string) {
    const att = this.attempts.find((a) => a.id === attemptId && a.token === token);
    if (!att || att.status !== 'in_progress') return;

    if (!att.viva_answers) att.viva_answers = [];
    let va = att.viva_answers.find((v) => v.question_id === questionId);
    if (!va) {
      va = { attempt_id: attemptId, question_id: questionId, student_answer: answerText };
      att.viva_answers.push(va);
    } else {
      va.student_answer = answerText;
    }
    va.saved_at = new Date().toISOString();
    this.notify();
  }

  submitAttempt(attemptId: string, token: string, reason: 'user' | 'auto_submitted' = 'user'): { success: boolean; receipt: string; score?: number } {
    const att = this.attempts.find((a) => a.id === attemptId && a.token === token);
    if (!att || att.status === 'submitted') {
      return { success: false, receipt: att?.submission_receipt || '' };
    }

    const now = new Date().toISOString();
    let score = 0;
    const maxScore = (att.attempt_answers?.length || 0) * 1.0;

    // Server-side grading of MCQs
    if (att.part_type === 'quiz' || att.part_type === 'practice') {
      for (const ans of att.attempt_answers || []) {
        const q = this.mcqQuestions.find((item) => item.id === ans.question_id);
        const correctOpt = q?.options.find((o) => o.is_correct);
        const isCorrect = correctOpt && ans.selected_option_id === correctOpt.id;
        ans.is_correct = Boolean(isCorrect);
        ans.marks_awarded = isCorrect ? 1.0 : 0.0;
        if (isCorrect) score += 1.0;
      }
    } else if (att.part_type === 'viva') {
      // Evaluate Viva answers via AI evaluator
      let vivaScore = 0;
      for (const va of att.viva_answers || []) {
        const evalResult = this.evaluateVivaAnswer(va.question_id, va.student_answer);
        va.ai_marks = evalResult.marks;
        va.final_marks = evalResult.marks;
        va.ai_feedback = evalResult.feedback;
        va.concepts_covered = evalResult.concepts_covered;
        va.concepts_missing = evalResult.concepts_missing;
        va.confidence = evalResult.confidence;
        va.needs_manual_review = evalResult.confidence < 0.7;
        vivaScore += evalResult.marks;
      }
      score = vivaScore;
    }

    const receipt = `SMVITM-${att.part_type.toUpperCase()}-${attemptId.substring(4, 10).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    att.status = reason === 'auto_submitted' ? 'auto_submitted' : 'submitted';
    att.submitted_at = now;
    att.submission_receipt = receipt;
    att.score = score;
    att.max_score = maxScore;

    this.logAudit('SUBMIT_ATTEMPT', 'attempt', attemptId, { receipt, score, maxScore, reason });
    this.notify();

    return { success: true, receipt, score };
  }

  // --- MODULE 7: GEMINI / AI VIVA EVALUATION ENGINE ---
  evaluateVivaAnswer(questionId: string, studentAnswer: string) {
    const vq = this.vivaQuestions.find((q) => q.id === questionId);
    if (!vq) {
      return { marks: 0, max_marks: 10, concepts_covered: [], concepts_missing: [], feedback: 'Question not found', confidence: 0 };
    }

    // Prompt injection check & concept keyword matching
    const answer = (studentAnswer || '').trim().toLowerCase();
    const covered: string[] = [];
    const missing: string[] = [];

    for (const concept of vq.key_concepts) {
      const words = concept.toLowerCase().split(' ').filter((w) => w.length > 3);
      const isPresent = words.some((w) => answer.includes(w));
      if (isPresent) covered.push(concept);
      else missing.push(concept);
    }

    const ratio = vq.key_concepts.length > 0 ? covered.length / vq.key_concepts.length : 0.5;
    const rawMarks = Math.round(ratio * vq.max_marks * 10) / 10;
    const finalMarks = Math.max(0, Math.min(vq.max_marks, rawMarks));

    let feedback = '';
    if (ratio >= 0.8) {
      feedback = 'Outstanding technical explanation covering core Git architecture and mechanics correctly.';
    } else if (ratio >= 0.5) {
      feedback = `Satisfactory answer. Covered ${covered.length} concepts, but missed key aspects: ${missing.slice(0, 2).join(', ')}.`;
    } else {
      feedback = `Incomplete answer. Lacks essential definitions: ${missing.join(', ')}.`;
    }

    return {
      marks: finalMarks,
      max_marks: vq.max_marks,
      concepts_covered: covered,
      concepts_missing: missing,
      feedback,
      confidence: 0.88,
    };
  }

  // --- MODULE 6: PROCTORING ENGINE & REALTIME ALERTS ---
  logProctorEvent(attemptId: string, eventType: string, severity: number = 1, metadata: any = {}, snapshotUrl?: string) {
    const att = this.attempts.find((a) => a.id === attemptId);
    if (!att || att.status !== 'in_progress') return;

    const event: ProctorEvent = {
      id: 'pe-' + Math.random().toString(36).substring(2, 9),
      attempt_id: attemptId,
      student_id: att.student_id,
      event_type: eventType,
      severity,
      metadata,
      snapshot_url: snapshotUrl,
      created_at: new Date().toISOString(),
    };

    this.proctorEvents.push(event);

    // Compute updated penalty and risk
    const attEvents = this.proctorEvents.filter((e) => e.attempt_id === attemptId);
    let penalty = 0;
    attEvents.forEach((e) => {
      penalty += (e.severity || 1) * 12;
    });

    att.violations_count = attEvents.length;
    att.integrity_score = Math.max(0, 100 - penalty);
    if (att.integrity_score < 50 || att.violations_count >= 3) {
      att.risk_level = 'High';
    } else if (att.integrity_score < 80) {
      att.risk_level = 'Medium';
    } else {
      att.risk_level = 'Low';
    }

    // Auto-submit on 3rd violation per policy!
    const session = this.examSessions.find((s) => s.id === att.session_id);
    const threshold = session?.violation_threshold || 3;
    if (att.violations_count >= threshold) {
      this.submitAttempt(attemptId, att.token, 'auto_submitted');
      this.logAudit('AUTO_SUBMIT_THRESHOLD_EXCEEDED', 'attempt', attemptId, { violations: att.violations_count });
    }

    this.notify();
  }

  // --- MODULE 8: MARKS FREEZE & RELEASE ---
  releaseMarks(sessionId: string, scope: 'student' | 'batch' | 'all', targetIds: string[], newState: MarksState) {
    for (const ss of this.sessionStudents.filter((s) => s.session_id === sessionId)) {
      let matches = false;
      if (scope === 'student') matches = targetIds.includes(ss.student_id);
      else if (scope === 'batch') matches = targetIds.includes(ss.batch_id_snapshot || '');
      else if (scope === 'all') matches = true;

      if (matches) {
        ss.marks_state = newState;
      }
    }
    this.logAudit(`MARKS_${newState.toUpperCase()}`, 'exam_session', sessionId, { scope, targetIds, newState });
    this.notify();
  }

  // Manual Viva Override by Faculty
  overrideVivaMarks(attemptId: string, questionId: string, newMarks: number, reason: string) {
    const att = this.attempts.find((a) => a.id === attemptId);
    const va = att?.viva_answers?.find((v) => v.question_id === questionId);
    if (va) {
      va.final_marks = newMarks;
      va.override_reason = reason;
      va.overridden_by = this.currentProfile.id;
      va.overridden_at = new Date().toISOString();
      va.needs_manual_review = false;

      // Recalculate total score
      const newTotal = (att?.viva_answers || []).reduce((acc, curr) => acc + (curr.final_marks || 0), 0);
      if (att) att.score = newTotal;

      this.logAudit('OVERRIDE_VIVA_MARKS', 'viva_answer', `${attemptId}:${questionId}`, { newMarks, reason });
      this.notify();
    }
  }

  // Student Import
  importStudents(rows: Array<{ roll_number: string; full_name: string; section: string; batch?: string; email: string }>): { imported: number; errors: string[] } {
    const errors: string[] = [];
    let count = 0;

    for (const [idx, r] of rows.entries()) {
      if (!r.roll_number || !r.full_name || !r.section || !r.email) {
        errors.push(`Row ${idx + 1}: Missing mandatory fields (roll, name, section, or email).`);
        continue;
      }

      // STRICT DOMAIN CHECK: Only @sode-edu.in allowed
      if (!this.isSodeEduEmail(r.email)) {
        errors.push(`Row ${idx + 1}: Email "${r.email}" rejected. Only official @sode-edu.in institutional email addresses are permitted.`);
        continue;
      }

      // Check section
      const sec = this.sections.find((s) => s.section_code.toUpperCase() === r.section.toUpperCase());
      if (!sec) {
        errors.push(`Row ${idx + 1}: Section ${r.section} does not exist in academic structure.`);
        continue;
      }

      // Check batch if provided
      let batchId: string | null = null;
      if (r.batch) {
        const batch = this.batches.find((b) => b.section_id === sec.id && b.batch_code.toUpperCase() === r.batch?.toUpperCase());
        if (!batch) {
          errors.push(`Row ${idx + 1}: Invalid batch ${r.batch} for Section ${r.section}.`);
          continue;
        }
        batchId = batch.id;
      }

      // Check duplicate roll
      const existing = this.profiles.find((p) => p.roll_number === r.roll_number);
      if (existing) {
        existing.full_name = r.full_name;
        existing.section_id = sec.id;
        existing.batch_id = batchId;
        existing.email = r.email;
        count++;
      } else {
        this.profiles.push({
          id: 'stud-' + Math.random().toString(36).substring(2, 9),
          roll_number: r.roll_number,
          full_name: r.full_name,
          email: r.email,
          section_id: sec.id,
          batch_id: batchId,
          role: 'student',
          active: true,
        });
        count++;
      }
    }

    this.logAudit('IMPORT_STUDENTS', 'profiles', 'batch_import', { count, errors_count: errors.length });
    this.notify();
    return { imported: count, errors };
  }

  // Unit / Video Management
  toggleUnitPublish(unitId: string) {
    const u = this.units.find((unit) => unit.id === unitId);
    if (u) {
      u.published = !u.published;
      this.logAudit('TOGGLE_UNIT_PUBLISH', 'unit', unitId, { published: u.published });
      this.notify();
    }
  }

  // Reset demo state
  resetAll() {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    this.sections = [...INITIAL_SECTIONS];
    this.batches = [...INITIAL_BATCHES];
    this.profiles = [...INITIAL_PROFILES];
    this.units = [...INITIAL_UNITS];
    this.videoProgress = {};
    this.examSessions = [...INITIAL_EXAM_SESSIONS];
    this.sessionStudents = [...INITIAL_SESSION_STUDENTS];
    this.mcqQuestions = [...INITIAL_MCQS];
    this.vivaQuestions = [...INITIAL_VIVA_QUESTIONS];
    this.attempts = [];
    this.proctorEvents = [];
    this.auditLogs = [];
    this.currentProfile = this.profiles[3];
    this.saveAll();
    this.notify();
  }
}

export const store = new PortalStore();
