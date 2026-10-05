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

    const { session_id, faculty_id } = await req.json();

    if (!session_id) {
      return new Response(JSON.stringify({ error: 'Missing session_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // 1. Close session
    await supabaseClient
      .from('exam_sessions')
      .update({ status: 'closed', updated_at: now })
      .eq('id', session_id);

    // 2. Lock session_students
    await supabaseClient
      .from('session_students')
      .update({ quiz_open: false, viva_open: false, updated_at: now })
      .eq('session_id', session_id);

    // 3. Auto-submit any remaining in_progress attempts
    const { data: openAttempts } = await supabaseClient
      .from('attempts')
      .select('id, student_id')
      .eq('session_id', session_id)
      .eq('status', 'in_progress');

    for (const att of openAttempts || []) {
      await supabaseClient
        .from('attempts')
        .update({ status: 'auto_submitted', submitted_at: now })
        .eq('id', att.id);
    }

    // 4. Audit
    await supabaseClient.from('audit_logs').insert({
      actor_id: faculty_id || null,
      actor_name: 'Faculty',
      action: 'CLOSE_SESSION',
      entity_type: 'exam_session',
      entity_id: session_id,
      metadata: { closed_at: now, auto_submitted_count: openAttempts?.length || 0 },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Exam session closed and lingering attempts auto-submitted.',
        auto_submitted_count: openAttempts?.length || 0,
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
