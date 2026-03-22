import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { TrendingDown, Target, Activity, BarChart2, Calendar, SplitSquareHorizontal } from 'lucide-react';
import type {
  DailyData, GoalsState, HeatmapCell, WeeklyData,
  WeightProjection, WeightTrendPoint, MeasurementsChartPoint,
  WeightChartPoint, CaloriesChartPoint,
} from '../../lib/trackerTypes';
import { TOTAL_WEEKS, DAYS_PER_WEEK } from '../../lib/trackerData';
import { getDateForDay, formatFullDateLabel } from '../../lib/trackerDates';
import ComparisonPanel from './ComparisonPanel';

type ChartTab = 'weight' | 'trend' | 'measurements' | 'calories' | 'heatmap' | 'compare';

const TAB_ITEMS: { id: ChartTab; label: string; icon: React.ReactNode }[] = [
  { id: 'weight', label: 'Weight', icon: <TrendingDown size={14} /> },
  { id: 'trend', label: 'Trend', icon: <Activity size={14} /> },
  { id: 'measurements', label: 'Measurements', icon: <Target size={14} /> },
  { id: 'calories', label: 'Calories', icon: <BarChart2 size={14} /> },
  { id: 'heatmap', label: 'Activity', icon: <Calendar size={14} /> },
  { id: 'compare', label: 'Compare', icon: <SplitSquareHorizontal size={14} /> },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-2xl" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

type Props = {
  goals: GoalsState;
  weeklyData: WeeklyData;
  dailyData: DailyData;
  currentWeek: number;
  weightChartData: WeightChartPoint[];
  trendData: WeightTrendPoint[];
  projection: WeightProjection;
  measurementsData: MeasurementsChartPoint[];
  caloriesData: CaloriesChartPoint[];
  heatmap: HeatmapCell[];
  startDate: string;
};

function Heatmap({ cells, startDate }: { cells: HeatmapCell[]; startDate: string }) {
  const [tooltip, setTooltip] = useState<{ cell: HeatmapCell; x: number; y: number } | null>(null);

  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: TOTAL_WEEKS }, (_, wi) => (
          <div key={wi + 1} className="flex flex-col gap-1">
            {Array.from({ length: DAYS_PER_WEEK }, (_, di) => {
              const cell = cells.find((c) => c.week === wi + 1 && c.day === di + 1);
              const level = cell?.level ?? 0;
              const workout = cell?.workout ?? false;
              return (
                <div
                  key={di}
                  className={`heatmap-cell level-${level} ${workout ? 'workout' : ''}`}
                  onMouseEnter={(e) => {
                    if (cell) {
                      const date = getDateForDay(startDate, wi + 1, di + 1);
                      setTooltip({ cell: { ...cell, label: date ? formatFullDateLabel(date) : `W${wi + 1} D${di + 1}` }, x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`heatmap-cell level-${l}`} style={{ width: 12, height: 12 }} />
        ))}
        <span>More</span>
        <span className="ml-4">
          <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ border: '1px solid rgba(16,185,129,0.5)', display: 'inline-block', verticalAlign: 'middle' }} />
          Workout day
        </span>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg px-3 py-1.5 text-xs shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="font-medium text-white">{tooltip.cell.label}</div>
          <div className="text-slate-400">
            {tooltip.cell.workout ? '🏋️ Workout · ' : ''}
            Level {tooltip.cell.level}/4
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProgressPage({
  goals,
  weeklyData,
  currentWeek,
  weightChartData,
  trendData,
  projection,
  measurementsData,
  caloriesData,
  heatmap,
  startDate,
}: Props) {
  const [activeTab, setActiveTab] = useState<ChartTab>('weight');

  const unit = goals.unit === 'imperial' ? 'lbs' : 'kg';
  const mUnit = goals.unit === 'imperial' ? 'in' : 'cm';

  const slopeLabel = projection.slope === null ? '—' : `${projection.slope.toFixed(2)} ${unit}/wk`;
  const projLabel = projection.projectedWeek
    ? projection.projectedWeek > TOTAL_WEEKS
      ? `Week ${projection.projectedWeek} (beyond program)`
      : `Week ${projection.projectedWeek}`
    : 'Need more data';

  const chartProps = {
    margin: { top: 4, right: 8, left: -16, bottom: 0 },
  };

  const axisProps = {
    tick: { fill: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono' },
    tickLine: false,
    axisLine: false,
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="eyebrow mb-1">Progress</div>
        <h1 className="page-title">Your Journey</h1>
      </div>

      {/* Trend summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'Rate of Loss',
            value: projection.slope !== null ? `${Math.abs(projection.slope).toFixed(2)}` : '—',
            unit: `${unit}/wk`,
            color: '#7c3aed',
          },
          {
            label: 'Projected Goal',
            value: projLabel,
            unit: '',
            color: '#10b981',
          },
          {
            label: 'Weeks Logged',
            value: weightChartData.length,
            unit: `of ${TOTAL_WEEKS}`,
            color: '#f59e0b',
          },
          {
            label: 'Trend Direction',
            value: (projection.slope ?? 0) < 0 ? '↓ Losing' : (projection.slope ?? 0) > 0 ? '↑ Gaining' : '→ Flat',
            unit: '',
            color: (projection.slope ?? 0) < 0 ? '#10b981' : '#f43f5e',
          },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className="eyebrow mb-1">{item.label}</div>
            <div className="font-mono text-lg font-semibold text-white leading-tight">
              {item.value}
              {item.unit && <span className="text-slate-400 text-xs ml-1 font-sans">{item.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chart tabs */}
      <div className="card p-5">
        <div className="flex gap-1 mb-5 overflow-x-auto">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-violet-600/25 text-violet-300 border border-violet-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Weight chart */}
        {activeTab === 'weight' && (
          <div>
            <div className="section-heading text-sm mb-4">Weekly Weight</div>
            {weightChartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weightChartData} {...chartProps}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" {...axisProps} />
                  <YAxis {...axisProps} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  {goals.targetWeight && (
                    <ReferenceLine
                      y={parseFloat(goals.targetWeight)}
                      stroke="#7c3aed"
                      strokeDasharray="4 4"
                      label={{ value: 'Target', fill: '#a78bfa', fontSize: 11 }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name={`Weight (${unit})`}
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#a78bfa' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                Log at least 2 weeks to see the chart.
              </div>
            )}
          </div>
        )}

        {/* Trend chart */}
        {activeTab === 'trend' && (
          <div>
            <div className="section-heading text-sm mb-4">Weight Trend (3-week moving avg)</div>
            {trendData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} {...chartProps}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" {...axisProps} />
                  <YAxis {...axisProps} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Line type="monotone" dataKey="weight" name="Weight" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="average" name="3-wk Avg" stroke="#10b981" strokeWidth={2.5} dot={false} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="trend" name="Trendline" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">Need at least 2 weeks of data.</div>
            )}
          </div>
        )}

        {/* Measurements */}
        {activeTab === 'measurements' && (
          <div>
            <div className="section-heading text-sm mb-4">Body Measurements ({mUnit})</div>
            {measurementsData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={measurementsData} {...chartProps}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" {...axisProps} />
                  <YAxis {...axisProps} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Line type="monotone" dataKey="waist" name={`Waist (${mUnit})`} stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="chest" name={`Chest (${mUnit})`} stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="hips" name={`Hips (${mUnit})`} stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                Log measurements in Weekly Check-in to see this chart.
              </div>
            )}
          </div>
        )}

        {/* Calories */}
        {activeTab === 'calories' && (
          <div>
            <div className="section-heading text-sm mb-4">Daily Calories (Week {currentWeek})</div>
            {caloriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={caloriesData} {...chartProps}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="day" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip content={<CustomTooltip />} />
                  {goals.targetCalories && (
                    <ReferenceLine
                      y={parseFloat(goals.targetCalories)}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: 'Target', fill: '#fbbf24', fontSize: 11 }}
                    />
                  )}
                  <Bar dataKey="calories" name="Calories" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                No calories logged for Week {currentWeek}.
              </div>
            )}
          </div>
        )}

        {/* Heatmap */}
        {activeTab === 'heatmap' && (
          <div>
            <div className="section-heading text-sm mb-2">12-Week Activity Heatmap</div>
            <p className="text-xs text-slate-500 mb-5">Each square = one day. Darker = more data logged. Green border = workout day.</p>
            <Heatmap cells={heatmap} startDate={startDate} />
          </div>
        )}

        {/* Compare */}
        {activeTab === 'compare' && (
          <div>
            <div className="section-heading text-sm mb-1">Before & After Comparison</div>
            <p className="text-xs text-slate-500 mb-5">
              Pick two weeks and open the side-by-side viewer to drag the reveal slider.
              Earlier week is always Before; later week is always After.
            </p>
            <ComparisonPanel weeklyData={weeklyData} unit={goals.unit === 'imperial' ? 'lbs' : 'kg'} />
          </div>
        )}
      </div>
    </div>
  );
}
