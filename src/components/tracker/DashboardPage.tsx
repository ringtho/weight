import React from 'react';
import {
  Scale, Ruler, Dumbbell, Flame, TrendingDown, TrendingUp, Target,
  BookOpen, CalendarCheck, Timer, ChevronRight, Zap, Droplets, Moon, Footprints,
  PartyPopper, ArrowRight,
} from 'lucide-react';
import ProgressRing from './ProgressRing';
import type { BodyMetrics, DailyEntry, DailyProgress, GoalsState, Page, StatsSummary, WeeklyData } from '../../lib/trackerTypes';
import type { DailyData } from '../../lib/trackerTypes';

type Props = {
  goals: GoalsState;
  weeklyData: WeeklyData;
  dailyData: DailyData;
  currentWeek: number;
  currentDay: number;
  stats: StatsSummary;
  progress: number;
  bodyMetrics: BodyMetrics;
  todayEntry: DailyEntry;
  todayProgress: DailyProgress;
  programDay: number;
  onNavigate: (page: Page) => void;
  onGoToToday: () => void;
  onExtendProgram: () => void;
};

const BMI_COLORS: Record<string, string> = {
  underweight: '#06b6d4',
  normal: '#10b981',
  overweight: '#f59e0b',
  obese: '#f43f5e',
};

const BMI_LABELS: Record<string, string> = {
  underweight: 'Underweight',
  normal: 'Healthy',
  overweight: 'Overweight',
  obese: 'Obese',
};

type StatCardProps = {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: 'up' | 'down' | null;
  trendLabel?: string;
};

function StatCard({ label, value, unit, icon, gradient, trend, trendLabel }: StatCardProps) {
  return (
    <div className="card card-hover p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
          style={{ background: gradient }}
        >
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'down' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {trendLabel}
          </div>
        )}
      </div>
      <div className="font-mono text-3xl font-semibold text-white leading-none mb-1">
        {value}
        <span className="text-sm font-sans text-slate-400 ml-1">{unit}</span>
      </div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </div>
  );
}

type MacroRingProps = {
  label: string;
  value: number;
  target: number;
  pct: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
};

function MacroRing({ label, value, target, pct, unit, color, icon }: MacroRingProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressRing value={value} max={target || 1} size={80} strokeWidth={7} color={color}>
        <span className="text-white" style={{ color }}>{icon}</span>
      </ProgressRing>
      <div className="text-center">
        <div className="font-mono text-sm font-semibold text-white">
          {value > 0 ? value.toFixed(0) : '—'}
          {target > 0 && <span className="text-slate-500 font-sans text-xs">/{target}</span>}
        </div>
        <div className="text-xs text-slate-400">{label}</div>
        {target > 0 && (
          <div className="text-xs font-semibold" style={{ color }}>{pct}%</div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage({
  goals,
  weeklyData,
  currentWeek,
  stats,
  progress,
  bodyMetrics,
  todayEntry,
  todayProgress,
  programDay,
  onNavigate,
  onGoToToday,
  onExtendProgram,
}: Props) {
  const totalWeeks = goals.totalWeeks;
  const unit = goals.unit === 'imperial' ? 'lbs' : 'kg';
  const inUnit = goals.unit === 'imperial' ? '"' : 'cm';

  const latestWeek = Object.keys(weeklyData)
    .map(Number)
    .filter((w) => weeklyData[w].weight)
    .sort((a, b) => b - a)[0];
  const currentWeight = latestWeek ? weeklyData[latestWeek].weight : goals.startWeight;

  const totalDays = totalWeeks * 7;
  const daysLeft = totalDays - programDay + 1;
  const hasTodayData = !!(todayEntry.weight || todayEntry.calories);
  const programComplete = programDay > totalDays;
  const programEndingSoon = !programComplete && currentWeek >= totalWeeks - 1;

  const bmiColor = bodyMetrics.bmiCategory ? BMI_COLORS[bodyMetrics.bmiCategory] : '#94a3b8';
  const bmiLabel = bodyMetrics.bmiCategory ? BMI_LABELS[bodyMetrics.bmiCategory] : null;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="eyebrow mb-2">
          Week {currentWeek} of {totalWeeks} · Day {((currentWeek - 1) * 7 + 1)} of {totalDays}
        </div>
        <h1 className="page-title mb-1">Your Dashboard</h1>
        <p className="text-slate-400 text-sm">
          {programComplete
            ? `${totalWeeks}-week program complete — you're in extended tracking!`
            : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining in your program`}
        </p>

        {/* Overall progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 progress-track" style={{ height: 8 }}>
            <div
              className="progress-fill gradient-violet"
              style={{ width: `${Math.min(100, Math.round((programDay / totalDays) * 100))}%` }}
            />
          </div>
          <span className="text-xs font-mono text-violet-400 flex-shrink-0">
            {Math.min(100, Math.round((programDay / totalDays) * 100))}%
          </span>
        </div>

        {/* Program ending / complete banner */}
        {(programEndingSoon || programComplete) && (
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: programComplete ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              border: `1px solid ${programComplete ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}
          >
            <PartyPopper size={18} style={{ color: programComplete ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
            <div className="flex-1 text-sm">
              <span style={{ color: programComplete ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                {programComplete ? 'Program Complete! ' : `Week ${totalWeeks} coming up! `}
              </span>
              <span className="text-slate-400">
                {programComplete
                  ? "Amazing work finishing your program. Keep tracking your progress!"
                  : "You're almost at the end of your 12-week program."}
              </span>
            </div>
            <button
              onClick={onExtendProgram}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{
                background: programComplete ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                color: programComplete ? '#10b981' : '#f59e0b',
                border: `1px solid ${programComplete ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
              }}
            >
              Continue +12 weeks <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Goal progress + BMI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Goal weight progress ring */}
        <div className="card p-5 flex items-center gap-5 md:col-span-2">
          <ProgressRing
            value={progress}
            max={100}
            size={100}
            strokeWidth={9}
            color="#7c3aed"
          >
            <span className="font-mono text-lg font-bold text-white">{progress}%</span>
          </ProgressRing>
          <div className="flex-1 min-w-0">
            <div className="eyebrow mb-1">Weight Goal Progress</div>
            <div className="flex flex-wrap gap-4 mt-2">
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Started</div>
                <div className="font-mono font-semibold text-white">
                  {goals.startWeight || '—'} <span className="text-slate-400 text-xs">{unit}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Current</div>
                <div className="font-mono font-semibold text-emerald-400">
                  {currentWeight || '—'} <span className="text-slate-400 text-xs">{unit}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Target</div>
                <div className="font-mono font-semibold text-violet-400">
                  {goals.targetWeight || '—'} <span className="text-slate-400 text-xs">{unit}</span>
                </div>
              </div>
            </div>
            {stats.totalWeightLost > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                <TrendingDown size={11} />
                {stats.totalWeightLost.toFixed(1)} {unit} lost so far
              </div>
            )}
          </div>
        </div>

        {/* BMI + TDEE */}
        <div className="card p-5">
          <div className="eyebrow mb-3">Body Metrics</div>
          {bodyMetrics.bmi ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${bmiColor}22`, border: `1px solid ${bmiColor}44` }}
                >
                  <Scale size={18} style={{ color: bmiColor }} />
                </div>
                <div>
                  <div className="font-mono text-2xl font-semibold text-white">
                    {bodyMetrics.bmi}
                  </div>
                  <div className="text-xs font-semibold" style={{ color: bmiColor }}>
                    BMI · {bmiLabel}
                  </div>
                </div>
              </div>
              {bodyMetrics.tdee && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                  <Flame size={14} className="text-amber-400" />
                  <div>
                    <div className="font-mono text-sm font-semibold text-white">{bodyMetrics.tdee} kcal</div>
                    <div className="text-xs text-slate-400">Est. daily burn (TDEE)</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-500 mt-2">
              Add your height, weight and age in{' '}
              <button
                onClick={() => onNavigate('settings')}
                className="text-violet-400 hover:underline"
              >
                Settings
              </button>{' '}
              to see BMI & TDEE.
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <StatCard
          label="Weight Lost"
          value={stats.totalWeightLost > 0 ? stats.totalWeightLost.toFixed(1) : '0.0'}
          unit={unit}
          icon={<Scale size={18} />}
          gradient="linear-gradient(135deg,#7c3aed,#6366f1)"
          trend={stats.totalWeightLost > 0 ? 'down' : null}
          trendLabel={`${stats.totalWeightLost.toFixed(1)} ${unit}`}
        />
        <StatCard
          label="Inches Lost"
          value={stats.totalInchesLost > 0 ? stats.totalInchesLost.toFixed(1) : '0.0'}
          unit={inUnit}
          icon={<Ruler size={18} />}
          gradient="linear-gradient(135deg,#6366f1,#3b82f6)"
          trend={stats.totalInchesLost > 0 ? 'down' : null}
          trendLabel={`waist`}
        />
        <StatCard
          label="Total Workouts"
          value={stats.totalWorkouts}
          unit=""
          icon={<Dumbbell size={18} />}
          gradient="linear-gradient(135deg,#10b981,#059669)"
        />
        <StatCard
          label="Week Streak"
          value={stats.currentStreak}
          unit="wks"
          icon={<Flame size={18} />}
          gradient="linear-gradient(135deg,#f59e0b,#d97706)"
        />
      </div>

      {/* Today's intake */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow mb-1">Today's Nutrition</div>
            <div className="section-heading">Daily Targets</div>
          </div>
          <button
            className="btn-secondary text-xs"
            onClick={() => { onGoToToday(); onNavigate('daily'); }}
          >
            <BookOpen size={13} />
            Log Today
          </button>
        </div>

        {todayProgress.calories.target > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <MacroRing
              label="Calories"
              value={todayProgress.calories.value}
              target={todayProgress.calories.target}
              pct={todayProgress.calories.pct}
              unit="kcal"
              color="#7c3aed"
              icon={<Flame size={14} />}
            />
            <MacroRing
              label="Protein"
              value={todayProgress.protein.value}
              target={todayProgress.protein.target}
              pct={todayProgress.protein.pct}
              unit="g"
              color="#10b981"
              icon={<Target size={14} />}
            />
            <MacroRing
              label="Water"
              value={todayProgress.water.value}
              target={todayProgress.water.target}
              pct={todayProgress.water.pct}
              unit={goals.unit === 'imperial' ? 'oz' : 'L'}
              color="#3b82f6"
              icon={<Droplets size={14} />}
            />
            <MacroRing
              label="Steps"
              value={todayProgress.steps.value}
              target={todayProgress.steps.target}
              pct={todayProgress.steps.pct}
              unit="steps"
              color="#f59e0b"
              icon={<Footprints size={14} />}
            />
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Set daily targets in{' '}
            <button onClick={() => onNavigate('settings')} className="text-violet-400 hover:underline">
              Settings
            </button>{' '}
            to see today's nutrition rings.
          </div>
        )}

        {/* Macro progress bars */}
        {todayProgress.calories.target > 0 && (
          <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Carbs', ...todayProgress.carbs, unit: 'g', color: '#f59e0b' },
              { label: 'Fats', ...todayProgress.fats, unit: 'g', color: '#f43f5e' },
              { label: 'Sleep', ...todayProgress.sleep, unit: 'h', color: '#a78bfa' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{item.label}</span>
                  <span className="font-mono">
                    {item.value > 0 ? item.value.toFixed(item.label === 'Sleep' ? 1 : 0) : '—'}
                    {item.target > 0 ? `/${item.target}${item.unit}` : ''}
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            page: 'daily' as Page,
            label: 'Daily Log',
            desc: 'Log today\'s nutrition & workout',
            icon: <BookOpen size={18} />,
            color: '#7c3aed',
          },
          {
            page: 'weekly' as Page,
            label: 'Weekly Check-in',
            desc: 'Record measurements & photos',
            icon: <CalendarCheck size={18} />,
            color: '#10b981',
          },
          {
            page: 'timer' as Page,
            label: 'Start Timer',
            desc: 'Tabata & interval training',
            icon: <Timer size={18} />,
            color: '#f59e0b',
          },
        ].map((item) => (
          <button
            key={item.page}
            className="card card-hover p-4 text-left flex items-center gap-3 w-full"
            onClick={() => onNavigate(item.page)}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: `${item.color}22`, border: `1px solid ${item.color}44` }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm">{item.label}</div>
              <div className="text-xs text-slate-400 truncate">{item.desc}</div>
            </div>
            <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
