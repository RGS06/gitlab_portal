import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../services/store';

describe('GitLab Learning & Assessment Portal - Test Suite', () => {
  beforeEach(() => {
    store.resetAll();
  });

  describe('Phase 1: Academic Structure & Roles', () => {
    it('initializes Sections A, B, C and Operational Batches A1, A2, B1, B2, C1, C2', () => {
      expect(store.sections.map((s) => s.section_code)).toEqual(['A', 'B', 'C']);
      expect(store.batches.map((b) => b.batch_code)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
    });

    it('enforces that students have role "student" and faculty have role "faculty"', () => {
      const student = store.profiles.find((p) => p.roll_number === '4MW25CS001');
      const facultyA = store.profiles.find((p) => p.email === 'raghugs.cs@sode-edu.in');
      const facultyB = store.profiles.find((p) => p.email === 'ashritha.cs@sode-edu.in');
      const facultyC = store.profiles.find((p) => p.email === 'soundharya.cs@sode-edu.in');
      
      expect(student?.role).toBe('student');
      expect(facultyA?.role).toBe('faculty');
      expect(facultyA?.full_name).toContain('Mr. Raghavendra G.S');
      expect(facultyB?.role).toBe('faculty');
      expect(facultyB?.full_name).toContain('Ms. Ashritha K P');
      expect(facultyC?.role).toBe('faculty');
      expect(facultyC?.full_name).toContain('Ms. R. Soundharya');
    });

    it('correctly maps handling faculty to Sections A, B, and C', () => {
      const secA = store.sections.find((s) => s.section_code === 'A');
      const secB = store.sections.find((s) => s.section_code === 'B');
      const secC = store.sections.find((s) => s.section_code === 'C');

      expect(secA?.handling_faculty_name).toBe('Mr. Raghavendra G.S');
      expect(secA?.handling_faculty_email).toBe('raghugs.cs@sode-edu.in');

      expect(secB?.handling_faculty_name).toBe('Ms. Ashritha K P');
      expect(secB?.handling_faculty_email).toBe('ashritha.cs@sode-edu.in');

      expect(secC?.handling_faculty_name).toBe('Ms. R. Soundharya');
      expect(secC?.handling_faculty_email).toBe('soundharya.cs@sode-edu.in');
    });

    it('allows student to exist in "Batch Unassigned" state without crashing', () => {
      const unassigned = store.profiles.find((p) => p.roll_number === '4MW25CS180');
      expect(unassigned?.batch_id).toBeNull();
    });

    it('strictly accepts ONLY @sode-edu.in emails and rejects all other formats', () => {
      // Domain validation helper
      expect(store.isSodeEduEmail('aditya.25cs001@sode-edu.in')).toBe(true);
      expect(store.isSodeEduEmail('raghugs.cs@sode-edu.in')).toBe(true);
      expect(store.isSodeEduEmail('student@gmail.com')).toBe(false);
      expect(store.isSodeEduEmail('faculty@yahoo.com')).toBe(false);
      expect(store.isSodeEduEmail('user@sode-edu.org')).toBe(false);
      expect(store.isSodeEduEmail('')).toBe(false);

      // Login attempt with non-sode email
      const badLogin = store.loginWithEmail('intruder@gmail.com');
      expect(badLogin.success).toBe(false);
      expect(badLogin.error).toContain('Only official @sode-edu.in');

      // Login attempt with valid sode email
      const goodLogin = store.loginWithEmail('raghugs.cs@sode-edu.in');
      expect(goodLogin.success).toBe(true);
      expect(store.currentProfile.full_name).toContain('Mr. Raghavendra G.S');

      // Import rejection for non-sode emails
      const importResult = store.importStudents([
        { roll_number: '4MW25CS999', full_name: 'Test Bad Domain', section: 'A', email: 'test@gmail.com' }
      ]);
      expect(importResult.imported).toBe(0);
      expect(importResult.errors[0]).toContain('Only official @sode-edu.in');
    });
  });

  describe('Phase 3: Video Progression & Anti-Skip Engine', () => {
    it('prevents forward seeking beyond 2.5 seconds ahead of max watched position', () => {
      const videoId = 'vid-1';
      const sessionId = 'tab-1';

      // 1. First heartbeat at position 2s
      const hb1 = store.recordVideoHeartbeat(videoId, 2, sessionId, new Date().toISOString());
      expect(hb1.success).toBe(true);
      expect(hb1.max_position).toBe(2);

      // 2. Client attempts forward skip to 200s
      const hb2 = store.recordVideoHeartbeat(videoId, 200, sessionId, new Date().toISOString());
      expect(hb2.snap_to).toBe(2); // Snapped back to 2s!
    });

    it('detects parallel playback session in another tab', () => {
      const videoId = 'vid-1';
      store.recordVideoHeartbeat(videoId, 5, 'tab-alpha', new Date().toISOString());

      // Simultaneous heartbeat from second tab
      const hbParallel = store.recordVideoHeartbeat(videoId, 6, 'tab-beta', new Date().toISOString());
      expect(hbParallel.success).toBe(false);
      expect(hbParallel.error).toContain('Parallel video tab detected');
    });

    it('does not mark video completed until 95% watched', () => {
      const videoId = 'vid-1';
      const sessionId = 'tab-1';
      // 600s video: 95% is 570s
      const hb = store.recordVideoHeartbeat(videoId, 300, sessionId, new Date().toISOString());
      expect(hb.completed).toBe(false);
    });
  });

  describe('Phase 5: Randomized Quiz & Security Safeguards', () => {
    it('NEVER leaks is_correct flag or reference answers in client exam questions', () => {
      const student = store.profiles.find((p) => p.roll_number === '4MW25CS001')!;
      store.currentProfile = student;
      const session = store.examSessions[0];

      // Mark lab completed and open exam with gate override
      store.markLabComplete(session.id, [student.id], 30, 'Perfect');
      const ss = store.sessionStudents.find((s) => s.student_id === student.id && s.session_id === session.id);
      if (ss) ss.gate_override_reason = 'Faculty test authorization';
      store.openExam(session.id, 'student', [student.id], 'both');

      const attemptResult = store.startAttempt(session.id, 'quiz', 'dev-1');
      expect(attemptResult.success).toBe(true);

      for (const q of attemptResult.safeQuestions || []) {
        for (const opt of q.options) {
          expect(opt).not.toHaveProperty('is_correct');
        }
      }
    });

    it('resumes EXACT same question paper on reconnect', () => {
      const student = store.profiles.find((p) => p.roll_number === '4MW25CS001')!;
      store.currentProfile = student;
      const session = store.examSessions[0];

      store.markLabComplete(session.id, [student.id], 30, 'Perfect');
      store.openExam(session.id, 'student', [student.id], 'both');

      const firstStart = store.startAttempt(session.id, 'quiz', 'device-same');
      const secondStart = store.startAttempt(session.id, 'quiz', 'device-same');

      expect(firstStart.attempt?.id).toBe(secondStart.attempt?.id);
      expect(firstStart.safeQuestions?.map((q) => q.id)).toEqual(secondStart.safeQuestions?.map((q) => q.id));
    });
  });

  describe('Phase 6: Proctoring Violations & Auto-Submission', () => {
    it('auto-submits exam when 3rd violation threshold is breached', () => {
      const student = store.profiles.find((p) => p.roll_number === '4MW25CS001')!;
      store.currentProfile = student;
      const session = store.examSessions[0];

      store.markLabComplete(session.id, [student.id], 30, 'Perfect');
      const ss = store.sessionStudents.find((s) => s.student_id === student.id && s.session_id === session.id);
      if (ss) ss.gate_override_reason = 'Faculty test authorization';
      store.openExam(session.id, 'student', [student.id], 'both');

      const attRes = store.startAttempt(session.id, 'quiz', 'dev-proctor');
      expect(attRes.success).toBe(true);
      const attId = attRes.attempt!.id;

      store.logProctorEvent(attId, 'FULLSCREEN_EXIT', 1);
      store.logProctorEvent(attId, 'TAB_SWITCH', 1);
      expect(store.attempts.find((a) => a.id === attId)?.status).toBe('in_progress');

      // 3rd violation triggers auto-submit!
      store.logProctorEvent(attId, 'WINDOW_BLUR', 1);
      expect(store.attempts.find((a) => a.id === attId)?.status).toBe('auto_submitted');
    });
  });

  describe('Phase 7: Viva AI Evaluation & Rubrics', () => {
    it('evaluates technical concepts and awards proportional marks', () => {
      const vq = store.vivaQuestions[0]; // Three states in Git
      const evalResult = store.evaluateVivaAnswer(
        vq.id,
        'Git manages code across the working directory, staging area index using git add, and the permanent repository commit objects.'
      );

      expect(evalResult.marks).toBeGreaterThan(6);
      expect(evalResult.concepts_covered.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Phase 8: Marks Freeze & Release Security', () => {
    it('confines marks visibility until state is transitioned to released', () => {
      const session = store.examSessions[0];
      const studentId = 'stud-01';
      const ss = store.sessionStudents.find((s) => s.student_id === studentId)!;

      expect(ss.marks_state).toBe('draft');

      store.releaseMarks(session.id, 'student', [studentId], 'frozen');
      expect(store.sessionStudents.find((s) => s.student_id === studentId)?.marks_state).toBe('frozen');

      store.releaseMarks(session.id, 'student', [studentId], 'released');
      expect(store.sessionStudents.find((s) => s.student_id === studentId)?.marks_state).toBe('released');
    });
  });

  describe('Phase 2 & 6: Student CSV Import Validation', () => {
    it('rejects invalid section/batch mismatch (e.g. Section A with Batch B1)', () => {
      const result = store.importStudents([
        {
          roll_number: '4MW25CS999',
          full_name: 'TEST STUDENT',
          section: 'A',
          batch: 'B1', // Invalid! A cannot have B1
          email: 'test@sode-edu.in',
        },
      ]);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Invalid batch B1 for Section A');
    });

    it('accepts valid Section A with Batch A1', () => {
      const result = store.importStudents([
        {
          roll_number: '4MW25CS888',
          full_name: 'VALID STUDENT',
          section: 'A',
          batch: 'A1',
          email: 'valid@sode-edu.in',
        },
      ]);
      expect(result.errors.length).toBe(0);
      expect(result.imported).toBe(1);
    });
  });
});
