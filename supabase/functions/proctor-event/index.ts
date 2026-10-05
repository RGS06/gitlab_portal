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

    const { attempt_id, event_type, severity, metadata, snapshot_url } = await req.json();

    if (!attempt_id || !event_type) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: attempt } = await supabaseClient
      .from('attempts')
      .select('*, exam_sessions(*)')
      .eq('id', attempt_id)
      .single();

    if (!attempt || attempt.status !== 'in_progress') {
      return new Response(JSON.stringify({ error: 'Attempt not active' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert proctor event
    await supabaseClient.from('proctor_events').insert({
      attempt_id,
      student_id: attempt.student_id,
      event_type,
      severity: severity || 1,
      metadata: metadata || {},
      snapshot_url: snapshot_url || null,
    });

    // Count violations
    const { count } = await supabaseClient
      .from('proctor_events')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attempt_id);

    const threshold = attempt.exam_sessions?.violation_threshold || 3;
    const violationsCount = count || 1;
    let shouldAutoSubmit = violationsCount >= threshold;

    let penalty = violationsCount * 15;
    let integrityScore = Math.max(0, 100 - penalty);
    let riskLevel = integrityScore < 50 ? 'High' : (integrityScore < 80 ? 'Medium' : 'Low');

    await supabaseClient
      .from('attempts')
      .update({
        violations_count: violationsCount,
        integrity_score: integrityScore,
        risk_level: riskLevel,
        status: shouldAutoSubmit ? 'flagged' : 'in_progress',
      })
      .eq('id', attempt_id);

    return new Response(
      JSON.stringify({
        success: true,
        violations_count: violationsCount,
        threshold,
        auto_submit: shouldAutoSubmit,
        risk_level: riskLevel,
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
