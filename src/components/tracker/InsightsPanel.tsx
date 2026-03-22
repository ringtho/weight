import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { WeightProjection, WeightTrendPoint } from '../../lib/trackerTypes';
import { formatFullDateLabel, getDateForDay } from '../../lib/trackerDates';
import { TOTAL_WEEKS } from '../../lib/trackerData';

type InsightsPanelProps = {
  trendData: WeightTrendPoint[];
  projection: WeightProjection;
  startDate: string;
};

export default function InsightsPanel({ trendData, projection, startDate }: InsightsPanelProps) {
  const hasTrendData = trendData.length >= 2;
  const slopeLabel =
    projection.slope === null ? '—' : `${projection.slope.toFixed(2)} kg / wk`;
  const projectedWeek = projection.projectedWeek;
  const projectedDate =
    projectedWeek && projectedWeek >= 1
      ? getDateForDay(startDate, projectedWeek, 1)
      : null;
  const projectedDateLabel = projectedDate ? formatFullDateLabel(projectedDate) : null;
  const projectedWeekLabel =
    projectedWeek && projectedWeek > TOTAL_WEEKS
      ? `Week ${projectedWeek} (beyond 12 weeks)`
      : projectedWeek
        ? `Week ${projectedWeek}`
        : null;

  return (
    <div className="surface-panel p-5 rounded-2xl mb-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-xl font-display font-semibold text-[#2a2219]">Insights</h3>
          <p className="text-xs text-[#6a5b4a]">Trends update as you log weekly weights.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-[#6a5b4a]">
          <div className="rounded-full border border-[#e7ded2] bg-white/90 px-3 py-1">
            Trend: <span className="font-semibold text-[#2a2219]">{slopeLabel}</span>
          </div>
          <div className="rounded-full border border-[#e7ded2] bg-white/90 px-3 py-1">
            Projection:{' '}
            <span className="font-semibold text-[#2a2219]">
              {projectedWeekLabel ? projectedWeekLabel : 'Need more data'}
            </span>
          </div>
        </div>
      </div>

      {hasTrendData ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2a2219"
                strokeWidth={3}
                name="Weekly Weight"
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="#8c6a3f"
                strokeWidth={2}
                strokeDasharray="4 4"
                name="3-Week Avg"
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#4b5a4a"
                strokeWidth={2}
                strokeDasharray="6 6"
                name="Trendline"
              />
            </LineChart>
          </ResponsiveContainer>
          {projectedWeekLabel && projectedDateLabel && (
            <p className="text-xs text-[#6a5b4a] mt-3">
              At your current pace, you may reach your target around {projectedDateLabel}.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-[#6a5b4a]">
          Add at least two weekly weigh-ins to unlock trend insights.
        </p>
      )}
    </div>
  );
}
