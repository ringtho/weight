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
import type { MeasurementsChartPoint, WeightChartPoint } from '../../lib/trackerTypes';

type ProgressChartsProps = {
  weightData: WeightChartPoint[];
  measurementData: MeasurementsChartPoint[];
  weightTitle?: string;
};

export default function ProgressCharts({
  weightData,
  measurementData,
  weightTitle = 'Weight Progress'
}: ProgressChartsProps) {
  const hasWeight = weightData.length > 0;
  const hasMeasurements = measurementData.length > 0;
  if (!hasWeight && !hasMeasurements) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {hasWeight && (
        <div className="surface-panel p-5 rounded-2xl">
          <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-4">
            {weightTitle}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" angle={-25} textAnchor="end" height={50} interval={0} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2a2219"
                strokeWidth={3}
                name="Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasMeasurements && (
        <div className="surface-panel p-5 rounded-2xl">
          <h3 className="text-xl font-display font-semibold text-[#2a2219] mb-4">
            Body Measurements
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={measurementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="waist"
                stroke="#8c6a3f"
                strokeWidth={2}
                name="Waist"
              />
              <Line
                type="monotone"
                dataKey="chest"
                stroke="#4b5a4a"
                strokeWidth={2}
                name="Chest"
              />
              <Line
                type="monotone"
                dataKey="hips"
                stroke="#6a5b4a"
                strokeWidth={2}
                name="Hips"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
