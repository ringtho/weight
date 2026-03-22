import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, SkipForward, Settings2, Volume2, VolumeX } from 'lucide-react';
import ProgressRing from './ProgressRing';
import type { TimerPhase } from '../../lib/trackerTypes';

type TimerSettings = {
  prepTime: number;
  workTime: number;
  restTime: number;
  totalRounds: number;
  totalTabatas: number;
};

type Props = {
  settings: TimerSettings;
  onUpdateSettings: (s: TimerSettings) => void;
};

const PHASE_COLORS: Record<TimerPhase, string> = {
  prep: '#f59e0b',
  work: '#10b981',
  rest: '#3b82f6',
  complete: '#7c3aed',
};

const PHASE_LABELS: Record<TimerPhase, string> = {
  prep: 'GET READY',
  work: 'WORK',
  rest: 'REST',
  complete: 'DONE!',
};

function getInitialPhase(prepTime: number): TimerPhase {
  return prepTime > 0 ? 'prep' : 'work';
}

function getInitialTime(prepTime: number, workTime: number): number {
  return prepTime > 0 ? prepTime : workTime;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function TimerPage({ settings, onUpdateSettings }: Props) {
  const { prepTime, workTime, restTime, totalRounds, totalTabatas } = settings;
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => getInitialTime(prepTime, workTime));
  const [phase, setPhase] = useState<TimerPhase>(() => getInitialPhase(prepTime));
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTabata, setCurrentTabata] = useState(1);
  const [restMode, setRestMode] = useState<'cycle' | 'tabata' | null>(null);
  const [muted, setMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const beep = (freq: number, dur = 0.2) => {
    if (muted) return;
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur + 0.01);
    } catch { /* silent fail */ }
  };

  const resetTimer = () => {
    setTimerActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const initPhase = getInitialPhase(prepTime);
    setPhase(initPhase);
    setTimeLeft(getInitialTime(prepTime, workTime));
    setCurrentRound(1);
    setCurrentTabata(1);
    setRestMode(null);
    setCompletedSets(0);
  };

  // Reset when settings change
  useEffect(() => { resetTimer(); }, [prepTime, workTime, restTime, totalRounds, totalTabatas]);

  const advance = () => {
    beep(880, 0.15);
    setCompletedSets((prev) => prev + 1);

    if (phase === 'prep') {
      setPhase('work');
      setTimeLeft(workTime);
      return;
    }

    if (phase === 'work') {
      if (currentRound < totalRounds) {
        setPhase('rest');
        setRestMode('cycle');
        setTimeLeft(restTime);
        return;
      }
      // All rounds done in this tabata
      if (currentTabata < totalTabatas) {
        setPhase('rest');
        setRestMode('tabata');
        setTimeLeft(restTime * 2);
        return;
      }
      // All tabatas done
      setPhase('complete');
      setTimerActive(false);
      beep(660, 0.4);
      setTimeout(() => beep(880, 0.4), 450);
      setTimeout(() => beep(1100, 0.6), 900);
      return;
    }

    if (phase === 'rest') {
      if (restMode === 'cycle') {
        setCurrentRound((prev) => prev + 1);
        setPhase('work');
        setTimeLeft(workTime);
        setRestMode(null);
      } else {
        setCurrentTabata((prev) => prev + 1);
        setCurrentRound(1);
        setPhase('work');
        setTimeLeft(workTime);
        setRestMode(null);
      }
    }
  };

  useEffect(() => {
    if (!timerActive || phase === 'complete') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          advance();
          return 0;
        }
        if (prev <= 4) beep(660, 0.1);
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive, phase, currentRound, currentTabata]);

  const color = PHASE_COLORS[phase];
  const totalTime = phase === 'prep' ? prepTime : phase === 'work' ? workTime : phase === 'rest' ? (restMode === 'tabata' ? restTime * 2 : restTime) : workTime;
  const pct = totalTime > 0 ? timeLeft / totalTime : 0;
  const totalSets = totalRounds * totalTabatas;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="eyebrow mb-1">Interval Timer</div>
          <h1 className="page-title">Tabata</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX size={16} className="text-slate-500" /> : <Volume2 size={16} />}
          </button>
          <button className="btn-ghost" onClick={() => setShowSettings((s) => !s)}>
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card p-5 mb-6 animate-slide-up">
          <div className="section-heading text-base mb-4">Timer Settings</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Prep (sec)', key: 'prepTime' as const, min: 0, max: 60 },
              { label: 'Work (sec)', key: 'workTime' as const, min: 5, max: 600 },
              { label: 'Rest (sec)', key: 'restTime' as const, min: 5, max: 600 },
              { label: 'Rounds', key: 'totalRounds' as const, min: 1, max: 50 },
              { label: 'Tabatas', key: 'totalTabatas' as const, min: 1, max: 20 },
            ].map(({ label, key, min, max }) => (
              <div key={key}>
                <label className="field-label">{label}</label>
                <input
                  className="dark-input"
                  type="number"
                  min={min}
                  max={max}
                  value={settings[key]}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, [key]: Math.max(min, Math.min(max, Number(e.target.value))) })
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Total session: ≈{Math.round(((workTime + restTime) * totalRounds * totalTabatas + (restTime * (totalTabatas - 1))) / 60)}m {Math.round(((workTime + restTime) * totalRounds * totalTabatas + (restTime * (totalTabatas - 1))) % 60)}s
          </div>
        </div>
      )}

      {/* Main timer ring */}
      <div className="card p-8 flex flex-col items-center">
        {/* Tabata / round indicators */}
        <div className="flex items-center gap-4 mb-6 text-sm text-slate-400">
          <div>
            Tabata <span className="font-mono font-bold text-white">{currentTabata}/{totalTabatas}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div>
            Round <span className="font-mono font-bold text-white">{currentRound}/{totalRounds}</span>
          </div>
          {completedSets > 0 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div>
                Sets done <span className="font-mono font-bold text-emerald-400">{completedSets}/{totalSets}</span>
              </div>
            </>
          )}
        </div>

        {/* Ring */}
        <ProgressRing value={pct * 100} max={100} size={220} strokeWidth={14} color={color} trackColor="rgba(255,255,255,0.06)">
          <div className="text-center">
            <div
              className="text-xs font-bold tracking-widest mb-1 uppercase"
              style={{ color, letterSpacing: '0.18em' }}
            >
              {PHASE_LABELS[phase]}
            </div>
            <div
              className="font-mono font-bold text-white"
              style={{ fontSize: '3.5rem', lineHeight: 1, letterSpacing: '-0.04em' }}
            >
              {phase === 'complete' ? '✓' : formatTime(timeLeft)}
            </div>
          </div>
        </ProgressRing>

        {/* Round dots */}
        <div className="flex gap-1.5 mt-6 mb-8">
          {Array.from({ length: totalRounds }, (_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background: i < currentRound - (phase === 'work' ? 0 : 1) ? color : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            className="w-12 h-12 rounded-xl flex items-center justify-center btn-secondary"
            onClick={resetTimer}
            title="Reset"
          >
            <Square size={16} />
          </button>
          <button
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl shadow-xl transition-all"
            style={{
              background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
              boxShadow: `0 0 30px ${color}55`,
              border: `1px solid ${color}44`,
            }}
            onClick={() => {
              if (phase === 'complete') { resetTimer(); return; }
              setTimerActive((a) => !a);
            }}
          >
            {phase === 'complete' ? '↺' : timerActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            className="w-12 h-12 rounded-xl flex items-center justify-center btn-secondary"
            onClick={advance}
            title="Skip phase"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>

      {/* Progress overview */}
      <div className="mt-4 card p-4">
        <div className="eyebrow mb-3">Session Overview</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: 'Work', value: `${workTime}s`, color: '#10b981' },
            { label: 'Rest', value: `${restTime}s`, color: '#3b82f6' },
            { label: 'Rounds × Tabatas', value: `${totalRounds}×${totalTabatas}`, color: '#7c3aed' },
            { label: 'Total Sets', value: totalSets, color: '#f59e0b' },
          ].map((item) => (
            <div key={item.label}>
              <div className="font-mono font-bold text-lg" style={{ color: item.color }}>{item.value}</div>
              <div className="text-xs text-slate-400">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="progress-track mt-3">
          <div
            className="progress-fill"
            style={{ width: `${(completedSets / Math.max(totalSets, 1)) * 100}%`, background: '#7c3aed' }}
          />
        </div>
      </div>
    </div>
  );
}
