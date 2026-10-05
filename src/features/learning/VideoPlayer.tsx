import React, { useState, useEffect, useRef } from 'react';
import { Unit, Video } from '../../types';
import { store } from '../../services/store';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, FileText, Lock } from 'lucide-react';

interface VideoPlayerProps {
  unit: Unit;
  video: Video;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ unit, video, onClose }) => {
  const student = store.currentProfile;
  const initialProg = store.getVideoProgress(student.id, video.id);

  const [position, setPosition] = useState<number>(initialProg?.last_position_seconds || 0);
  const [maxPosition, setMaxPosition] = useState<number>(initialProg?.max_position_seconds || 0);
  const [watchedSeconds, setWatchedSeconds] = useState<number>(initialProg?.watched_seconds || 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(initialProg?.completed || false);
  const [antiSkipWarning, setAntiSkipWarning] = useState<string | null>(null);
  const [parallelWarning, setParallelWarning] = useState<string | null>(null);

  const sessionIdRef = useRef<string>('vid-tab-' + Math.random().toString(36).substring(2, 9));
  const intervalRef = useRef<any>(null);

  // Heartbeat loop every 4 seconds
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setPosition((prevPos) => {
        const nextPos = Math.min(video.duration_seconds, prevPos + 1.0);

        // Ping server heartbeat
        const hbResult = store.recordVideoHeartbeat(
          video.id,
          nextPos,
          sessionIdRef.current,
          new Date().toISOString()
        );

        if (!hbResult.success && hbResult.error) {
          setParallelWarning(hbResult.error);
          setIsPlaying(false);
          return prevPos;
        }

        if (hbResult.snap_to !== null) {
          setAntiSkipWarning('Forward seeking is disabled by university policy. Snapped back to validated watch point.');
          setTimeout(() => setAntiSkipWarning(null), 3000);
          return hbResult.snap_to;
        }

        setMaxPosition(hbResult.max_position);
        setWatchedSeconds(hbResult.watched_seconds);
        if (hbResult.completed) {
          setIsCompleted(true);
        }

        return nextPos;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, video.id, video.duration_seconds]);

  // Deterrent: pause when window loses focus or document becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setIsPlaying(false);
        setAntiSkipWarning('Playback paused because exam portal tab became inactive.');
        setTimeout(() => setAntiSkipWarning(null), 3000);
      }
    };

    const handleBlur = () => {
      if (isPlaying) {
        setIsPlaying(false);
        setAntiSkipWarning('Playback paused because window lost focus.');
        setTimeout(() => setAntiSkipWarning(null), 3000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const percentWatched = Math.min(100, Math.round((watchedSeconds / video.duration_seconds) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                Unit {unit.unit_number}: {unit.program_number}
              </span>
              <span className="text-xs text-slate-500 font-mono">Anti-Skip Heartbeat Active</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{video.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Warning Banners */}
        {antiSkipWarning && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{antiSkipWarning}</span>
          </div>
        )}

        {parallelWarning && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-xs text-red-800 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{parallelWarning}</span>
          </div>
        )}

        {/* Custom Video Player Canvas / Frame */}
        <div className="relative bg-slate-950 aspect-video flex flex-col items-center justify-center text-white overflow-hidden select-none">
          {/* Subtle anti-recording student watermark */}
          <div className="absolute inset-0 pointer-events-none opacity-15 flex flex-wrap items-center justify-around gap-16 font-mono text-xs select-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i}>{student.roll_number} • {student.full_name}</span>
            ))}
          </div>

          <div className="text-center px-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-teal-400">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <h4 className="text-lg font-bold text-slate-100">{video.title}</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Simulated University Video Player with server-validated anti-skip progression and pause-on-blur deterrence.
            </p>
          </div>

          {/* Player Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 border-t border-slate-800 p-4 flex flex-col gap-2">
            {/* Custom anti-skip progress bar: Forward seeking blocked */}
            <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              {/* Validated Max Position watched */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-teal-500/40"
                style={{ width: `${(maxPosition / video.duration_seconds) * 100}%` }}
              ></div>
              {/* Current Playhead */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-teal-400"
                style={{ width: `${(position / video.duration_seconds) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPosition(0);
                    store.recordVideoHeartbeat(video.id, 0, sessionIdRef.current, new Date().toISOString());
                  }}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Rewind to start (Rewatching never resets completion)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-400">
                  {formatTime(position)} / {formatTime(video.duration_seconds)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Watched: {percentWatched}% (Req: 95%)</span>
                </div>
                {isCompleted && (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Notes & Takeaways */}
        <div className="p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">Key Takeaways & Learning Objectives</h4>
            {unit.notes_url && (
              <a
                href={unit.notes_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-semibold"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Reference Notes / PDF</span>
              </a>
            )}
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
            {unit.key_takeaways.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
