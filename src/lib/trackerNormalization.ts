import type {
  ActivityLevel,
  DailyData,
  DailyEntry,
  GoalsState,
  MealPhoto,
  Page,
  PersistedState,
  Sex,
  Unit,
  ViewMode,
  WeeklyData,
  WeeklyEntry,
} from './trackerTypes';
import {
  DEFAULT_REST_TIME,
  DEFAULT_PREP_TIME,
  DEFAULT_TOTAL_ROUNDS,
  DEFAULT_TOTAL_TABATAS,
  DEFAULT_WORK_TIME,
  DAYS_PER_WEEK,
  STORAGE_SCHEMA_VERSION,
  TOTAL_WEEKS,
  createDailyWeek,
  createDefaultGoals,
  createWeeklyEntry,
  initDailyData,
  initWeeklyData,
} from './trackerData';

const clampNumber = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeString = (value: unknown) => (typeof value === 'string' ? value : '');

const normalizeBoolean = (value: unknown) => (typeof value === 'boolean' ? value : false);

const normalizeStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const normalizeMealPhotos = (value: unknown): MealPhoto[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return { src: item, tag: '' };
      if (!isRecord(item)) return null;
      const src = normalizeString(item.src);
      if (!src) return null;
      return { src, tag: normalizeString(item.tag) };
    })
    .filter((item): item is MealPhoto => Boolean(item));
};

const normalizeNumber = (value: unknown, fallback: number, min?: number, max?: number) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  let result = parsed;
  if (typeof min === 'number') result = Math.max(result, min);
  if (typeof max === 'number') result = Math.min(result, max);
  return result;
};

const VALID_UNITS: Unit[] = ['metric', 'imperial'];
const VALID_SEX: Sex[] = ['male', 'female', ''];
const VALID_ACTIVITY: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const VALID_PAGES: Page[] = ['dashboard', 'daily', 'weekly', 'progress', 'timer', 'settings'];

const normalizeGoals = (value: unknown): GoalsState => {
  const defaults = createDefaultGoals();
  if (!isRecord(value)) return defaults;

  const unit: Unit = VALID_UNITS.includes(value.unit as Unit) ? (value.unit as Unit) : 'metric';
  const sex: Sex = VALID_SEX.includes(value.sex as Sex) ? (value.sex as Sex) : '';
  const activityLevel: ActivityLevel = VALID_ACTIVITY.includes(value.activityLevel as ActivityLevel)
    ? (value.activityLevel as ActivityLevel)
    : 'moderate';

  return {
    startWeight: normalizeString(value.startWeight),
    targetWeight: normalizeString(value.targetWeight),
    startDate: typeof value.startDate === 'string' ? value.startDate : defaults.startDate,
    totalWeeks: normalizeNumber(value.totalWeeks, TOTAL_WEEKS, TOTAL_WEEKS, 52),
    height: normalizeString(value.height),
    age: normalizeString(value.age),
    sex,
    unit,
    activityLevel,
    targetCalories: normalizeString(value.targetCalories),
    targetProtein: normalizeString(value.targetProtein),
    targetCarbs: normalizeString(value.targetCarbs),
    targetFats: normalizeString(value.targetFats),
    targetWater: normalizeString(value.targetWater),
    targetSteps: normalizeString(value.targetSteps) || defaults.targetSteps,
    targetSleep: normalizeString(value.targetSleep) || defaults.targetSleep,
  };
};

const normalizeWeeklyEntry = (value: unknown): WeeklyEntry => {
  if (!isRecord(value)) return createWeeklyEntry();

  const progressPhotos = normalizeStringArray(value.progressPhotos);
  if (progressPhotos.length === 0 && typeof value.photo === 'string') {
    progressPhotos.push(value.photo);
  }

  return {
    weight: normalizeString(value.weight),
    chest: normalizeString(value.chest),
    waist: normalizeString(value.waist),
    hips: normalizeString(value.hips),
    thighs: normalizeString(value.thighs),
    arms: normalizeString(value.arms),
    calories: normalizeString(value.calories),
    workouts: normalizeString(value.workouts),
    notes: normalizeString(value.notes),
    progressPhotos,
    bodyFat: normalizeString(value.bodyFat),
    muscleMass: normalizeString(value.muscleMass),
  };
};

const normalizeDailyEntry = (value: unknown): DailyEntry => {
  if (!isRecord(value)) {
    return {
      weight: '', calories: '', protein: '', carbs: '', fats: '', water: '',
      fiber: '', sugarAlcohols: '', alcohol: '',
      workout: false, workoutType: '', duration: '', workoutTemplate: '',
      workoutRpe: '', workoutTags: [], notes: '', mealPhotos: [],
      sleep: '', steps: '', mood: '', energy: '',
    };
  }

  return {
    weight: normalizeString(value.weight),
    calories: normalizeString(value.calories),
    protein: normalizeString(value.protein),
    carbs: normalizeString(value.carbs),
    fats: normalizeString(value.fats),
    water: normalizeString(value.water),
    fiber: normalizeString(value.fiber),
    sugarAlcohols: normalizeString(value.sugarAlcohols),
    alcohol: normalizeString(value.alcohol),
    workout: normalizeBoolean(value.workout),
    workoutType: normalizeString(value.workoutType),
    duration: normalizeString(value.duration),
    workoutTemplate: normalizeString(value.workoutTemplate),
    workoutRpe: normalizeString(value.workoutRpe),
    workoutTags: normalizeStringArray(value.workoutTags),
    notes: normalizeString(value.notes),
    mealPhotos: normalizeMealPhotos(value.mealPhotos),
    sleep: normalizeString(value.sleep),
    steps: normalizeString(value.steps),
    mood: normalizeString(value.mood),
    energy: normalizeString(value.energy),
  };
};

const normalizeWeeklyData = (value: unknown, totalWeeks = TOTAL_WEEKS): WeeklyData => {
  const data = initWeeklyData(totalWeeks);
  if (!isRecord(value)) return data;
  const storedWeeks = Object.keys(value).map(Number).filter(n => !isNaN(n) && n >= 1);
  const maxWeek = Math.max(totalWeeks, ...storedWeeks, 0);
  for (let week = 1; week <= maxWeek; week += 1) {
    if (value[String(week)] !== undefined) {
      data[week] = normalizeWeeklyEntry(value[String(week)]);
    } else if (!data[week]) {
      data[week] = createWeeklyEntry();
    }
  }
  return data;
};

const normalizeDailyData = (value: unknown, totalWeeks = TOTAL_WEEKS): DailyData => {
  const data = initDailyData(totalWeeks);
  if (!isRecord(value)) return data;
  const storedWeeks = Object.keys(value).map(Number).filter(n => !isNaN(n) && n >= 1);
  const maxWeek = Math.max(totalWeeks, ...storedWeeks, 0);
  for (let week = 1; week <= maxWeek; week += 1) {
    const rawWeek = value[String(week)];
    if (!isRecord(rawWeek)) {
      if (!data[week]) data[week] = createDailyWeek();
      continue;
    }
    if (!data[week]) data[week] = createDailyWeek();
    for (let day = 1; day <= DAYS_PER_WEEK; day += 1) {
      data[week][day] = normalizeDailyEntry(rawWeek[String(day)]);
    }
  }
  return data;
};

export const normalizePersistedState = (value: unknown): PersistedState => {
  const record = isRecord(value) ? value : {};
  const goals = normalizeGoals(record.goals);
  const totalWeeks = goals.totalWeeks;
  const weeklyData = normalizeWeeklyData(record.weeklyData, totalWeeks);
  const dailyData = normalizeDailyData(record.dailyData, totalWeeks);
  const viewMode: ViewMode = record.viewMode === 'daily' ? 'daily' : 'weekly';
  const activePage: Page = VALID_PAGES.includes(record.activePage as Page)
    ? (record.activePage as Page)
    : 'dashboard';
  const currentWeek = normalizeNumber(record.currentWeek, 1, 1, totalWeeks);
  const currentDay = normalizeNumber(record.currentDay, 1, 1, DAYS_PER_WEEK);
  const prepTime = normalizeNumber(record.prepTime, DEFAULT_PREP_TIME, 0, 3600);
  const totalRounds = normalizeNumber(record.totalRounds, DEFAULT_TOTAL_ROUNDS, 1, 50);
  const totalTabatas = normalizeNumber(record.totalTabatas, DEFAULT_TOTAL_TABATAS, 1, 20);
  const workTime = normalizeNumber(record.workTime, DEFAULT_WORK_TIME, 1, 3600);
  const restTime = normalizeNumber(record.restTime, DEFAULT_REST_TIME, 1, 3600);
  const onboardingDismissed = normalizeBoolean(record.onboardingDismissed);

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    goals,
    weeklyData,
    dailyData,
    currentWeek,
    currentDay,
    viewMode,
    activePage,
    prepTime,
    totalRounds,
    totalTabatas,
    workTime,
    restTime,
    onboardingDismissed,
  };
};

export const clampWeek = (value: number, max = TOTAL_WEEKS) => clampNumber(value, 1, max);
export const clampDay = (value: number) => clampNumber(value, 1, DAYS_PER_WEEK);
