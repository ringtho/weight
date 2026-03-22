import React, { useRef, useState } from 'react';
import { Camera, Trash2, RotateCcw, Ruler, Scale, Dumbbell, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { DailyData, GoalsState, MacroTotals, WeeklyData, WeeklyEntry } from '../../lib/trackerTypes';
import { TOTAL_WEEKS } from '../../lib/trackerData';
import useImageZoom from './useImageZoom';

type Props = {
  goals: GoalsState;
  weeklyData: WeeklyData;
  dailyData: DailyData;
  currentWeek: number;
  weeklyMacroTotals: MacroTotals;
  onUpdateWeek: (week: number, entry: WeeklyEntry) => void;
  onSelectWeek: (week: number) => void;
  onResetWeek: (week: number) => void;
  onAddProgressPhoto: (week: number, file: File) => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function PhotoViewer({ src, onRemove }: { src: string; onRemove: () => void }) {
  const { zoom, offset, bind } = useImageZoom();
  const isZoomed = zoom > 1;
  return (
    <div
      className="relative group rounded-xl overflow-hidden aspect-square bg-white/5"
      style={{ touchAction: 'none' }}
      {...bind}
    >
      <img
        src={src}
        alt="Progress"
        className="w-full h-full object-cover"
        draggable={false}
        style={{
          transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
          transformOrigin: 'center',
          cursor: isZoomed ? 'grab' : 'zoom-in',
          transition: isZoomed ? 'none' : 'transform 0.15s ease',
        }}
      />
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={onRemove}
      >
        <Trash2 size={12} />
      </button>
      {!isZoomed && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={14} className="text-white drop-shadow" />
        </div>
      )}
    </div>
  );
}

export default function WeeklyCheckinPage({
  goals,
  weeklyData,
  dailyData,
  currentWeek,
  weeklyMacroTotals,
  onUpdateWeek,
  onSelectWeek,
  onResetWeek,
  onAddProgressPhoto,
}: Props) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const entry = weeklyData[currentWeek];

  const update = (partial: Partial<WeeklyEntry>) =>
    onUpdateWeek(currentWeek, { ...entry, ...partial });

  const set = (field: keyof WeeklyEntry) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      update({ [field]: e.target.value } as Partial<WeeklyEntry>);

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAddProgressPhoto(currentWeek, file);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    const photos = entry.progressPhotos.filter((_, i) => i !== idx);
    update({ progressPhotos: photos });
  };

  const unit = goals.unit === 'imperial' ? 'lbs' : 'kg';
  const mUnit = goals.unit === 'imperial' ? 'in' : 'cm';

  // Count daily workouts for this week
  const dailyWorkouts = Object.values(dailyData[currentWeek] ?? {}).filter((d) => d.workout).length;

  // Auto-avg weight from daily logs
  const dailyWeights = Object.values(dailyData[currentWeek] ?? {})
    .map((d) => parseFloat(d.weight))
    .filter((v) => !Number.isNaN(v));
  const avgWeight = dailyWeights.length > 0
    ? (dailyWeights.reduce((a, b) => a + b, 0) / dailyWeights.length).toFixed(1)
    : null;

  // Auto-avg calories from daily logs
  const dailyCals = Object.values(dailyData[currentWeek] ?? {})
    .map((d) => parseFloat(d.calories))
    .filter((v) => !Number.isNaN(v));
  const avgCals = dailyCals.length > 0
    ? Math.round(dailyCals.reduce((a, b) => a + b, 0) / dailyCals.length)
    : null;

  const hasWeeksData = (w: number) =>
    !!(weeklyData[w]?.weight || weeklyData[w]?.waist || weeklyData[w]?.progressPhotos?.length);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="eyebrow mb-1">Weekly Check-in</div>
          <h1 className="page-title">Week {currentWeek}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost p-2" onClick={() => onSelectWeek(Math.max(1, currentWeek - 1))}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn-ghost p-2" onClick={() => onSelectWeek(Math.min(goals.totalWeeks, currentWeek + 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {Array.from({ length: goals.totalWeeks }, (_, i) => i + 1).map((w) => (
          <button
            key={w}
            className={`week-pill ${w === currentWeek ? 'active' : ''} ${hasWeeksData(w) ? 'has-data' : ''}`}
            onClick={() => onSelectWeek(w)}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weight & Body Fat */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={16} className="text-violet-400" />
            <span className="section-heading text-base">Weight & Body Composition</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Weight (${unit})`}>
              <input
                className="dark-input"
                type="number"
                step="0.1"
                placeholder={avgWeight ? `Avg: ${avgWeight}` : '0.0'}
                value={entry.weight}
                onChange={set('weight')}
              />
              {avgWeight && !entry.weight && (
                <button
                  className="text-xs text-violet-400 mt-1 hover:underline"
                  onClick={() => update({ weight: avgWeight })}
                >
                  Use daily avg: {avgWeight}
                </button>
              )}
            </Field>
            <Field label="Body Fat (%)">
              <input className="dark-input" type="number" step="0.1" placeholder="—" value={entry.bodyFat} onChange={set('bodyFat')} />
            </Field>
            <Field label="Muscle Mass (kg)">
              <input className="dark-input" type="number" step="0.1" placeholder="—" value={entry.muscleMass} onChange={set('muscleMass')} />
            </Field>
          </div>
        </div>

        {/* Measurements */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Ruler size={16} className="text-indigo-400" />
            <span className="section-heading text-base">Measurements ({mUnit})</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: 'chest' as const, label: 'Chest' },
              { field: 'waist' as const, label: 'Waist' },
              { field: 'hips' as const, label: 'Hips' },
              { field: 'thighs' as const, label: 'Thighs' },
              { field: 'arms' as const, label: 'Arms' },
            ].map(({ field, label }) => (
              <Field key={field} label={label}>
                <input className="dark-input" type="number" step="0.1" placeholder="0.0" value={entry[field]} onChange={set(field)} />
              </Field>
            ))}
          </div>
        </div>

        {/* Nutrition & Activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell size={16} className="text-emerald-400" />
            <span className="section-heading text-base">Nutrition & Activity</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Avg Daily Calories">
              <input
                className="dark-input"
                type="number"
                placeholder={avgCals ? String(avgCals) : '—'}
                value={entry.calories}
                onChange={set('calories')}
              />
              {avgCals && !entry.calories && (
                <button
                  className="text-xs text-violet-400 mt-1 hover:underline"
                  onClick={() => update({ calories: String(avgCals) })}
                >
                  Use daily avg: {avgCals}
                </button>
              )}
            </Field>
            <Field label="Workouts This Week">
              <input
                className="dark-input"
                type="number"
                placeholder={dailyWorkouts > 0 ? String(dailyWorkouts) : '0'}
                value={entry.workouts}
                onChange={set('workouts')}
              />
              {dailyWorkouts > 0 && !entry.workouts && (
                <button
                  className="text-xs text-violet-400 mt-1 hover:underline"
                  onClick={() => update({ workouts: String(dailyWorkouts) })}
                >
                  Auto: {dailyWorkouts} workouts
                </button>
              )}
            </Field>
          </div>

          {/* Weekly macro totals */}
          {weeklyMacroTotals.entryCount > 0 && (
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="eyebrow mb-2">Weekly Totals (from daily logs)</div>
              {[
                { label: 'Protein', value: weeklyMacroTotals.protein, unit: 'g', color: '#10b981' },
                { label: 'Carbs', value: weeklyMacroTotals.carbs, unit: 'g', color: '#f59e0b' },
                { label: 'Fats', value: weeklyMacroTotals.fats, unit: 'g', color: '#f43f5e' },
                { label: 'Water', value: weeklyMacroTotals.water, unit: goals.unit === 'imperial' ? 'oz' : 'L', color: '#3b82f6' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span style={{ color: item.color }} className="font-medium">{item.label}</span>
                  <span className="font-mono text-white">
                    {item.value.toFixed(1)} {item.unit}
                    {weeklyMacroTotals.entryCount > 0 && (
                      <span className="text-slate-500 text-xs ml-1">
                        / {weeklyMacroTotals.entryCount}d
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card p-5">
          <div className="section-heading text-base mb-3">Week Notes</div>
          <textarea
            className="dark-textarea w-full"
            placeholder="How did this week go? Any wins, challenges, or observations…"
            value={entry.notes}
            onChange={set('notes')}
            style={{ minHeight: 120 }}
          />
        </div>

        {/* Progress Photos */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-amber-400" />
              <span className="section-heading text-base">Progress Photos</span>
            </div>
            <button className="btn-secondary text-xs" onClick={() => photoInputRef.current?.click()}>
              <Camera size={13} /> Add Photo
            </button>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} />

          {entry.progressPhotos.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-xl border-dashed text-slate-500 cursor-pointer hover:text-slate-400 transition-colors"
              style={{ border: '1px dashed rgba(255,255,255,0.12)' }}
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={32} className="mb-2 opacity-40" />
              <span className="text-sm">Click to add a progress photo</span>
              <span className="text-xs text-slate-600 mt-1">Great for tracking visual changes</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {entry.progressPhotos.map((src, i) => (
                <PhotoViewer key={i} src={src} onRemove={() => removePhoto(i)} />
              ))}
              <button
                className="aspect-square rounded-xl border-dashed flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                style={{ border: '1px dashed rgba(255,255,255,0.12)' }}
                onClick={() => photoInputRef.current?.click()}
              >
                <Camera size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reset week */}
      <div className="mt-6 flex justify-end">
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-rose-400">Reset all data for Week {currentWeek}?</span>
            <button className="btn-danger text-xs" onClick={() => { onResetWeek(currentWeek); setConfirmReset(false); }}>
              Yes, reset
            </button>
            <button className="btn-secondary text-xs" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn-ghost text-xs text-slate-500 hover:text-rose-400" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={13} /> Reset Week {currentWeek}
          </button>
        )}
      </div>
    </div>
  );
}
