import React from 'react';
import type { GoalsState } from '../../lib/trackerTypes';

type GoalsPanelProps = {
  goals: GoalsState;
  progressPercent: number;
  onResetGoals: () => void;
  onGoalsChange: (nextGoals: GoalsState) => void;
};

export default function GoalsPanel({
  goals,
  progressPercent,
  onResetGoals,
  onGoalsChange
}: GoalsPanelProps) {
  const startWeight = parseFloat(goals.startWeight);
  const targetWeight = parseFloat(goals.targetWeight);
  const hasGoalDelta = Number.isFinite(startWeight) && Number.isFinite(targetWeight);
  const goalDelta = hasGoalDelta ? startWeight - targetWeight : 0;

  return (
    <div className="mb-6 p-6 surface-panel rounded-2xl animate-fade-up">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="section-label">Targets</p>
          <h2 className="section-title text-[#2a2219]">Set Your Goals</h2>
        </div>
        <button
          onClick={onResetGoals}
          className="btn btn-outline self-start md:self-auto"
        >
          Reset Goals
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
            Start Weight (kg)
          </label>
          <input
            type="number"
            min="0"
            value={goals.startWeight}
            onChange={(e) => onGoalsChange({ ...goals, startWeight: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
            Target Weight (kg)
          </label>
          <input
            type="number"
            min="0"
            value={goals.targetWeight}
            onChange={(e) => onGoalsChange({ ...goals, targetWeight: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Start Date</label>
          <input
            type="date"
            value={goals.startDate}
            onChange={(e) => onGoalsChange({ ...goals, startDate: e.target.value })}
            className="input-field"
          />
          <p className="text-xs text-[#8a7b69] mt-1">
            Daily labels and auto-jump use this date.
          </p>
        </div>
      </div>
      {goals.startWeight && goals.targetWeight && (
        <div className="mt-6 p-4 bg-white/90 rounded-2xl border border-[#e7ded2]">
          <p className="text-lg font-display font-semibold text-[#2a2219]">
            Goal: Lose {goalDelta.toFixed(1)} kg
          </p>
          <div className="mt-3">
            <div className="w-full bg-[#efe2cf] rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#8c6a3f] to-[#6e4f2a] h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-[#6a5b4a] mt-2">{progressPercent}% Complete</p>
          </div>
        </div>
      )}
    </div>
  );
}
