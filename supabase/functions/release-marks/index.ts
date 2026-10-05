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

    const { session_id, scope, target_ids, new_state, faculty_id } = await req.json();

    if (!session_id || !new_state || !['draft', 'frozen', 'released'].includes(new_state)) {
      return new Response(JSON.stringify({ error: 'Invalid state or missing session_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    let query = supabaseClient.from('session_students').update({
      marks_state: new_state,
      updated_at: now,
    }).eq('session_id', session_id);

    if (scope === 'student' && target_ids?.length) {
      query = query.in('student_id', target_ids);
    } else if (scope === 'batch' && target_ids?.length) {
      query = query.in('batch_id_snapshot', target_ids);
    }

    const { error: updateError } = await query;
    if (updateError) throw updateError;

    // Audit log
    await supabaseClient.from('audit_logs').insert({
      actor_id: faculty_id || null,
      actor_name: 'Faculty',
      action: `MARKS_${new_state.toUpperCase()}`,
      entity_type: 'exam_session',
      entity_id: session_id,
      metadata: { scope, target_ids, new_state },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Marks transitioned to ${new_state} for scope: ${scope || 'all'}.`,
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
