import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MacroTotals, WeeklyEntry } from '../../lib/trackerTypes';
import useImageZoom from './useImageZoom';

type WeeklyViewProps = {
  currentWeek: number;
  weeklyEntry: WeeklyEntry;
  macroTotals: MacroTotals;
  onFieldChange: (field: keyof WeeklyEntry, value: WeeklyEntry[keyof WeeklyEntry]) => void;
  onAddProgressPhotos: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveProgressPhoto: (index: number) => void;
  onResetWeek: () => void;
};

export default function WeeklyView({
  currentWeek,
  weeklyEntry,
  macroTotals,
  onFieldChange,
  onAddProgressPhotos,
  onRemoveProgressPhoto,
  onResetWeek
}: WeeklyViewProps) {
  const hasMacroData = macroTotals.entryCount > 0;
  const formatTotal = (value: number, suffix: string) =>
    hasMacroData ? `${Math.round(value)} ${suffix}` : '—';
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const {
    zoom,
    offset,
    zoomIn,
    zoomOut,
    resetZoom,
    bind: zoomBind
  } = useImageZoom();

  useEffect(() => {
    if (
      activePhotoIndex !== null &&
      activePhotoIndex >= weeklyEntry.progressPhotos.length
    ) {
      setActivePhotoIndex(null);
    }
  }, [activePhotoIndex, weeklyEntry.progressPhotos.length]);

  useEffect(() => {
    if (activePhotoIndex !== null) {
      resetZoom();
    }
  }, [activePhotoIndex, resetZoom]);

  useEffect(() => {
    if (activePhotoIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActivePhotoIndex(null);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActivePhotoIndex((index) =>
          index !== null && index > 0 ? index - 1 : index
        );
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActivePhotoIndex((index) =>
          index !== null && index < weeklyEntry.progressPhotos.length - 1 ? index + 1 : index
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, weeklyEntry.progressPhotos.length]);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={onResetWeek} className="btn btn-outline text-xs">
          Reset Week {currentWeek}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="surface-panel p-5 rounded-2xl">
          <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-4">
            Weight & Measurements
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={weeklyEntry.weight}
                onChange={(e) => onFieldChange('weight', e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-[#8a7b69] mt-1">
                Auto-averaged from daily logs when available.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Chest (in)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weeklyEntry.chest}
                  onChange={(e) => onFieldChange('chest', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Waist (in)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weeklyEntry.waist}
                  onChange={(e) => onFieldChange('waist', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Hips (in)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weeklyEntry.hips}
                  onChange={(e) => onFieldChange('hips', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Thighs (in)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weeklyEntry.thighs}
                  onChange={(e) => onFieldChange('thighs', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Arms (in)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={weeklyEntry.arms}
                onChange={(e) => onFieldChange('arms', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="surface-panel p-5 rounded-2xl">
          <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-4">
            Nutrition & Activity
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                Daily Avg Calories
              </label>
              <input
                type="number"
                min="0"
                value={weeklyEntry.calories}
                onChange={(e) => onFieldChange('calories', e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-[#8a7b69] mt-1">
                Auto-filled from daily logs if you track calories.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                Workouts This Week
              </label>
              <input
                type="number"
                min="0"
                value={weeklyEntry.workouts}
                onChange={(e) => onFieldChange('workouts', e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-[#8a7b69] mt-1">
                Auto-counted from daily workouts.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Notes</label>
              <textarea
                value={weeklyEntry.notes}
                onChange={(e) => onFieldChange('notes', e.target.value)}
                className="textarea-field h-24"
                placeholder="How did this week go?"
              ></textarea>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#e7ded2]">
            <p className="section-label mb-3">Weekly Totals (from daily logs)</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-[#6a5b4a]">
              <div className="flex items-center justify-between rounded-xl bg-white/80 border border-[#e7ded2] px-3 py-2">
                <span>Protein</span>
                <span className="font-semibold text-[#2a2219]">{formatTotal(macroTotals.protein, 'g')}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/80 border border-[#e7ded2] px-3 py-2">
                <span>Carbs</span>
                <span className="font-semibold text-[#2a2219]">{formatTotal(macroTotals.carbs, 'g')}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/80 border border-[#e7ded2] px-3 py-2">
                <span>Fats</span>
                <span className="font-semibold text-[#2a2219]">{formatTotal(macroTotals.fats, 'g')}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/80 border border-[#e7ded2] px-3 py-2">
                <span>Water</span>
                <span className="font-semibold text-[#2a2219]">{formatTotal(macroTotals.water, 'oz')}</span>
              </div>
            </div>
            {!hasMacroData && (
              <p className="text-xs text-[#8a7b69] mt-3">
                Log daily macros to see weekly totals.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="surface-panel p-5 rounded-2xl mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-xl font-display font-semibold text-[#2a2219]">Progress Photos</h3>
            <p className="text-xs text-[#6a5b4a]">
              Track weekly visual changes. Add multiple angles if you like.
            </p>
          </div>
          <label className="btn btn-outline text-xs cursor-pointer">
            Add Photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onAddProgressPhotos}
              className="hidden"
            />
          </label>
        </div>
        {weeklyEntry.progressPhotos.length === 0 ? (
          <p className="text-sm text-[#6a5b4a]">Upload a weekly photo to track visual changes.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {weeklyEntry.progressPhotos.map((photo, index) => (
              <div
                key={`week-${currentWeek}-photo-${index}`}
                className="relative group overflow-hidden rounded-2xl border border-[#e7ded2] bg-white/80"
              >
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex(index)}
                  className="block w-full"
                >
                  <img
                    src={photo}
                    alt={`Week ${currentWeek} Photo ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveProgressPhoto(index)}
                  className="absolute top-2 right-2 rounded-full border border-[#e7ded2] bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#2a2219] opacity-0 transition group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {activePhotoIndex !== null &&
        weeklyEntry.progressPhotos[activePhotoIndex] &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setActivePhotoIndex(null)}
          >
            <div
              className="relative max-w-5xl w-full rounded-3xl bg-white/95 border border-[#e7ded2] p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-[#2a2219]">
                    Week {currentWeek} · Photo {activePhotoIndex + 1} of{' '}
                    {weeklyEntry.progressPhotos.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8a7b69]">Esc to close · ←/→ to navigate</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={zoomOut}
                      className="btn btn-outline btn-no-lift text-xs px-3"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="btn btn-outline btn-no-lift text-xs px-3"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <button
                      type="button"
                      onClick={zoomIn}
                      className="btn btn-outline btn-no-lift text-xs px-3"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIndex(null)}
                    className="btn btn-outline text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((index) =>
                      index !== null && index > 0 ? index - 1 : index
                    )
                  }
                  className={`absolute left-3 top-1/2 -translate-y-1/2 btn btn-soft btn-no-lift text-xs ${
                    activePhotoIndex === 0 ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  Prev
                </button>
                <div
                  className="overflow-hidden"
                  style={{ touchAction: 'none' }}
                  {...zoomBind}
                >
                  <img
                    src={weeklyEntry.progressPhotos[activePhotoIndex]}
                    alt={`Week ${currentWeek} Photo ${activePhotoIndex + 1}`}
                    className="w-full max-h-[70vh] object-contain rounded-2xl"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((index) =>
                      index !== null && index < weeklyEntry.progressPhotos.length - 1
                        ? index + 1
                    : index
                  )
                }
                  className={`absolute right-3 top-1/2 -translate-y-1/2 btn btn-soft btn-no-lift text-xs ${
                    activePhotoIndex === weeklyEntry.progressPhotos.length - 1
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  }`}
                >
                  Next
                </button>
              </div>
              {weeklyEntry.progressPhotos.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {weeklyEntry.progressPhotos.map((photo, index) => (
                    <button
                      key={`week-${currentWeek}-thumb-${index}`}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                      className={`h-16 w-20 rounded-xl border ${
                        activePhotoIndex === index
                          ? 'border-[#2a2219]'
                          : 'border-[#e7ded2]'
                      } overflow-hidden`}
                    >
                      <img
                        src={photo}
                        alt={`Week ${currentWeek} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
