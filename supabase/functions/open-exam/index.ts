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

    const { session_id, scope, target_ids, component, faculty_id } = await req.json();

    if (!session_id || !scope || !component) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    let query = supabaseClient.from('session_students').update({
      quiz_open: component === 'quiz' || component === 'both',
      viva_open: component === 'viva' || component === 'both',
      opened_at: now,
      opened_by: faculty_id || null,
      updated_at: now,
    }).eq('session_id', session_id);

    if (scope === 'student' && target_ids?.length) {
      query = query.in('student_id', target_ids);
    } else if (scope === 'batch' && target_ids?.length) {
      query = query.in('batch_id_snapshot', target_ids);
    } else if (scope === 'all_lab_completed') {
      query = query.eq('lab_status', 'completed');
    }

    const { error: updateError } = await query;
    if (updateError) throw updateError;

    // Ensure session is marked active
    await supabaseClient
      .from('exam_sessions')
      .update({ status: 'active', updated_at: now })
      .eq('id', session_id);

    // Audit log
    await supabaseClient.from('audit_logs').insert({
      actor_id: faculty_id || null,
      actor_name: 'Faculty',
      action: 'OPEN_EXAM',
      entity_type: 'exam_session',
      entity_id: session_id,
      metadata: { scope, target_ids, component },
    });

    return new Response(
      JSON.stringify({ success: true, message: `Exam component ${component} unlocked successfully.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
