import type {
  ActivityLevel,
  BodyMetrics,
  BMICategory,
  CaloriesChartPoint,
  DailyData,
  DailyEntry,
  DailyProgress,
  GoalsState,
  HeatmapCell,
  MacroTotals,
  MeasurementsChartPoint,
  StatsSummary,
  Unit,
  WeeklyData,
  WeightChartPoint,
  WeightProjection,
  WeightTrendPoint
} from './trackerTypes';
import { DAYS_PER_WEEK, TOTAL_WEEKS } from './trackerData';
import { getDayLabel } from './trackerDates';

// ── Weight charts ──────────────────────────────────────────────────────────

export const getWeightChartData = (weeklyData: WeeklyData): WeightChartPoint[] =>
  Object.keys(weeklyData)
    .map((key) => Number(key))
    .filter((week) => weeklyData[week].weight)
    .map((week) => ({
      week: `W${week}`,
      weight: parseFloat(weeklyData[week].weight) || 0,
    }));

export const getDailyWeightChartData = (
  dailyData: DailyData,
  currentWeek: number,
  startDate: string
): WeightChartPoint[] => {
  const data: WeightChartPoint[] = [];
  const dayEntries = dailyData[currentWeek];
  if (!dayEntries) return data;
  for (let day = 1; day <= DAYS_PER_WEEK; day += 1) {
    const dayData = dayEntries[day];
    const weight = dayData ? parseFloat(dayData.weight) : NaN;
    if (!Number.isNaN(weight)) {
      data.push({ week: getDayLabel(startDate, currentWeek, day), weight });
    }
  }
  return data;
};

// ── Measurements chart ─────────────────────────────────────────────────────

export const getMeasurementsChartData = (weeklyData: WeeklyData): MeasurementsChartPoint[] =>
  Object.keys(weeklyData)
    .map((key) => Number(key))
    .filter((week) => weeklyData[week].waist || weeklyData[week].chest)
    .map((week) => ({
      week: `W${week}`,
      waist: parseFloat(weeklyData[week].waist) || 0,
      chest: parseFloat(weeklyData[week].chest) || 0,
      hips: parseFloat(weeklyData[week].hips) || 0,
    }));

// ── Body fat chart ─────────────────────────────────────────────────────────

export const getBodyFatChartData = (weeklyData: WeeklyData) =>
  Object.keys(weeklyData)
    .map((key) => Number(key))
    .filter((week) => weeklyData[week].bodyFat)
    .map((week) => ({
      week: `W${week}`,
      bodyFat: parseFloat(weeklyData[week].bodyFat) || 0,
    }));

// ── Weight trend & projection ─────────────────────────────────────────────

const getWeeklyWeights = (weeklyData: WeeklyData) =>
  Object.keys(weeklyData)
    .map((key) => Number(key))
    .filter((week) => weeklyData[week].weight)
    .map((week) => ({ week, weight: parseFloat(weeklyData[week].weight) }))
    .filter((point) => !Number.isNaN(point.weight));

export const getWeightTrendData = (
  weeklyData: WeeklyData,
  windowSize = 3
): WeightTrendPoint[] => {
  const points = getWeeklyWeights(weeklyData);
  if (points.length === 0) return [];

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.week, 0);
  const sumY = points.reduce((sum, p) => sum + p.weight, 0);
  const sumXY = points.reduce((sum, p) => sum + p.week * p.weight, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.week * p.week, 0);
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : null;
  const intercept = slope !== null ? (sumY - slope * sumX) / n : null;

  return points.map((point, idx) => {
    const average =
      idx + 1 >= windowSize
        ? points.slice(idx - windowSize + 1, idx + 1).reduce((s, e) => s + e.weight, 0) / windowSize
        : null;
    const trend = slope !== null && intercept !== null ? slope * point.week + intercept : null;
    return {
      week: `W${point.week}`,
      weight: point.weight,
      average: average !== null ? Number(average.toFixed(2)) : null,
      trend: trend !== null ? Number(trend.toFixed(2)) : null,
    };
  });
};

export const getWeightProjection = (weeklyData: WeeklyData, goals: GoalsState): WeightProjection => {
  const points = getWeeklyWeights(weeklyData);
  if (points.length < 2) return { slope: null, projectedWeek: null, lastWeek: null };

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.week, 0);
  const sumY = points.reduce((s, p) => s + p.weight, 0);
  const sumXY = points.reduce((s, p) => s + p.week * p.weight, 0);
  const sumX2 = points.reduce((s, p) => s + p.week * p.week, 0);
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : null;
  const intercept = slope !== null ? (sumY - slope * sumX) / n : null;
  const targetWeight = parseFloat(goals.targetWeight);
  const lastWeek = points[points.length - 1]?.week ?? null;

  if (slope === null || intercept === null || !Number.isFinite(targetWeight)) {
    return { slope, projectedWeek: null, lastWeek };
  }
  if (slope >= 0) return { slope, projectedWeek: null, lastWeek };

  const projectedWeekRaw = (targetWeight - intercept) / slope;
  if (!Number.isFinite(projectedWeekRaw)) return { slope, projectedWeek: null, lastWeek };

  const projectedWeek = Math.ceil(projectedWeekRaw);
  if (lastWeek !== null && projectedWeek <= lastWeek) return { slope, projectedWeek: null, lastWeek };

  return { slope, projectedWeek, lastWeek };
};

// ── Calories chart ─────────────────────────────────────────────────────────

export const getCaloriesChartData = (
  dailyData: DailyData,
  currentWeek: number,
  startDate: string
): CaloriesChartPoint[] => {
  const data: CaloriesChartPoint[] = [];
  const dayEntries = dailyData[currentWeek];
  if (!dayEntries) return data;
  for (let day = 1; day <= DAYS_PER_WEEK; day += 1) {
    const dayData = dayEntries[day];
    if (dayData?.calories) {
      data.push({ day: getDayLabel(startDate, currentWeek, day), calories: parseFloat(dayData.calories) || 0 });
    }
  }
  return data;
};

// ── Goal progress ──────────────────────────────────────────────────────────

export const calculateProgress = (goals: GoalsState, weeklyData: WeeklyData): number => {
  const startWeight = parseFloat(goals.startWeight);
  const targetWeight = parseFloat(goals.targetWeight);
  const latestWeek = Object.keys(weeklyData)
    .map((k) => Number(k))
    .filter((w) => weeklyData[w].weight)
    .sort((a, b) => b - a)[0];
  const currentWeight =
    typeof latestWeek === 'number' ? parseFloat(weeklyData[latestWeek].weight) : startWeight;

  if (!startWeight || !targetWeight || !currentWeight) return 0;
  const totalLoss = startWeight - targetWeight;
  if (totalLoss <= 0) return 0;
  return Math.min(Math.round(((startWeight - currentWeight) / totalLoss) * 100), 100);
};

// ── Stats summary ──────────────────────────────────────────────────────────

export const calculateStats = (weeklyData: WeeklyData, dailyData: DailyData): StatsSummary => {
  const weights = Object.values(weeklyData)
    .map((w) => parseFloat(w.weight))
    .filter((v) => !Number.isNaN(v));
  const totalWeightLost = weights.length >= 2 ? weights[0] - weights[weights.length - 1] : 0;

  const waists = Object.values(weeklyData)
    .map((w) => parseFloat(w.waist))
    .filter((v) => !Number.isNaN(v));
  const totalInchesLost = waists.length >= 2 ? waists[0] - waists[waists.length - 1] : 0;

  // Count workouts from daily data
  let totalWorkouts = 0;
  const maxWeek = Math.max(TOTAL_WEEKS, ...Object.keys(dailyData).map(Number).filter(n => !isNaN(n)));
  for (let week = 1; week <= maxWeek; week++) {
    const days = dailyData[week];
    if (!days) continue;
    for (let day = 1; day <= DAYS_PER_WEEK; day++) {
      if (days[day]?.workout) totalWorkouts++;
    }
  }

  // Streak: consecutive weeks with any logged data
  let currentStreak = 0;
  const maxWeekW = Math.max(TOTAL_WEEKS, ...Object.keys(weeklyData).map(Number).filter(n => !isNaN(n)));
  for (let week = 1; week <= maxWeekW; week++) {
    if (weeklyData[week]?.weight) currentStreak++;
    else break;
  }

  return { totalWeightLost, totalInchesLost, totalWorkouts, currentStreak };
};

// ── Macro totals ───────────────────────────────────────────────────────────

export const getWeeklyMacroTotals = (dailyData: DailyData, week: number): MacroTotals => {
  let protein = 0, carbs = 0, fats = 0, water = 0, entryCount = 0;
  const days = dailyData[week];
  if (!days) return { protein, carbs, fats, water, entryCount };

  for (let day = 1; day <= DAYS_PER_WEEK; day++) {
    const entry = days[day];
    if (!entry) continue;
    const p = parseFloat(entry.protein);
    const c = parseFloat(entry.carbs);
    const f = parseFloat(entry.fats);
    const w = parseFloat(entry.water);
    if (!Number.isNaN(p)) protein += p;
    if (!Number.isNaN(c)) carbs += c;
    if (!Number.isNaN(f)) fats += f;
    if (!Number.isNaN(w)) water += w;
    if (!Number.isNaN(p) || !Number.isNaN(c) || !Number.isNaN(f) || !Number.isNaN(w)) entryCount++;
  }
  return { protein, carbs, fats, water, entryCount };
};

// ── Daily progress vs targets ──────────────────────────────────────────────

export const getDailyProgress = (entry: DailyEntry, goals: GoalsState): DailyProgress => {
  const n = (v: string) => parseFloat(v) || 0;
  const pct = (val: number, target: number) =>
    target > 0 ? Math.min(Math.round((val / target) * 100), 100) : 0;

  const calories = n(entry.calories);
  const protein = n(entry.protein);
  const carbs = n(entry.carbs);
  const fats = n(entry.fats);
  const water = n(entry.water);
  const steps = n(entry.steps);
  const sleep = n(entry.sleep);

  const tCal = n(goals.targetCalories);
  const tPro = n(goals.targetProtein);
  const tCarb = n(goals.targetCarbs);
  const tFat = n(goals.targetFats);
  const tWater = n(goals.targetWater);
  const tSteps = n(goals.targetSteps);
  const tSleep = n(goals.targetSleep);

  return {
    calories: { value: calories, target: tCal, pct: pct(calories, tCal) },
    protein: { value: protein, target: tPro, pct: pct(protein, tPro) },
    carbs: { value: carbs, target: tCarb, pct: pct(carbs, tCarb) },
    fats: { value: fats, target: tFat, pct: pct(fats, tFat) },
    water: { value: water, target: tWater, pct: pct(water, tWater) },
    steps: { value: steps, target: tSteps, pct: pct(steps, tSteps) },
    sleep: { value: sleep, target: tSleep, pct: pct(sleep, tSleep) },
  };
};

// ── BMI & TDEE ─────────────────────────────────────────────────────────────

const toKg = (weight: string, unit: Unit) => {
  const v = parseFloat(weight);
  return unit === 'imperial' ? v * 0.453592 : v;
};

const toCm = (height: string, unit: Unit) => {
  const v = parseFloat(height);
  return unit === 'imperial' ? v * 2.54 : v;
};

const getBMICategory = (bmi: number): BMICategory => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const calculateBodyMetrics = (goals: GoalsState, currentWeight: string): BodyMetrics => {
  const weightKg = toKg(currentWeight || goals.startWeight, goals.unit);
  const heightCm = toCm(goals.height, goals.unit);
  const age = parseFloat(goals.age);

  let bmi: number | null = null;
  let bmiCategory: BMICategory | null = null;
  let tdee: number | null = null;

  if (weightKg > 0 && heightCm > 0) {
    const heightM = heightCm / 100;
    bmi = Number((weightKg / (heightM * heightM)).toFixed(1));
    bmiCategory = getBMICategory(bmi);
  }

  if (weightKg > 0 && heightCm > 0 && age > 0 && goals.sex) {
    // Mifflin-St Jeor BMR
    const bmr =
      goals.sex === 'male'
        ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
        : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    const multiplier = ACTIVITY_MULTIPLIERS[goals.activityLevel] ?? 1.55;
    tdee = Math.round(bmr * multiplier);
  }

  return { bmi, bmiCategory, tdee };
};

// ── Heatmap ────────────────────────────────────────────────────────────────

export const buildHeatmap = (dailyData: DailyData, weeklyData: WeeklyData): HeatmapCell[] => {
  const cells: HeatmapCell[] = [];

  const heatmapMaxWeek = Math.max(TOTAL_WEEKS, ...Object.keys(dailyData).map(Number).filter(n => !isNaN(n)));
  for (let week = 1; week <= heatmapMaxWeek; week++) {
    for (let day = 1; day <= DAYS_PER_WEEK; day++) {
      const entry = dailyData[week]?.[day];
      let level: 0 | 1 | 2 | 3 | 4 = 0;

      if (entry) {
        const hasWeight = !!entry.weight;
        const hasCals = !!entry.calories;
        const hasMacros = !!(entry.protein || entry.carbs || entry.fats);
        const hasWorkout = entry.workout;
        const hasLifestyle = !!(entry.sleep || entry.steps || entry.mood);

        const score = [hasWeight, hasCals, hasMacros, hasLifestyle].filter(Boolean).length;
        if (score === 1) level = 1;
        else if (score === 2) level = 2;
        else if (score === 3) level = 3;
        else if (score >= 4) level = 4;

        // Bumped if weeklyData also has weight
        if (weeklyData[week]?.weight && level < 2) level = 2;

        cells.push({
          week,
          day,
          level,
          workout: !!hasWorkout,
          label: `W${week} D${day}`,
        });
      } else {
        cells.push({ week, day, level: 0, workout: false, label: `W${week} D${day}` });
      }
    }
  }

  return cells;
};

// ── Re-exports kept for compatibility ──────────────────────────────────────

export { getDailyWeightChartData as getDailyWeightChartDataCompat };
