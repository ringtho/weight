import React from 'react';
import {
  Award,
  Camera,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
  Target,
  TrendingDown,
  Upload
} from 'lucide-react';

type TrackerHeaderProps = {
  showStats: boolean;
  showTimer: boolean;
  showComparison: boolean;
  showGoals: boolean;
  showOnboarding: boolean;
  onToggleStats: () => void;
  onToggleTimer: () => void;
  onToggleComparison: () => void;
  onToggleGoals: () => void;
  onToggleOnboarding: () => void;
  onExportText: () => void;
  onExportJson: () => void;
  onRequestImport: () => void;
  onResetAll: () => void;
  onImportJson: (event: React.ChangeEvent<HTMLInputElement>) => void;
  importInputRef: React.RefObject<HTMLInputElement>;
  todayLabel: string;
  canJumpToToday: boolean;
  isOnToday: boolean;
  todayHint: string;
  onJumpToToday: () => void;
};

export default function TrackerHeader({
  showStats,
  showTimer,
  showComparison,
  showGoals,
  showOnboarding,
  onToggleStats,
  onToggleTimer,
  onToggleComparison,
  onToggleGoals,
  onToggleOnboarding,
  onExportText,
  onExportJson,
  onRequestImport,
  onResetAll,
  onImportJson,
  importInputRef,
  todayLabel,
  canJumpToToday,
  isOnToday,
  todayHint,
  onJumpToToday
}: TrackerHeaderProps) {
  return (
    <div className="mb-8 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(140,106,63,0.18)] flex items-center justify-center">
            <TrendingDown className="w-7 h-7 text-[#7a5a33]" />
          </div>
          <div>
            <p className="section-label">12-Week Journal</p>
            <h1 className="text-4xl font-display font-semibold text-[#2a2219]">
              Fat Loss Tracker
            </h1>
            <p className="text-sm text-[#6a5b4a] mt-1">
              A quiet ledger for your daily discipline and momentum.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-3 rounded-full bg-white/85 border border-[#e7ded2] px-4 py-2 shadow-sm">
            <span className="section-label">Workspace</span>
            <span className="text-sm font-semibold text-[#2a2219]">Personal Ledger</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-white/85 border border-[#e7ded2] px-4 py-2 shadow-sm">
            <span className="section-label">Today</span>
            <span className="text-sm font-semibold text-[#2a2219]">{todayLabel}</span>
            {canJumpToToday ? (
              <button
                onClick={onJumpToToday}
                className={`btn btn-soft text-[11px] px-3 py-1 ${isOnToday ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {isOnToday ? 'On Today' : 'Jump'}
              </button>
            ) : (
              <span className="text-[11px] text-[#8a7b69]">{todayHint}</span>
            )}
          </div>
        </div>
      </div>
      <div className="toolbar">
        <div className="toolbar-group">
          <button
            onClick={onToggleStats}
            className={`btn ${showStats ? 'btn-accent' : 'btn-soft'}`}
          >
            <Award className="w-4 h-4" />Stats
          </button>
          <button
            onClick={onToggleTimer}
            className={`btn ${showTimer ? 'btn-accent' : 'btn-soft'}`}
          >
            <Clock className="w-4 h-4" />Timer
          </button>
          <button
            onClick={onToggleComparison}
            className={`btn ${showComparison ? 'btn-accent' : 'btn-soft'}`}
          >
            <Camera className="w-4 h-4" />Compare
          </button>
          <button
            onClick={onToggleGoals}
            className={`btn ${showGoals ? 'btn-accent' : 'btn-soft'}`}
          >
            <Target className="w-4 h-4" />Goals
          </button>
          <button
            onClick={onToggleOnboarding}
            className={`btn ${showOnboarding ? 'btn-accent' : 'btn-soft'}`}
          >
            <Sparkles className="w-4 h-4" />
            {showOnboarding ? 'Hide Onboarding' : 'Show Onboarding'}
          </button>
        </div>
        <div className="toolbar-group">
          <button onClick={onExportText} className="btn btn-outline text-xs">
            <Download className="w-4 h-4" />Export TXT
          </button>
          <button onClick={onExportJson} className="btn btn-outline text-xs">
            <Download className="w-4 h-4" />Backup JSON
          </button>
          <button onClick={onRequestImport} className="btn btn-outline text-xs">
            <Upload className="w-4 h-4" />Import JSON
          </button>
          <button onClick={onResetAll} className="btn btn-danger text-xs">
            <RotateCcw className="w-4 h-4" />Reset All
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportJson}
          />
        </div>
      </div>
    </div>
  );
}
