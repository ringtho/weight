import React, { useState } from 'react';
import {
  Target, User, Scale, Ruler, Calculator, Download, Upload, RotateCcw,
  Flame, Zap, Droplets, Footprints, Moon, ChevronDown,
} from 'lucide-react';
import type { GoalsState } from '../../lib/trackerTypes';

type Props = {
  goals: GoalsState;
  onUpdateGoals: (g: GoalsState) => void;
  onExportTxt: () => void;
  onBackupJson: () => void;
  onImportJson: () => void;
  onResetAll: () => void;
  tdee: number | null;
};

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-violet-400">{icon}</span>
        <span className="section-heading text-base">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function SettingsPage({ goals, onUpdateGoals, onExportTxt, onBackupJson, onImportJson, onResetAll, tdee }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);

  const set = <K extends keyof GoalsState>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onUpdateGoals({ ...goals, [field]: e.target.value });

  const unit = goals.unit;
  const weightUnit = unit === 'imperial' ? 'lbs' : 'kg';
  const heightUnit = unit === 'imperial' ? 'inches' : 'cm';
  const waterUnit = unit === 'imperial' ? 'fl oz' : 'L';

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="eyebrow mb-1">Settings</div>
        <h1 className="page-title">Program & Goals</h1>
      </div>

      <div className="flex flex-col gap-5">
        {/* Units */}
        <SectionCard title="Units & Display" icon={<Ruler size={16} />}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit System">
              <select className="dark-select" value={goals.unit} onChange={set('unit')}>
                <option value="metric">Metric (kg, cm, L)</option>
                <option value="imperial">Imperial (lbs, in, fl oz)</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Body Profile */}
        <SectionCard title="Body Profile" icon={<User size={16} />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label={`Height (${heightUnit})`}>
              <input className="dark-input" type="number" step="0.1" placeholder={unit === 'metric' ? '170' : '67'} value={goals.height} onChange={set('height')} />
            </Field>
            <Field label="Age">
              <input className="dark-input" type="number" min="10" max="120" placeholder="30" value={goals.age} onChange={set('age')} />
            </Field>
            <Field label="Sex">
              <select className="dark-select" value={goals.sex} onChange={set('sex')}>
                <option value="">Not set</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Activity Level">
              <select className="dark-select" value={goals.activityLevel} onChange={set('activityLevel')}>
                <option value="sedentary">Sedentary (desk job)</option>
                <option value="light">Light (1-3 days/wk)</option>
                <option value="moderate">Moderate (3-5 days/wk)</option>
                <option value="active">Active (6-7 days/wk)</option>
                <option value="very_active">Very Active (athlete)</option>
              </select>
            </Field>
          </div>
          {tdee && (
            <div className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <Flame size={16} className="text-violet-400" />
              <div>
                <div className="text-sm font-semibold text-white">Estimated TDEE: <span className="font-mono text-violet-300">{tdee} kcal/day</span></div>
                <div className="text-xs text-slate-400">Your total daily energy expenditure based on activity level</div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Program Goals */}
        <SectionCard title="Program Goals" icon={<Target size={16} />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label={`Start Weight (${weightUnit})`}>
              <input className="dark-input" type="number" step="0.1" placeholder="0.0" value={goals.startWeight} onChange={set('startWeight')} />
            </Field>
            <Field label={`Target Weight (${weightUnit})`}>
              <input className="dark-input" type="number" step="0.1" placeholder="0.0" value={goals.targetWeight} onChange={set('targetWeight')} />
            </Field>
            <Field label="Program Start Date">
              <input className="dark-input" type="date" value={goals.startDate} onChange={set('startDate')} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Program Duration" hint="How many weeks is your program?">
              <div className="flex flex-wrap gap-2 mt-1">
                {[4, 6, 8, 10, 12, 16, 20, 24].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onUpdateGoals({ ...goals, totalWeeks: w })}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    style={goals.totalWeeks === w ? {
                      background: 'rgba(124,58,237,0.25)',
                      border: '1px solid rgba(124,58,237,0.6)',
                      color: '#c4b5fd',
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#64748b',
                    }}
                  >
                    {w}w
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Daily Targets */}
        <SectionCard title="Daily Targets" icon={<Zap size={16} />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Calories (kcal)" hint="Your daily calorie target">
              <input className="dark-input" type="number" placeholder={tdee ? String(Math.round(tdee * 0.8)) : '1800'} value={goals.targetCalories} onChange={set('targetCalories')} />
            </Field>
            <Field label="Protein (g)" hint="≈0.8–1.2g per lb bodyweight">
              <input className="dark-input" type="number" placeholder="150" value={goals.targetProtein} onChange={set('targetProtein')} />
            </Field>
            <Field label="Carbohydrates (g)">
              <input className="dark-input" type="number" placeholder="200" value={goals.targetCarbs} onChange={set('targetCarbs')} />
            </Field>
            <Field label="Fats (g)">
              <input className="dark-input" type="number" placeholder="65" value={goals.targetFats} onChange={set('targetFats')} />
            </Field>
            <Field label={`Water (${waterUnit})`}>
              <input className="dark-input" type="number" step="0.1" placeholder={unit === 'metric' ? '2.5' : '84'} value={goals.targetWater} onChange={set('targetWater')} />
            </Field>
            <Field label="Steps">
              <input className="dark-input" type="number" placeholder="8000" value={goals.targetSteps} onChange={set('targetSteps')} />
            </Field>
            <Field label="Sleep (hours)">
              <input className="dark-input" type="number" step="0.5" placeholder="8" value={goals.targetSleep} onChange={set('targetSleep')} />
            </Field>
          </div>

          {goals.targetCalories && goals.targetProtein && goals.targetCarbs && goals.targetFats && (
            <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="eyebrow mb-2">Macro Split</div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: 'Protein', value: parseFloat(goals.targetProtein) * 4, color: '#10b981' },
                  { label: 'Carbs', value: parseFloat(goals.targetCarbs) * 4, color: '#f59e0b' },
                  { label: 'Fats', value: parseFloat(goals.targetFats) * 9, color: '#f43f5e' },
                ].map((m) => {
                  const totalCals = parseFloat(goals.targetCalories) || 1;
                  const pct = Math.round((m.value / totalCals) * 100);
                  return (
                    <div key={m.label} className="text-xs">
                      <span style={{ color: m.color }} className="font-semibold">{m.label}</span>
                      <span className="text-slate-400 ml-1">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Data management */}
        <SectionCard title="Data Management" icon={<Download size={16} />}>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary text-xs" onClick={onExportTxt}>
              <Download size={13} /> Export TXT Report
            </button>
            <button className="btn-secondary text-xs" onClick={onBackupJson}>
              <Download size={13} /> Backup JSON
            </button>
            <button className="btn-secondary text-xs" onClick={onImportJson}>
              <Upload size={13} /> Import JSON
            </button>
          </div>
          <div className="divider" />
          <div>
            {confirmReset ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-rose-400">Delete all data? This cannot be undone.</span>
                <button className="btn-danger text-xs" onClick={() => { onResetAll(); setConfirmReset(false); }}>
                  Yes, reset everything
                </button>
                <button className="btn-secondary text-xs" onClick={() => setConfirmReset(false)}>Cancel</button>
              </div>
            ) : (
              <button className="btn-danger text-xs" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={13} /> Reset All Data
              </button>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
