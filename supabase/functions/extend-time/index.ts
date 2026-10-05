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

    const { session_id, student_ids, extra_minutes, faculty_id } = await req.json();

    if (!session_id || !student_ids || !extra_minutes) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const extraSeconds = Number(extra_minutes) * 60;

    for (const studentId of student_ids) {
      // Update session_students
      const { data: ss } = await supabaseClient
        .from('session_students')
        .select('extra_time_seconds')
        .eq('session_id', session_id)
        .eq('student_id', studentId)
        .single();

      const newExtra = (ss?.extra_time_seconds || 0) + extraSeconds;

      await supabaseClient
        .from('session_students')
        .update({ extra_time_seconds: newExtra, updated_at: new Date().toISOString() })
        .eq('session_id', session_id)
        .eq('student_id', studentId);

      // Update any active in_progress attempts
      await supabaseClient
        .from('attempts')
        .update({ extra_time_seconds: newExtra })
        .eq('session_id', session_id)
        .eq('student_id', studentId)
        .eq('status', 'in_progress');

      // Audit log
      await supabaseClient.from('audit_logs').insert({
        actor_id: faculty_id || null,
        actor_name: 'Faculty',
        action: 'EXTEND_TIME',
        entity_type: 'session_students',
        entity_id: `${session_id}:${studentId}`,
        metadata: { extra_minutes, new_total_extra_seconds: newExtra },
      });
    }

    return new Response(
      JSON.stringify({ success: true, count: student_ids.length, added_seconds: extraSeconds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
