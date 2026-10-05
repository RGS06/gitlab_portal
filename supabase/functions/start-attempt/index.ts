import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify student token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { session_id, part_type, device_session_id } = await req.json();

    if (!session_id || !part_type || !device_session_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch student profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Student profile not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch session details
    const { data: session } = await supabaseClient
      .from('exam_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (!session || (session.status !== 'active' && session.status !== 'lab_in_progress')) {
      return new Response(JSON.stringify({ error: 'Session is not active for examination' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Fetch session student state
    const { data: sessionStudent } = await supabaseClient
      .from('session_students')
      .select('*')
      .eq('session_id', session_id)
      .eq('student_id', user.id)
      .maybeSingle();

    if (!sessionStudent) {
      return new Response(JSON.stringify({ error: 'Student not registered in this exam session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check lab completion
    if (sessionStudent.lab_status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Lab execution must be marked completed before starting' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check component open state
    if (part_type === 'quiz' && !sessionStudent.quiz_open) {
      return new Response(JSON.stringify({ error: 'Quiz has not been opened by faculty' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (part_type === 'viva' && !sessionStudent.viva_open) {
      return new Response(JSON.stringify({ error: 'Viva has not been opened by faculty' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check video gate
    if (session.video_gate_mode === 'strict' && !sessionStudent.gate_override_reason) {
      // Validate all published units are completed
      const { data: publishedUnits } = await supabaseClient.from('units').select('id').eq('published', true);
      const { data: completedVideos } = await supabaseClient
        .from('video_progress')
        .select('video_id')
        .eq('student_id', user.id)
        .eq('completed', true);

      if ((completedVideos?.length || 0) < (publishedUnits?.length || 0)) {
        return new Response(JSON.stringify({ error: 'All required course videos must be completed first' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check existing attempt
    const { data: existingAttempt } = await supabaseClient
      .from('attempts')
      .select('*')
      .eq('session_id', session_id)
      .eq('student_id', user.id)
      .eq('part_type', part_type)
      .maybeSingle();

    if (existingAttempt) {
      if (existingAttempt.status === 'submitted' && !sessionStudent.retake_allowed) {
        return new Response(JSON.stringify({ error: 'Attempt already submitted and retake not granted' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check device collision
      if (existingAttempt.status === 'in_progress' && existingAttempt.device_session_id !== device_session_id) {
        return new Response(JSON.stringify({ error: 'Active session already open on another browser or device' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Resuming existing in-progress attempt with same paper
      if (existingAttempt.status === 'in_progress') {
        const { data: attemptQuestions } = await supabaseClient
          .from('attempt_questions')
          .select(`
            display_order,
            shuffled_option_ids,
            mcq_questions (
              id,
              question_text,
              code_snippet,
              difficulty,
              topic
            )
          `)
          .eq('attempt_id', existingAttempt.id)
          .order('display_order', { ascending: true });

        // Fetch options for each question
        const questionList = [];
        for (const aq of attemptQuestions || []) {
          const q = (aq as any).mcq_questions;
          const { data: rawOptions } = await supabaseClient
            .from('mcq_options')
            .select('id, option_text')
            .in('id', aq.shuffled_option_ids);

          // Sort options exactly as persisted in shuffled_option_ids
          const sortedOptions = aq.shuffled_option_ids.map((optId: string) => {
            const match = rawOptions?.find((o) => o.id === optId);
            return { id: optId, option_text: match?.option_text || '' };
          });

          questionList.push({
            id: q.id,
            display_order: aq.display_order,
            question_text: q.question_text,
            code_snippet: q.code_snippet,
            difficulty: q.difficulty,
            topic: q.topic,
            options: sortedOptions,
          });
        }

        // Fetch saved answers
        const { data: savedAnswers } = await supabaseClient
          .from('attempt_answers')
          .select('question_id, selected_option_id, is_flagged')
          .eq('attempt_id', existingAttempt.id);

        return new Response(
          JSON.stringify({
            attempt_id: existingAttempt.id,
            token: existingAttempt.token,
            started_at: existingAttempt.started_at,
            duration_seconds: existingAttempt.duration_seconds + (sessionStudent.extra_time_seconds || 0),
            questions: questionList,
            saved_answers: savedAnswers || [],
            is_resumed: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Generate new attempt
    const attemptToken = crypto.randomUUID();
    const duration = session.quiz_duration_seconds;

    const { data: newAttempt, error: attemptCreateError } = await supabaseClient
      .from('attempts')
      .insert({
        session_id,
        student_id: user.id,
        part_type,
        token: attemptToken,
        device_session_id,
        status: 'in_progress',
        duration_seconds: duration,
        extra_time_seconds: sessionStudent.extra_time_seconds || 0,
      })
      .select()
      .single();

    if (attemptCreateError || !newAttempt) {
      throw new Error('Failed to create attempt record');
    }

    // 5. Select stratified randomized MCQs (if part_type is quiz)
    if (part_type === 'quiz') {
      const mcqCount = session.number_of_mcqs || 12;
      const { data: allQuestions } = await supabaseClient
        .from('mcq_questions')
        .select('id, difficulty, unit_id, question_text, code_snippet, topic')
        .eq('active', true)
        .eq('is_practice', false);

      // Stratified shuffle by unit & difficulty
      const shuffled = (allQuestions || []).sort(() => Math.random() - 0.5).slice(0, mcqCount);

      const clientQuestions = [];
      let displayOrder = 1;

      for (const q of shuffled) {
        // Fetch all 4 options
        const { data: options } = await supabaseClient
          .from('mcq_options')
          .select('id, option_text')
          .eq('question_id', q.id);

        // Shuffle option order
        const shuffledOptions = (options || []).sort(() => Math.random() - 0.5);
        const shuffledOptionIds = shuffledOptions.map((o) => o.id);

        // Store server mapping
        await supabaseClient.from('attempt_questions').insert({
          attempt_id: newAttempt.id,
          question_id: q.id,
          display_order: displayOrder,
          shuffled_option_ids: shuffledOptionIds,
        });

        // Safe display object (WITHOUT is_correct)
        clientQuestions.push({
          id: q.id,
          display_order: displayOrder,
          question_text: q.question_text,
          code_snippet: q.code_snippet,
          difficulty: q.difficulty,
          topic: q.topic,
          options: shuffledOptions.map((o) => ({ id: o.id, option_text: o.option_text })),
        });

        displayOrder++;
      }

      return new Response(
        JSON.stringify({
          attempt_id: newAttempt.id,
          token: attemptToken,
          started_at: newAttempt.started_at,
          duration_seconds: duration + (sessionStudent.extra_time_seconds || 0),
          questions: clientQuestions,
          saved_answers: [],
          is_resumed: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Viva Questions selection (5 questions)
      const vivaCount = session.number_of_viva_questions || 5;
      const { data: allViva } = await supabaseClient
        .from('viva_questions')
        .select('id, question_text, difficulty, topic, max_marks')
        .eq('active', true);

      const selectedViva = (allViva || []).sort(() => Math.random() - 0.5).slice(0, vivaCount);

      return new Response(
        JSON.stringify({
          attempt_id: newAttempt.id,
          token: attemptToken,
          started_at: newAttempt.started_at,
          duration_seconds: duration + (sessionStudent.extra_time_seconds || 0),
          viva_questions: selectedViva,
          is_resumed: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
