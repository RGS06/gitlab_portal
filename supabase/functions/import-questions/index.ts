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

    const { type, records, admin_id } = await req.json();

    if (!type || !records || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: 'Missing type or records' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let importedCount = 0;
    const errors: string[] = [];

    if (type === 'mcq') {
      for (const [idx, r] of records.entries()) {
        if (!r.question_text || !r.options || r.options.length < 2) {
          errors.push(`Row ${idx + 1}: Invalid question or missing options.`);
          continue;
        }

        const { data: q, error: qErr } = await supabaseClient
          .from('mcq_questions')
          .insert({
            topic: r.topic || 'General Git',
            difficulty: r.difficulty || 'Medium',
            question_text: r.question_text,
            code_snippet: r.code_snippet || null,
            explanation: r.explanation || null,
            tags: r.tags || [],
            is_practice: Boolean(r.is_practice),
            active: true,
          })
          .select()
          .single();

        if (qErr || !q) {
          errors.push(`Row ${idx + 1}: DB Error - ${qErr?.message}`);
          continue;
        }

        // Insert options
        for (const opt of r.options) {
          await supabaseClient.from('mcq_options').insert({
            question_id: q.id,
            option_key: opt.key || 'A',
            option_text: opt.text,
            is_correct: Boolean(opt.is_correct),
          });
        }
        importedCount++;
      }
    } else if (type === 'viva') {
      for (const [idx, r] of records.entries()) {
        if (!r.question_text || !r.reference_answer || !r.key_concepts) {
          errors.push(`Row ${idx + 1}: Missing question_text, reference_answer or key_concepts.`);
          continue;
        }

        const { error: vErr } = await supabaseClient.from('viva_questions').insert({
          topic: r.topic || 'General Git',
          difficulty: r.difficulty || 'Medium',
          question_text: r.question_text,
          reference_answer: r.reference_answer,
          key_concepts: Array.isArray(r.key_concepts) ? r.key_concepts : [r.key_concepts],
          rubric: r.rubric || null,
          max_marks: Number(r.max_marks || 10),
          active: true,
        });

        if (vErr) {
          errors.push(`Row ${idx + 1}: DB Error - ${vErr.message}`);
          continue;
        }
        importedCount++;
      }
    }

    // Audit log
    await supabaseClient.from('audit_logs').insert({
      actor_id: admin_id || null,
      actor_name: 'Administrator',
      action: `IMPORT_${type.toUpperCase()}_QUESTIONS`,
      entity_type: `${type}_questions`,
      entity_id: 'batch_import',
      metadata: { total: records.length, imported: importedCount, errors_count: errors.length },
    });

    return new Response(
      JSON.stringify({ success: errors.length === 0, imported: importedCount, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
