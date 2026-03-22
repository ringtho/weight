import React, { useEffect, useState } from 'react';
import { Dumbbell, Pause, Play, RotateCcw } from 'lucide-react';
import type { TimerPhase } from '../../lib/trackerTypes';

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainder
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

const phaseLabels: Record<TimerPhase, string> = {
  prep: 'Prep',
  work: 'Work',
  rest: 'Rest',
  complete: 'Complete'
};

const phaseColors: Record<TimerPhase, string> = {
  prep: '#8c6a3f',
  work: '#4b5a4a',
  rest: '#6e4f2a',
  complete: '#2a2219'
};

type TimerPanelProps = {
  timerActive: boolean;
  timeLeft: number;
  timerPhase: TimerPhase;
  currentRound: number;
  totalRounds: number;
  currentTabata: number;
  totalTabatas: number;
  prepTime: number;
  workTime: number;
  restTime: number;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onChangePrepTime: (value: number) => void;
  onChangeWorkTime: (value: number) => void;
  onChangeRestTime: (value: number) => void;
  onChangeTotalRounds: (value: number) => void;
  onChangeTotalTabatas: (value: number) => void;
};

export default function TimerPanel({
  timerActive,
  timeLeft,
  timerPhase,
  currentRound,
  totalRounds,
  currentTabata,
  totalTabatas,
  prepTime,
  workTime,
  restTime,
  onToggleTimer,
  onResetTimer,
  onChangePrepTime,
  onChangeWorkTime,
  onChangeRestTime,
  onChangeTotalRounds,
  onChangeTotalTabatas
}: TimerPanelProps) {
  const [prepInput, setPrepInput] = useState(String(prepTime));
  const [workInput, setWorkInput] = useState(String(workTime));
  const [restInput, setRestInput] = useState(String(restTime));
  const [cyclesInput, setCyclesInput] = useState(String(totalRounds));
  const [tabatasInput, setTabatasInput] = useState(String(totalTabatas));

  useEffect(() => setPrepInput(String(prepTime)), [prepTime]);
  useEffect(() => setWorkInput(String(workTime)), [workTime]);
  useEffect(() => setRestInput(String(restTime)), [restTime]);
  useEffect(() => setCyclesInput(String(totalRounds)), [totalRounds]);
  useEffect(() => setTabatasInput(String(totalTabatas)), [totalTabatas]);

  const handleNumericChange = (
    raw: string,
    setter: (value: string) => void,
    onCommit: (value: number) => void
  ) => {
    if (!/^[0-9]*$/.test(raw)) return;
    setter(raw);
    if (raw !== '') {
      onCommit(Number(raw));
    }
  };

  const handleNumericBlur = (
    raw: string,
    setter: (value: string) => void,
    fallback: number
  ) => {
    if (raw === '') {
      setter(String(fallback));
    }
  };
  const phaseDuration =
    timerPhase === 'prep'
      ? prepTime
      : timerPhase === 'work'
        ? workTime
        : timerPhase === 'rest'
          ? restTime
          : 0;

  const totalWorkSeconds = totalTabatas * totalRounds * workTime;
  const totalRestSeconds =
    restTime * (totalTabatas * Math.max(totalRounds - 1, 0) + Math.max(totalTabatas - 1, 0));
  const totalSessionSeconds = prepTime + totalWorkSeconds + totalRestSeconds;

  const progress =
    phaseDuration > 0 ? Math.min(1, (phaseDuration - timeLeft) / phaseDuration) : 1;
  const phaseColor = phaseColors[timerPhase];
  const ringStyle = {
    background: `conic-gradient(${phaseColor} ${progress * 360}deg, rgba(231, 222, 210, 0.8) 0deg)`
  };

  return (
    <div className="mb-6 p-6 surface-panel rounded-2xl animate-fade-up">
      <div className="mb-5">
        <p className="section-label">Training</p>
        <h2 className="section-title text-[#2a2219] flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-[#4b5a4a]" />Tabata Studio
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,1fr] gap-6">
        <div className="glass-card rounded-3xl p-8 text-center">
          <div className="mx-auto w-56 h-56 rounded-full p-2" style={ringStyle}>
            <div className="w-full h-full rounded-full bg-white/90 border border-[#e7ded2] flex flex-col items-center justify-center">
              <p className="section-label">{phaseLabels[timerPhase]}</p>
              <p className="text-5xl font-display font-semibold text-[#2a2219]">
                {formatTime(timeLeft)}
              </p>
              <p className="text-sm text-[#6a5b4a] mt-2">
                {timerPhase === 'complete'
                  ? 'Session complete'
                  : `Cycle ${currentRound} of ${totalRounds}`}
              </p>
              <p className="text-xs text-[#9a8a77] mt-1">
                Tabata {currentTabata} of {totalTabatas}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-6">
            {!timerActive ? (
              <button onClick={onToggleTimer} className="btn btn-accent px-6 py-3 text-base">
                <Play className="w-5 h-5" />Start
              </button>
            ) : (
              <button onClick={onToggleTimer} className="btn btn-outline px-6 py-3 text-base">
                <Pause className="w-5 h-5" />Pause
              </button>
            )}
            <button onClick={onResetTimer} className="btn btn-outline px-6 py-3 text-base">
              <RotateCcw className="w-5 h-5" />Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-panel rounded-2xl p-5">
            <p className="section-label mb-3">Intervals</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                  Prep (sec)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={prepInput}
                  onChange={(e) => handleNumericChange(e.target.value, setPrepInput, onChangePrepTime)}
                  onBlur={() => handleNumericBlur(prepInput, setPrepInput, prepTime)}
                  disabled={timerActive}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                  Work (sec)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={workInput}
                  onChange={(e) => handleNumericChange(e.target.value, setWorkInput, onChangeWorkTime)}
                  onBlur={() => handleNumericBlur(workInput, setWorkInput, workTime)}
                  disabled={timerActive}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                  Rest (sec)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={restInput}
                  onChange={(e) => handleNumericChange(e.target.value, setRestInput, onChangeRestTime)}
                  onBlur={() => handleNumericBlur(restInput, setRestInput, restTime)}
                  disabled={timerActive}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                  Cycles
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={cyclesInput}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, setCyclesInput, onChangeTotalRounds)
                  }
                  onBlur={() => handleNumericBlur(cyclesInput, setCyclesInput, totalRounds)}
                  disabled={timerActive}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                  Tabatas
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={tabatasInput}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, setTabatasInput, onChangeTotalTabatas)
                  }
                  onBlur={() => handleNumericBlur(tabatasInput, setTabatasInput, totalTabatas)}
                  disabled={timerActive}
                  className="input-field"
                />
              </div>
            </div>
          </div>
          <div className="surface-panel rounded-2xl p-5">
            <p className="section-label mb-2">Session Summary</p>
            <p className="text-sm text-[#6a5b4a]">
              Prep {prepTime}s • Work {workTime}s • Rest {restTime}s • {totalRounds} cycles • {totalTabatas}
              tabata{totalTabatas > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-[#6a5b4a] mt-2">
              Total time: {formatDuration(totalSessionSeconds)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
