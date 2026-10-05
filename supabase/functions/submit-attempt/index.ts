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

    const { attempt_id, token, reason } = await req.json();

    if (!attempt_id || !token) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('attempts')
      .select('*, exam_sessions(*)')
      .eq('id', attempt_id)
      .eq('token', token)
      .single();

    if (attemptError || !attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (attempt.status === 'submitted') {
      return new Response(JSON.stringify({ error: 'Attempt already submitted' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();

    // 1. Grade MCQs server-side
    let totalScore = 0;
    let maxScore = 0;

    if (attempt.part_type === 'quiz') {
      const { data: questions } = await supabaseClient
        .from('attempt_questions')
        .select('question_id')
        .eq('attempt_id', attempt_id);

      maxScore = (questions || []).length * 1.0;

      const { data: answers } = await supabaseClient
        .from('attempt_answers')
        .select('id, question_id, selected_option_id')
        .eq('attempt_id', attempt_id);

      for (const ans of answers || []) {
        if (ans.selected_option_id) {
          const { data: opt } = await supabaseClient
            .from('mcq_options')
            .select('is_correct')
            .eq('id', ans.selected_option_id)
            .single();

          const isCorrect = Boolean(opt?.is_correct);
          const marksAwarded = isCorrect ? 1.0 : 0.0;
          if (isCorrect) totalScore += 1.0;

          await supabaseClient
            .from('attempt_answers')
            .update({
              is_correct: isCorrect,
              marks_awarded: marksAwarded,
            })
            .eq('id', ans.id);
        } else {
          await supabaseClient
            .from('attempt_answers')
            .update({
              is_correct: false,
              marks_awarded: 0.0,
            })
            .eq('id', ans.id);
        }
      }
    }

    // 2. Compute Integrity Score & Risk Level from Proctor Events
    const { data: events } = await supabaseClient
      .from('proctor_events')
      .select('severity')
      .eq('attempt_id', attempt_id);

    let penaltyPoints = 0;
    for (const ev of events || []) {
      penaltyPoints += Number(ev.severity || 1) * 10;
    }

    const integrityScore = Math.max(0, Math.min(100, 100 - penaltyPoints));
    let riskLevel = 'Low';
    if (integrityScore < 50 || penaltyPoints >= 50) {
      riskLevel = 'High';
    } else if (integrityScore < 80) {
      riskLevel = 'Medium';
    }

    // 3. Generate Submission Receipt
    const receiptId = `SMVITM-${attempt.part_type.toUpperCase()}-${attempt_id.substring(0, 8)}-${Date.now()}`;

    // 4. Update attempt state
    await supabaseClient
      .from('attempts')
      .update({
        status: reason === 'auto_submitted' ? 'auto_submitted' : 'submitted',
        submitted_at: now.toISOString(),
        score: totalScore,
        max_score: maxScore,
        integrity_score: integrityScore,
        risk_level: riskLevel,
        violations_count: events?.length || 0,
        submission_receipt: receiptId,
      })
      .eq('id', attempt_id);

    // Audit log
    await supabaseClient.from('audit_logs').insert({
      actor_id: attempt.student_id,
      actor_name: 'Student',
      action: 'SUBMIT_ATTEMPT',
      entity_type: 'attempt',
      entity_id: attempt_id,
      metadata: { part_type: attempt.part_type, score: totalScore, receipt: receiptId },
    });

    return new Response(
      JSON.stringify({
        success: true,
        submission_receipt: receiptId,
        submitted_at: now.toISOString(),
        part_type: attempt.part_type,
        message: 'Your attempt has been securely submitted to the university server.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
