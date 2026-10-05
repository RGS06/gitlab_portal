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

    const { attempt_id, token, question_id, selected_option_id, is_flagged } = await req.json();

    if (!attempt_id || !token || !question_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify attempt token & status
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('attempts')
      .select('*')
      .eq('id', attempt_id)
      .eq('token', token)
      .single();

    if (attemptError || !attempt || attempt.status !== 'in_progress') {
      return new Response(JSON.stringify({ error: 'Invalid or expired attempt session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify server-side timer
    const elapsedSeconds = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
    const totalAllowed = attempt.duration_seconds + (attempt.extra_time_seconds || 0);

    if (elapsedSeconds > totalAllowed + 15) {
      return new Response(JSON.stringify({ error: 'Exam timer has expired' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify question belongs to attempt
    const { data: aq } = await supabaseClient
      .from('attempt_questions')
      .select('id, shuffled_option_ids')
      .eq('attempt_id', attempt_id)
      .eq('question_id', question_id)
      .maybeSingle();

    if (!aq) {
      return new Response(JSON.stringify({ error: 'Question does not belong to this attempt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate selected option if provided
    if (selected_option_id && !aq.shuffled_option_ids.includes(selected_option_id)) {
      return new Response(JSON.stringify({ error: 'Selected option is invalid for this question' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert answer without grading (client must never grade!)
    await supabaseClient.from('attempt_answers').upsert(
      {
        attempt_id,
        question_id,
        selected_option_id: selected_option_id || null,
        is_flagged: Boolean(is_flagged),
        saved_at: new Date().toISOString(),
      },
      { onConflict: 'attempt_id,question_id' }
    );

    return new Response(JSON.stringify({ success: true, saved_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
