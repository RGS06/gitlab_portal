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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { video_id, position, client_timestamp, session_id } = await req.json();

    if (!video_id || position === undefined || !session_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch video details
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .select('id, duration_seconds, unit_id')
      .eq('id', video_id)
      .single();

    if (videoError || !video) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check existing progress
    const { data: progress } = await supabaseClient
      .from('video_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('video_id', video_id)
      .maybeSingle();

    const now = new Date();
    let watchedSeconds = progress ? Number(progress.watched_seconds) : 0;
    let maxPosition = progress ? Number(progress.max_position_seconds) : 0;
    const lastHeartbeat = progress?.last_heartbeat_at ? new Date(progress.last_heartbeat_at) : null;
    let activeSession = progress?.session_id;

    // Detect parallel tab / session conflict
    if (activeSession && activeSession !== session_id && lastHeartbeat && (now.getTime() - lastHeartbeat.getTime() < 15000)) {
      return new Response(
        JSON.stringify({ error: 'Parallel playback session detected. Only one tab is permitted.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side timing and jump validation
    let isValid = true;
    let rejectionReason = null;
    let delta = 0;

    if (lastHeartbeat) {
      const realElapsedSeconds = (now.getTime() - lastHeartbeat.getTime()) / 1000;
      delta = position - Number(progress?.last_position_seconds || 0);

      // Check for forward jumps beyond 2 seconds or speed-up rate > 1.25x
      if (delta > realElapsedSeconds * 1.35 || delta < -10) {
        if (delta > 2.0 && position > maxPosition + 2.0) {
          isValid = false;
          rejectionReason = 'Impossible forward jump or playback speed-up detected';
        }
      }
    }

    if (isValid) {
      if (position > maxPosition) {
        const addedSeconds = Math.min(position - maxPosition, 6.0);
        watchedSeconds += addedSeconds;
        maxPosition = position;
      }
    }

    const duration = video.duration_seconds;
    const isCompleted = (watchedSeconds >= duration * 0.95) && (position >= duration * 0.90);

    // Record heartbeat audit log
    await supabaseClient.from('video_heartbeats').insert({
      student_id: user.id,
      video_id,
      session_id,
      position,
      client_timestamp: new Date(client_timestamp),
      delta_seconds: delta,
      valid: isValid,
      rejection_reason: rejectionReason,
    });

    // Update video_progress
    const updatePayload = {
      student_id: user.id,
      video_id,
      watched_seconds: watchedSeconds,
      max_position_seconds: maxPosition,
      last_position_seconds: position,
      completed: progress?.completed || isCompleted,
      completed_at: progress?.completed ? progress.completed_at : (isCompleted ? now.toISOString() : null),
      session_id,
      last_heartbeat_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    await supabaseClient.from('video_progress').upsert(updatePayload, { onConflict: 'student_id,video_id' });

    return new Response(
      JSON.stringify({
        success: true,
        watched_seconds: watchedSeconds,
        max_position: maxPosition,
        completed: updatePayload.completed,
        snap_to: isValid ? null : maxPosition,
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
