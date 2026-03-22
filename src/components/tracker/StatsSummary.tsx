import React from 'react';
import { Dumbbell, Flame, Scale, TrendingDown } from 'lucide-react';
import type { StatsSummary as StatsSummaryType } from '../../lib/trackerTypes';

type StatsSummaryProps = {
  stats: StatsSummaryType;
};

export default function StatsSummary({ stats }: StatsSummaryProps) {
  const isEmpty =
    stats.totalWorkouts === 0 &&
    stats.currentStreak === 0 &&
    stats.totalWeightLost === 0 &&
    stats.totalInchesLost === 0;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 stagger-children animate-fade-up">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-5 h-5 text-[#8c6a3f]" />
            <p className="text-sm font-semibold text-[#6a5b4a]">Weight Lost</p>
          </div>
          <p className="text-2xl font-display font-semibold text-[#2a2219]">
            {stats.totalWeightLost.toFixed(1)} kg
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-[#6b4f2a]" />
            <p className="text-sm font-semibold text-[#6a5b4a]">Inches Lost</p>
          </div>
          <p className="text-2xl font-display font-semibold text-[#2a2219]">
            {stats.totalInchesLost.toFixed(1)}"
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell className="w-5 h-5 text-[#4b5a4a]" />
            <p className="text-sm font-semibold text-[#6a5b4a]">Workouts</p>
          </div>
          <p className="text-2xl font-display font-semibold text-[#2a2219]">
            {stats.totalWorkouts}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-[#9a4f45]" />
            <p className="text-sm font-semibold text-[#6a5b4a]">Week Streak</p>
          </div>
          <p className="text-2xl font-display font-semibold text-[#2a2219]">
            {stats.currentStreak}
          </p>
        </div>
      </div>
      {isEmpty && (
        <p className="text-xs text-[#8a7b69] mb-6">
          Add your first weekly check-in to see progress stats here.
        </p>
      )}
    </>
  );
}
