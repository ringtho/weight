import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CaloriesChartPoint, DailyData, DailyEntry } from '../../lib/trackerTypes';
import { DAYS_PER_WEEK } from '../../lib/trackerData';
import { getDayLabel, getWeekDayFromDate } from '../../lib/trackerDates';
import DailyCalendar from './DailyCalendar';
import useImageZoom from './useImageZoom';

type DailyViewProps = {
  currentWeek: number;
  currentDay: number;
  startDate: string;
  dailyData: DailyData;
  dailyEntry: DailyEntry;
  calorieChartData: CaloriesChartPoint[];
  onSelectDay: (day: number) => void;
  onSelectWeekDay: (week: number, day: number) => void;
  onJumpToToday: () => void;
  onFieldChange: (field: keyof DailyEntry, value: DailyEntry[keyof DailyEntry]) => void;
  onAddMealPhotos: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveMealPhoto: (index: number) => void;
  onUpdateMealPhotoTag: (index: number, tag: string) => void;
  onResetDay: () => void;
};

export default function DailyView({
  currentWeek,
  currentDay,
  startDate,
  dailyData,
  dailyEntry,
  calorieChartData,
  onSelectDay,
  onSelectWeekDay,
  onJumpToToday,
  onFieldChange,
  onAddMealPhotos,
  onRemoveMealPhoto,
  onUpdateMealPhotoTag,
  onResetDay
}: DailyViewProps) {
  const resolveDayLabel = (dayIndex: number) =>
    getDayLabel(startDate, currentWeek, dayIndex);
  const todayPosition = getWeekDayFromDate(startDate, new Date());
  const showJumpToToday =
    todayPosition &&
    (todayPosition.week !== currentWeek || todayPosition.day !== currentDay);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [photoQuery, setPhotoQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');
  const [workoutTagInput, setWorkoutTagInput] = useState('');
  const {
    zoom,
    offset,
    zoomIn,
    zoomOut,
    resetZoom,
    bind: zoomBind
  } = useImageZoom();

  const tagOptions = useMemo(() => {
    const tags = dailyEntry.mealPhotos
      .map((photo) => photo.tag.trim())
      .filter(Boolean);
    return Array.from(new Set(tags));
  }, [dailyEntry.mealPhotos]);
  const normalizedQuery = photoQuery.trim().toLowerCase();
  const filteredPhotos = useMemo(() => {
    return dailyEntry.mealPhotos
      .map((photo, index) => ({ photo, index }))
      .filter(({ photo }) => {
        const tagValue = photo.tag.trim().toLowerCase();
        const matchesTag = activeTag === 'all' || tagValue === activeTag.toLowerCase();
        const matchesQuery = !normalizedQuery || tagValue.includes(normalizedQuery);
        return matchesTag && matchesQuery;
      });
  }, [activeTag, dailyEntry.mealPhotos, normalizedQuery]);
  const filteredIndices = filteredPhotos.map((item) => item.index);

  const workoutTemplates = [
    { id: 'strength-45', label: 'Strength Session (45 min)', type: 'Strength', duration: '45', tags: ['Strength'] },
    { id: 'hiit-25', label: 'HIIT Sprint (25 min)', type: 'HIIT', duration: '25', tags: ['HIIT', 'Cardio'] },
    { id: 'cardio-35', label: 'Steady Cardio (35 min)', type: 'Cardio', duration: '35', tags: ['Cardio'] },
    { id: 'run-30', label: 'Run (30 min)', type: 'Run', duration: '30', tags: ['Cardio'] },
    { id: 'mobility-20', label: 'Mobility + Stretch (20 min)', type: 'Mobility', duration: '20', tags: ['Mobility', 'Recovery'] },
    { id: 'yoga-30', label: 'Yoga Flow (30 min)', type: 'Yoga', duration: '30', tags: ['Mobility'] }
  ];
  const workoutTagOptions = ['Strength', 'Cardio', 'HIIT', 'Endurance', 'Mobility', 'Recovery'];
  const workoutTags = dailyEntry.workoutTags ?? [];

  const handleTemplateSelect = (value: string) => {
    onFieldChange('workoutTemplate', value);
    const selected = workoutTemplates.find((template) => template.id === value);
    if (!selected) return;
    onFieldChange('workoutType', selected.type);
    onFieldChange('duration', selected.duration);
    const mergedTags = Array.from(
      new Set([...workoutTags, ...selected.tags])
    );
    onFieldChange('workoutTags', mergedTags);
  };

  const toggleWorkoutTag = (tag: string) => {
    const normalized = tag.toLowerCase();
    const exists = workoutTags.some((item) => item.toLowerCase() === normalized);
    const nextTags = exists
      ? workoutTags.filter((item) => item.toLowerCase() !== normalized)
      : [...workoutTags, tag];
    onFieldChange('workoutTags', nextTags);
  };

  const handleAddWorkoutTag = () => {
    const trimmed = workoutTagInput.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    if (workoutTags.some((item) => item.toLowerCase() === normalized)) {
      setWorkoutTagInput('');
      return;
    }
    onFieldChange('workoutTags', [...workoutTags, trimmed]);
    setWorkoutTagInput('');
  };
  const macroEstimate = useMemo(() => {
    const protein = parseFloat(dailyEntry.protein);
    const carbs = parseFloat(dailyEntry.carbs);
    const fats = parseFloat(dailyEntry.fats);
    const fiber = parseFloat(dailyEntry.fiber);
    const sugarAlcohols = parseFloat(dailyEntry.sugarAlcohols);
    const alcohol = parseFloat(dailyEntry.alcohol);
    const values = [protein, carbs, fats, fiber, sugarAlcohols, alcohol];
    const hasAny = values.some((value) => Number.isFinite(value));
    if (!hasAny) return null;
    const p = Number.isFinite(protein) ? protein : 0;
    const c = Number.isFinite(carbs) ? carbs : 0;
    const f = Number.isFinite(fats) ? fats : 0;
    const fi = Number.isFinite(fiber) ? fiber : 0;
    const sa = Number.isFinite(sugarAlcohols) ? sugarAlcohols : 0;
    const al = Number.isFinite(alcohol) ? alcohol : 0;
    const netCarbs = Math.max(c - fi - sa, 0);
    return Math.round(p * 4 + netCarbs * 4 + f * 9 + al * 7 + sa * 2);
  }, [
    dailyEntry.carbs,
    dailyEntry.fats,
    dailyEntry.protein,
    dailyEntry.fiber,
    dailyEntry.sugarAlcohols,
    dailyEntry.alcohol
  ]);

  useEffect(() => {
    if (
      activePhotoIndex !== null &&
      activePhotoIndex >= dailyEntry.mealPhotos.length
    ) {
      setActivePhotoIndex(null);
    }
  }, [activePhotoIndex, dailyEntry.mealPhotos.length]);

  useEffect(() => {
    if (activePhotoIndex !== null) {
      resetZoom();
    }
  }, [activePhotoIndex, resetZoom]);

  useEffect(() => {
    if (activeTag !== 'all' && !tagOptions.includes(activeTag)) {
      setActiveTag('all');
    }
  }, [activeTag, tagOptions]);

  useEffect(() => {
    if (activePhotoIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActivePhotoIndex(null);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const currentIndex = filteredIndices.indexOf(activePhotoIndex);
        const prevIndex = currentIndex > 0 ? filteredIndices[currentIndex - 1] : null;
        if (prevIndex !== null) {
          setActivePhotoIndex(prevIndex);
        }
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const currentIndex = filteredIndices.indexOf(activePhotoIndex);
        const nextIndex =
          currentIndex >= 0 && currentIndex < filteredIndices.length - 1
            ? filteredIndices[currentIndex + 1]
            : null;
        if (nextIndex !== null) {
          setActivePhotoIndex(nextIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, filteredIndices]);

  return (
    <>
      <div className="mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <label className="text-lg font-semibold text-[#2a2219]">Select Day</label>
            <p className="text-xs text-[#6a5b4a] mt-1">
              Week {currentWeek} · {resolveDayLabel(currentDay)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showJumpToToday && (
              <button onClick={onJumpToToday} className="btn btn-soft text-xs">
                Jump to Today
              </button>
            )}
            <button onClick={onResetDay} className="btn btn-outline text-xs">
              Reset {resolveDayLabel(currentDay)}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 mt-2">
          {[...Array(DAYS_PER_WEEK)].map((_, i) => {
            const dayIndex = i + 1;
            const isToday =
              todayPosition &&
              todayPosition.week === currentWeek &&
              todayPosition.day === dayIndex;
            return (
              <button
                key={dayIndex}
                onClick={() => onSelectDay(dayIndex)}
                className={`px-3 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                  currentDay === dayIndex
                    ? 'bg-[#2a2219] text-white'
                    : 'bg-white/85 text-[#6a5b4a] hover:bg-white border border-[#e7ded2]'
                } ${isToday ? 'ring-2 ring-[#b0895a]/70 ring-offset-1 ring-offset-[#f6f0e7]' : ''}`}
              >
                {resolveDayLabel(dayIndex)}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#8a7b69] mt-2">Shortcuts: ←/→ day · T today</p>
      </div>

      <DailyCalendar
        startDate={startDate}
        currentWeek={currentWeek}
        currentDay={currentDay}
        dailyData={dailyData}
        onSelectDay={onSelectWeekDay}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="surface-panel p-5 rounded-2xl">
          <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-4">Daily Metrics</h3>
          <p className="text-xs text-[#8a7b69] mb-4">
            Log daily stats to auto-fill weekly averages.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={dailyEntry.weight}
                onChange={(e) => onFieldChange('weight', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Calories</label>
              <input
                type="number"
                min="0"
                value={dailyEntry.calories}
                onChange={(e) => onFieldChange('calories', e.target.value)}
                className="input-field"
              />
              {macroEstimate !== null && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#6a5b4a]">
                  <span>Estimated from macros: {macroEstimate} kcal</span>
                  <button
                    type="button"
                    onClick={() => onFieldChange('calories', String(macroEstimate))}
                    className="btn btn-outline btn-no-lift text-[11px] px-3 py-1"
                  >
                    Use estimate
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  value={dailyEntry.protein}
                  onChange={(e) => onFieldChange('protein', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  value={dailyEntry.carbs}
                  onChange={(e) => onFieldChange('carbs', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Fats (g)</label>
                <input
                  type="number"
                  min="0"
                  value={dailyEntry.fats}
                  onChange={(e) => onFieldChange('fats', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Fiber (g)</label>
                <input
                  type="number"
                  min="0"
                  value={dailyEntry.fiber}
                  onChange={(e) => onFieldChange('fiber', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                  Sugar Alcohols (g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={dailyEntry.sugarAlcohols}
                  onChange={(e) => onFieldChange('sugarAlcohols', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Alcohol (g)</label>
                <input
                  type="number"
                  min="0"
                  value={dailyEntry.alcohol}
                  onChange={(e) => onFieldChange('alcohol', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Water (oz)</label>
              <input
                type="number"
                min="0"
                value={dailyEntry.water}
                onChange={(e) => onFieldChange('water', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="surface-panel p-5 rounded-2xl">
          <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-4">Workout</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dailyEntry.workout}
                onChange={(e) => onFieldChange('workout', e.target.checked)}
                className="w-5 h-5"
              />
              <label className="text-sm font-medium text-[#6a5b4a]">Workout completed</label>
            </div>
            {dailyEntry.workout && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                    Workout Template
                  </label>
                  <select
                    value={dailyEntry.workoutTemplate}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Custom</option>
                    {workoutTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                    Workout Type
                  </label>
                  <input
                    type="text"
                    value={dailyEntry.workoutType}
                    onChange={(e) => onFieldChange('workoutType', e.target.value)}
                    placeholder="e.g., Cardio, Weights"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6a5b4a] mb-1">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dailyEntry.duration}
                    onChange={(e) => onFieldChange('duration', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6a5b4a] mb-2">
                    Intensity (RPE)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={dailyEntry.workoutRpe || '5'}
                      onChange={(e) => onFieldChange('workoutRpe', e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={dailyEntry.workoutRpe}
                      onChange={(e) => onFieldChange('workoutRpe', e.target.value)}
                      className="input-field w-20"
                      placeholder="1-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6a5b4a] mb-2">
                    Workout Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {workoutTagOptions.map((tag) => {
                      const isActive = workoutTags.some(
                        (item) => item.toLowerCase() === tag.toLowerCase()
                      );
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleWorkoutTag(tag)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                            isActive
                              ? 'bg-[#2a2219] text-white border-[#2a2219]'
                              : 'bg-white/80 text-[#6a5b4a] border-[#e7ded2]'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={workoutTagInput}
                      onChange={(e) => setWorkoutTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddWorkoutTag();
                        }
                      }}
                      placeholder="Add custom tag"
                      className="input-field text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddWorkoutTag}
                      className="btn btn-outline btn-no-lift text-xs"
                    >
                      Add tag
                    </button>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-[#6a5b4a] mb-1">Notes</label>
              <textarea
                value={dailyEntry.notes}
                onChange={(e) => onFieldChange('notes', e.target.value)}
                className="textarea-field h-24"
                placeholder="How was today?"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-panel p-5 rounded-2xl mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-xl font-display font-semibold text-[#2a2219]">Meal Photos</h3>
            <p className="text-xs text-[#6a5b4a]">
              Saved with {resolveDayLabel(currentDay)} in week {currentWeek}.
            </p>
          </div>
          <label className="btn btn-outline text-xs cursor-pointer">
            Add Photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onAddMealPhotos}
              className="hidden"
            />
          </label>
        </div>
        {dailyEntry.mealPhotos.length === 0 ? (
          <p className="text-sm text-[#6a5b4a]">No meal photos yet.</p>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTag('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                    activeTag === 'all'
                      ? 'bg-[#2a2219] text-white border-[#2a2219]'
                      : 'bg-white/80 text-[#6a5b4a] border-[#e7ded2]'
                  }`}
                >
                  All
                </button>
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      activeTag === tag
                        ? 'bg-[#2a2219] text-white border-[#2a2219]'
                        : 'bg-white/80 text-[#6a5b4a] border-[#e7ded2]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={photoQuery}
                  onChange={(e) => setPhotoQuery(e.target.value)}
                  placeholder="Search tags"
                  className="input-field text-xs"
                />
                {photoQuery && (
                  <button
                    type="button"
                    onClick={() => setPhotoQuery('')}
                    className="btn btn-outline text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {filteredPhotos.length === 0 ? (
              <p className="text-sm text-[#6a5b4a]">No photos match this filter.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredPhotos.map(({ photo, index }) => (
              <div
                key={`${currentWeek}-${currentDay}-meal-${index}`}
                className="relative group overflow-hidden rounded-2xl border border-[#e7ded2] bg-white/80"
              >
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex(index)}
                  className="block w-full"
                >
                  <img
                    src={photo.src}
                    alt={`Meal ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveMealPhoto(index)}
                  className="absolute top-2 right-2 rounded-full border border-[#e7ded2] bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#2a2219] opacity-0 transition group-hover:opacity-100"
                >
                  Remove
                </button>
                <div className="p-2 border-t border-[#e7ded2] bg-white/90">
                  <input
                    type="text"
                    value={photo.tag}
                    onChange={(e) => onUpdateMealPhotoTag(index, e.target.value)}
                    placeholder="Add a tag (e.g., Breakfast)"
                    className="input-field text-xs"
                  />
                </div>
              </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {activePhotoIndex !== null &&
        dailyEntry.mealPhotos[activePhotoIndex] &&
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
                    Meal {activePhotoIndex + 1} of {dailyEntry.mealPhotos.length}
                  </p>
                  {dailyEntry.mealPhotos[activePhotoIndex].tag && (
                    <p className="text-xs text-[#6a5b4a]">
                      {dailyEntry.mealPhotos[activePhotoIndex].tag}
                    </p>
                  )}
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
                  onClick={() => {
                    const currentIndex = filteredIndices.indexOf(activePhotoIndex);
                    const prevIndex =
                      currentIndex > 0 ? filteredIndices[currentIndex - 1] : null;
                    if (prevIndex !== null) {
                      setActivePhotoIndex(prevIndex);
                    }
                  }}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 btn btn-soft btn-no-lift text-xs ${
                    filteredIndices.indexOf(activePhotoIndex) <= 0
                      ? 'opacity-50 pointer-events-none'
                      : ''
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
                    src={dailyEntry.mealPhotos[activePhotoIndex].src}
                    alt={`Meal ${activePhotoIndex + 1}`}
                    className="w-full max-h-[70vh] object-contain rounded-2xl"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = filteredIndices.indexOf(activePhotoIndex);
                    const nextIndex =
                      currentIndex >= 0 && currentIndex < filteredIndices.length - 1
                        ? filteredIndices[currentIndex + 1]
                        : null;
                    if (nextIndex !== null) {
                      setActivePhotoIndex(nextIndex);
                    }
                  }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 btn btn-soft btn-no-lift text-xs ${
                    filteredIndices.indexOf(activePhotoIndex) === filteredIndices.length - 1
                      ? 'opacity-50 pointer-events-none'
                      : ''
                  }`}
                >
                  Next
                </button>
              </div>
              {filteredPhotos.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {filteredPhotos.map(({ photo, index }) => (
                    <button
                      key={`${currentWeek}-${currentDay}-thumb-${index}`}
                      type="button"
                      onClick={() => setActivePhotoIndex(index)}
                      className={`h-16 w-20 rounded-xl border ${
                        activePhotoIndex === index
                          ? 'border-[#2a2219]'
                          : 'border-[#e7ded2]'
                      } overflow-hidden`}
                    >
                      <img
                        src={photo.src}
                        alt={photo.tag || 'Meal thumbnail'}
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

      {calorieChartData.length > 0 ? (
        <div className="surface-panel p-5 rounded-2xl mb-6">
          <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-4">
            Week {currentWeek} Daily Calories
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={calorieChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" angle={-25} textAnchor="end" height={50} interval={0} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calories" fill="#8c6a3f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="surface-panel p-5 rounded-2xl mb-6">
          <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-2">
            Week {currentWeek} Daily Calories
          </h3>
          <p className="text-sm text-[#6a5b4a]">Add daily calories to see the chart.</p>
        </div>
      )}
    </>
  );
}
