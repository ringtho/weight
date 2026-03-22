import React from 'react';
import type { ViewMode } from '../../lib/trackerTypes';

type ViewToggleProps = {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="mb-6">
      <div className="toggle-group">
        <button
          onClick={() => onChange('weekly')}
          className={`toggle-item ${viewMode === 'weekly' ? 'active' : ''}`}
        >
          Weekly View
        </button>
        <button
          onClick={() => onChange('daily')}
          className={`toggle-item ${viewMode === 'daily' ? 'active' : ''}`}
        >
          Daily View
        </button>
      </div>
    </div>
  );
}
