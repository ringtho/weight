import type { DailyData, DailyEntry, GoalsState, WeeklyData, WeeklyEntry } from './trackerTypes';

export const TOTAL_WEEKS = 12;
export const DAYS_PER_WEEK = 7;

export const STORAGE_SCHEMA_VERSION = 1;
export const SAVE_DEBOUNCE_MS = 400;
export const DEFAULT_PREP_TIME = 10;
export const DEFAULT_TOTAL_ROUNDS = 8;
export const DEFAULT_TOTAL_TABATAS = 4;
export const DEFAULT_WORK_TIME = 20;
export const DEFAULT_REST_TIME = 10;

export const WORKOUT_TYPES = [
  'Full Body', 'Upper Body', 'Lower Body', 'Push', 'Pull', 'Legs',
  'Chest', 'Back', 'Shoulders', 'Arms', 'Abs', 'Cardio', 'HIIT',
  'Yoga', 'Pilates', 'Walk', 'Run', 'Cycle', 'Swim', 'Sports', 'Other',
];

export const WORKOUT_TAGS = [
  'Strength', 'Cardio', 'HIIT', 'Yoga', 'Pilates',
  'Walk', 'Run', 'Cycle', 'Swim', 'Sports',
];

export const createWeeklyEntry = (): WeeklyEntry => ({
  weight: '',
  chest: '',
  waist: '',
  hips: '',
  thighs: '',
  arms: '',
  calories: '',
  workouts: '',
  notes: '',
  progressPhotos: [],
  bodyFat: '',
  muscleMass: '',
});

export const createDailyEntry = (): DailyEntry => ({
  weight: '',
  calories: '',
  protein: '',
  carbs: '',
  fats: '',
  water: '',
  fiber: '',
  sugarAlcohols: '',
  alcohol: '',
  workout: false,
  workoutType: '',
  duration: '',
  workoutTemplate: '',
  workoutRpe: '',
  workoutTags: [],
  notes: '',
  mealPhotos: [],
  sleep: '',
  steps: '',
  mood: '',
  energy: '',
});

export const createDailyWeek = (): Record<number, DailyEntry> => {
  const weekData: Record<number, DailyEntry> = {};
  for (let day = 1; day <= DAYS_PER_WEEK; day += 1) {
    weekData[day] = createDailyEntry();
  }
  return weekData;
};

export const createDefaultGoals = (): GoalsState => ({
  startWeight: '',
  targetWeight: '',
  startDate: new Date().toISOString().split('T')[0],
  totalWeeks: 12,
  height: '',
  age: '',
  sex: '',
  unit: 'metric',
  activityLevel: 'moderate',
  targetCalories: '',
  targetProtein: '',
  targetCarbs: '',
  targetFats: '',
  targetWater: '',
  targetSteps: '8000',
  targetSleep: '8',
});

export const initWeeklyData = (totalWeeks = TOTAL_WEEKS): WeeklyData => {
  const data: WeeklyData = {};
  for (let i = 1; i <= totalWeeks; i += 1) {
    data[i] = createWeeklyEntry();
  }
  return data;
};

export const initDailyData = (totalWeeks = TOTAL_WEEKS): DailyData => {
  const data: DailyData = {};
  for (let week = 1; week <= totalWeeks; week += 1) {
    data[week] = createDailyWeek();
  }
  return data;
};
