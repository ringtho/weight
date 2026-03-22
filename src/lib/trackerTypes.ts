export type ViewMode = 'weekly' | 'daily';
export type TimerPhase = 'prep' | 'work' | 'rest' | 'complete';
export type Page = 'dashboard' | 'daily' | 'weekly' | 'progress' | 'timer' | 'settings';
export type Unit = 'metric' | 'imperial';
export type Sex = 'male' | 'female' | '';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type GoalsState = {
  startWeight: string;
  targetWeight: string;
  startDate: string;
  totalWeeks: number;
  // Body profile
  height: string;        // cm (metric) or inches (imperial)
  age: string;
  sex: Sex;
  unit: Unit;
  activityLevel: ActivityLevel;
  // Daily targets
  targetCalories: string;
  targetProtein: string;
  targetCarbs: string;
  targetFats: string;
  targetWater: string;   // litres (metric) or fl oz (imperial)
  targetSteps: string;
  targetSleep: string;   // hours
};

export type WeeklyEntry = {
  weight: string;
  chest: string;
  waist: string;
  hips: string;
  thighs: string;
  arms: string;
  calories: string;
  workouts: string;
  notes: string;
  progressPhotos: string[];
  bodyFat: string;       // percentage
  muscleMass: string;    // kg or lbs
};

export type MealPhoto = {
  src: string;
  tag: string;
};

export type DailyEntry = {
  weight: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
  water: string;
  fiber: string;
  sugarAlcohols: string;
  alcohol: string;
  workout: boolean;
  workoutType: string;
  duration: string;
  workoutTemplate: string;
  workoutRpe: string;
  workoutTags: string[];
  notes: string;
  mealPhotos: MealPhoto[];
  // Lifestyle tracking
  sleep: string;         // hours
  steps: string;
  mood: string;          // 1-5
  energy: string;        // 1-5
};

export type WeeklyData = Record<number, WeeklyEntry>;
export type DailyData = Record<number, Record<number, DailyEntry>>;

export type PersistedState = {
  schemaVersion: 1;
  goals: GoalsState;
  weeklyData: WeeklyData;
  dailyData: DailyData;
  currentWeek: number;
  currentDay: number;
  viewMode: ViewMode;
  activePage: Page;
  prepTime: number;
  totalRounds: number;
  totalTabatas: number;
  workTime: number;
  restTime: number;
  onboardingDismissed: boolean;
};

export type StatsSummary = {
  totalWeightLost: number;
  totalInchesLost: number;
  totalWorkouts: number;
  currentStreak: number;
};

export type CaloriesChartPoint = {
  day: string;
  calories: number;
};

export type MeasurementsChartPoint = {
  week: string;
  waist: number;
  chest: number;
  hips: number;
};

export type WeightChartPoint = {
  week: string;
  weight: number;
};

export type WeightTrendPoint = {
  week: string;
  weight: number;
  average: number | null;
  trend: number | null;
};

export type WeightProjection = {
  slope: number | null;
  projectedWeek: number | null;
  lastWeek: number | null;
};

export type MacroTotals = {
  protein: number;
  carbs: number;
  fats: number;
  water: number;
  entryCount: number;
};

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export type BodyMetrics = {
  bmi: number | null;
  bmiCategory: BMICategory | null;
  tdee: number | null;
};

export type DailyProgress = {
  calories: { value: number; target: number; pct: number };
  protein: { value: number; target: number; pct: number };
  carbs: { value: number; target: number; pct: number };
  fats: { value: number; target: number; pct: number };
  water: { value: number; target: number; pct: number };
  steps: { value: number; target: number; pct: number };
  sleep: { value: number; target: number; pct: number };
};

export type HeatmapCell = {
  week: number;
  day: number;
  level: 0 | 1 | 2 | 3 | 4;
  workout: boolean;
  label: string;
};
