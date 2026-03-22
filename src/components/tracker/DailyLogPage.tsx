import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Scale, Flame, Droplets, Dumbbell,
  Moon, Footprints, SmilePlus, Zap, Camera, Trash2, Tag, Plus, Minus,
} from 'lucide-react';
import ProgressRing from './ProgressRing';
import type { DailyData, DailyEntry, DailyProgress, GoalsState } from '../../lib/trackerTypes';
import { DAYS_PER_WEEK, TOTAL_WEEKS, WORKOUT_TAGS, WORKOUT_TYPES } from '../../lib/trackerData';
import { getDayLabel, getDateForDay, formatFullDateLabel } from '../../lib/trackerDates';

const MOOD_LABELS = ['', '😞', '😕', '😐', '🙂', '😄'];
const ENERGY_LABELS = ['', '💤', '😴', '⚡', '⚡⚡', '🔥'];

type Props = {
  goals: GoalsState;
  dailyData: DailyData;
  currentWeek: number;
  currentDay: number;
  todayProgress: DailyProgress;
  onUpdateDay: (week: number, day: number, entry: DailyEntry) => void;
  onNavigateDay: (week: number, day: number) => void;
  startDate: string;
  onAddMealPhoto: (week: number, day: number, file: File) => void;
  totalWeeks: number;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-white">
          {value > 0 ? value.toFixed(0) : '0'}
          {target > 0 && <span className="text-slate-500">/{target}g</span>}
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DailyLogPage({
  goals,
  dailyData,
  currentWeek,
  currentDay,
  todayProgress,
  onUpdateDay,
  onNavigateDay,
  startDate,
  onAddMealPhoto,
  totalWeeks,
}: Props) {
  const [photoTag, setPhotoTag] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const entry = dailyData[currentWeek]?.[currentDay] ?? {
    weight: '', calories: '', protein: '', carbs: '', fats: '', water: '',
    fiber: '', sugarAlcohols: '', alcohol: '', workout: false, workoutType: '',
    duration: '', workoutTemplate: '', workoutRpe: '', workoutTags: [], notes: '',
    mealPhotos: [], sleep: '', steps: '', mood: '', energy: '',
  };

  const update = (partial: Partial<DailyEntry>) =>
    onUpdateDay(currentWeek, currentDay, { ...entry, ...partial });

  const set = (field: keyof DailyEntry) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    update({ [field]: e.target.value } as Partial<DailyEntry>);

  const weekDays: { week: number; day: number; label: string; date: Date | null }[] = [];
  for (let d = 1; d <= DAYS_PER_WEEK; d++) {
    weekDays.push({
      week: currentWeek,
      day: d,
      label: getDayLabel(startDate, currentWeek, d),
      date: getDateForDay(startDate, currentWeek, d),
    });
  }

  const prevDay = () => {
    if (currentDay > 1) onNavigateDay(currentWeek, currentDay - 1);
    else if (currentWeek > 1) onNavigateDay(currentWeek - 1, DAYS_PER_WEEK);
  };

  const nextDay = () => {
    if (currentDay < DAYS_PER_WEEK) onNavigateDay(currentWeek, currentDay + 1);
    else if (currentWeek < totalWeeks) onNavigateDay(currentWeek + 1, 1);
  };

  const toggleTag = (tag: string) => {
    const tags = entry.workoutTags.includes(tag)
      ? entry.workoutTags.filter((t) => t !== tag)
      : [...entry.workoutTags, tag];
    update({ workoutTags: tags });
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAddMealPhoto(currentWeek, currentDay, file);
    e.target.value = '';
  };

  const removeMealPhoto = (idx: number) => {
    const photos = entry.mealPhotos.filter((_, i) => i !== idx);
    update({ mealPhotos: photos });
  };

  const unit = goals.unit === 'imperial' ? 'lbs' : 'kg';
  const waterUnit = goals.unit === 'imperial' ? 'fl oz' : 'L';
  const _dayDate = weekDays[currentDay - 1]?.date;
  const currentDateLabel = _dayDate ? formatFullDateLabel(_dayDate) : '';

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="eyebrow mb-1">Daily Log</div>
          <h1 className="page-title">{currentDateLabel}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost p-2" onClick={prevDay}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn-ghost p-2" onClick={nextDay}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day strip */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {weekDays.map((d) => {
          const dayEntry = dailyData[d.week]?.[d.day];
          const hasData = !!(dayEntry?.weight || dayEntry?.calories);
          const isActive = d.day === currentDay;
          return (
            <button
              key={d.day}
              onClick={() => onNavigateDay(d.week, d.day)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all ${
                isActive
                  ? 'border-violet-500/50 bg-violet-500/15 text-white'
                  : 'border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="text-xs font-medium">{d.label.split(' ')[0]}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${hasData ? 'bg-emerald-400' : 'bg-white/10'}`} />
            </button>
          );
        })}
      </div>

      {/* Progress rings (if targets set) */}
      {todayProgress.calories.target > 0 && (
        <div className="card p-5 mb-6">
          <div className="eyebrow mb-4">Today's Progress</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {[
              { label: 'Calories', value: todayProgress.calories.value, target: todayProgress.calories.target, pct: todayProgress.calories.pct, color: '#7c3aed', icon: <Flame size={13} /> },
              { label: 'Protein', value: todayProgress.protein.value, target: todayProgress.protein.target, pct: todayProgress.protein.pct, color: '#10b981', icon: <Zap size={13} /> },
              { label: 'Carbs', value: todayProgress.carbs.value, target: todayProgress.carbs.target, pct: todayProgress.carbs.pct, color: '#f59e0b', icon: <Zap size={13} /> },
              { label: 'Fats', value: todayProgress.fats.value, target: todayProgress.fats.target, pct: todayProgress.fats.pct, color: '#f43f5e', icon: <Zap size={13} /> },
              { label: 'Water', value: todayProgress.water.value, target: todayProgress.water.target, pct: todayProgress.water.pct, color: '#3b82f6', icon: <Droplets size={13} /> },
              { label: 'Steps', value: todayProgress.steps.value, target: todayProgress.steps.target, pct: todayProgress.steps.pct, color: '#06b6d4', icon: <Footprints size={13} /> },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <ProgressRing value={item.value} max={item.target || 1} size={64} strokeWidth={6} color={item.color}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                </ProgressRing>
                <div className="text-center">
                  <div className="font-mono text-xs font-semibold text-white">
                    {item.value > 0 ? item.value.toFixed(0) : '—'}
                  </div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Body metrics */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={16} className="text-violet-400" />
            <span className="section-heading text-base">Body Metrics</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Weight (${unit})`}>
              <input className="dark-input" type="number" step="0.1" placeholder="0.0" value={entry.weight} onChange={set('weight')} />
            </Field>
            <Field label="Body Fat (%)">
              <input className="dark-input" type="number" step="0.1" placeholder="—" value="" onChange={() => {}} disabled />
            </Field>
          </div>
        </div>

        {/* Nutrition */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-violet-400" />
            <span className="section-heading text-base">Nutrition</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Calories (kcal)">
              <input className="dark-input" type="number" placeholder="0" value={entry.calories} onChange={set('calories')} />
            </Field>
            <Field label={`Water (${waterUnit})`}>
              <input className="dark-input" type="number" step="0.1" placeholder="0.0" value={entry.water} onChange={set('water')} />
            </Field>
          </div>

          {/* Macro progress bars */}
          {(goals.targetProtein || goals.targetCarbs || goals.targetFats) && (
            <div className="space-y-2 mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <MacroBar label="Protein" value={parseFloat(entry.protein) || 0} target={parseFloat(goals.targetProtein) || 0} color="#10b981" />
              <MacroBar label="Carbs" value={parseFloat(entry.carbs) || 0} target={parseFloat(goals.targetCarbs) || 0} color="#f59e0b" />
              <MacroBar label="Fats" value={parseFloat(entry.fats) || 0} target={parseFloat(goals.targetFats) || 0} color="#f43f5e" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Field label="Protein (g)">
              <input className="dark-input" type="number" placeholder="0" value={entry.protein} onChange={set('protein')} />
            </Field>
            <Field label="Carbs (g)">
              <input className="dark-input" type="number" placeholder="0" value={entry.carbs} onChange={set('carbs')} />
            </Field>
            <Field label="Fats (g)">
              <input className="dark-input" type="number" placeholder="0" value={entry.fats} onChange={set('fats')} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <Field label="Fiber (g)">
              <input className="dark-input" type="number" placeholder="0" value={entry.fiber} onChange={set('fiber')} />
            </Field>
            <Field label="Sugar Alcohols (g)">
              <input className="dark-input" type="number" placeholder="0" value={entry.sugarAlcohols} onChange={set('sugarAlcohols')} />
            </Field>
            <Field label="Alcohol (g)">
              <input className="dark-input" type="number" placeholder="0" value={entry.alcohol} onChange={set('alcohol')} />
            </Field>
          </div>
        </div>

        {/* Workout */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell size={16} className="text-emerald-400" />
            <span className="section-heading text-base">Workout</span>
            <div className="ml-auto">
              <button
                className={`relative w-11 h-6 rounded-full transition-colors ${entry.workout ? 'bg-emerald-500' : 'bg-white/10'}`}
                onClick={() => update({ workout: !entry.workout })}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${entry.workout ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          </div>

          {entry.workout && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <select className="dark-select" value={entry.workoutType} onChange={set('workoutType')}>
                    <option value="">Select type…</option>
                    {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Duration (min)">
                  <input className="dark-input" type="number" placeholder="45" value={entry.duration} onChange={set('duration')} />
                </Field>
              </div>
              <Field label="RPE (1–10)">
                <input className="dark-input" type="number" min="1" max="10" placeholder="7" value={entry.workoutRpe} onChange={set('workoutRpe')} />
              </Field>
              <div>
                <label className="field-label">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {WORKOUT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      className={`tag-pill ${entry.workoutTags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Notes">
                <textarea className="dark-textarea" placeholder="Sets, reps, PRs…" value={entry.workoutTemplate} onChange={set('workoutTemplate')} style={{ minHeight: 60 }} />
              </Field>
            </div>
          )}
        </div>

        {/* Lifestyle */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Moon size={16} className="text-indigo-400" />
            <span className="section-heading text-base">Lifestyle</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sleep (hours)">
                <input className="dark-input" type="number" step="0.5" placeholder="8" value={entry.sleep} onChange={set('sleep')} />
              </Field>
              <Field label="Steps">
                <input className="dark-input" type="number" placeholder="8000" value={entry.steps} onChange={set('steps')} />
              </Field>
            </div>
            <div>
              <label className="field-label">Mood</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`mood-btn ${entry.mood === String(n) ? 'active' : ''}`}
                    onClick={() => update({ mood: entry.mood === String(n) ? '' : String(n) })}
                    title={MOOD_LABELS[n]}
                  >
                    <span className="text-lg">{MOOD_LABELS[n]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Energy Level</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`mood-btn ${entry.energy === String(n) ? 'active' : ''}`}
                    onClick={() => update({ energy: entry.energy === String(n) ? '' : String(n) })}
                    title={`Energy ${n}`}
                  >
                    <span className="text-sm font-bold">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <div className="section-heading text-base mb-3">Notes</div>
          <textarea
            className="dark-textarea w-full"
            placeholder="How did today feel? Any wins or struggles…"
            value={entry.notes}
            onChange={set('notes')}
            style={{ minHeight: 80 }}
          />
        </div>

        {/* Meal photos */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-amber-400" />
              <span className="section-heading text-base">Meal Photos</span>
            </div>
            <button className="btn-ghost text-xs" onClick={() => photoInputRef.current?.click()}>
              <Plus size={14} /> Add Photo
            </button>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAdd} />

          {entry.mealPhotos.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No photos yet</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {entry.mealPhotos.map((photo, i) => (
                <div key={i} className="relative group">
                  <img
                    src={photo.src}
                    alt={photo.tag || 'Meal'}
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer"
                    onClick={() => setLightboxSrc(photo.src)}
                  />
                  {photo.tag && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-white px-1.5 py-0.5 rounded-b-lg truncate">
                      {photo.tag}
                    </div>
                  )}
                  <button
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white transition-opacity"
                    onClick={() => removeMealPhoto(i)}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="Meal" className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
