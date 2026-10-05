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

    const { session_id, student_ids, marks, remarks, faculty_id } = await req.json();

    if (!session_id || !student_ids || !Array.isArray(student_ids)) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: session } = await supabaseClient
      .from('exam_sessions')
      .select('auto_open_when_lab_done, status')
      .eq('id', session_id)
      .single();

    const now = new Date().toISOString();
    const autoOpen = Boolean(session?.auto_open_when_lab_done);

    for (const studentId of student_ids) {
      const updateData: any = {
        lab_status: 'completed',
        lab_completed_at: now,
        lab_completed_by: faculty_id || null,
        updated_at: now,
      };

      if (marks !== undefined) updateData.lab_marks = marks;
      if (remarks !== undefined) updateData.lab_remarks = remarks;

      if (autoOpen) {
        updateData.quiz_open = true;
        updateData.viva_open = true;
        updateData.opened_at = now;
        updateData.opened_by = faculty_id || null;
      }

      await supabaseClient
        .from('session_students')
        .update(updateData)
        .eq('session_id', session_id)
        .eq('student_id', studentId);

      // Audit log
      await supabaseClient.from('audit_logs').insert({
        actor_id: faculty_id || null,
        actor_name: 'Faculty',
        action: 'MARK_LAB_COMPLETE',
        entity_type: 'session_students',
        entity_id: `${session_id}:${studentId}`,
        metadata: { auto_open: autoOpen, marks, remarks },
      });
    }

    return new Response(
      JSON.stringify({ success: true, count: student_ids.length, auto_opened: autoOpen }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
