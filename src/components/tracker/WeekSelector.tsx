import React from 'react';
import { Calendar } from 'lucide-react';
import { TOTAL_WEEKS } from '../../lib/trackerData';

type WeekSelectorProps = {
  currentWeek: number;
  onSelectWeek: (week: number) => void;
};

export default function WeekSelector({ currentWeek, onSelectWeek }: WeekSelectorProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[#8c6a3f]" />
        <label className="text-lg font-semibold text-[#2a2219]">Select Week:</label>
      </div>
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
        {[...Array(TOTAL_WEEKS)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => onSelectWeek(i + 1)}
            className={`px-3 py-2 rounded-full text-sm font-semibold transition ${
              currentWeek === i + 1
                ? 'bg-[#2a2219] text-white'
                : 'bg-white/85 text-[#6a5b4a] hover:bg-white border border-[#e7ded2]'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
