import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, BookOpen, CalendarCheck, TrendingUp, Timer,
  Settings, Flame, Shield,
} from 'lucide-react';
import Sidebar from './components/tracker/Sidebar';
import DashboardPage from './components/tracker/DashboardPage';
import DailyLogPage from './components/tracker/DailyLogPage';
import WeeklyCheckinPage from './components/tracker/WeeklyCheckinPage';
import ProgressPage from './components/tracker/ProgressPage';
import TimerPage from './components/tracker/TimerPage';
import SettingsPage from './components/tracker/SettingsPage';

import AdminPage from './components/admin/AdminPage';
import { clearState, readState, writeState, API_BASE_URL } from './lib/trackerApi';
import {
  calculateBodyMetrics,
  calculateProgress,
  calculateStats,
  buildHeatmap,
  getCaloriesChartData,
  getDailyProgress,
  getMeasurementsChartData,
  getWeightChartData,
  getWeightTrendData,
  getWeightProjection,
  getWeeklyMacroTotals,
} from './lib/trackerCalculations';
import {
  DEFAULT_PREP_TIME, DEFAULT_REST_TIME, DEFAULT_TOTAL_ROUNDS,
  DEFAULT_TOTAL_TABATAS, DEFAULT_WORK_TIME, DAYS_PER_WEEK, SAVE_DEBOUNCE_MS,
  STORAGE_SCHEMA_VERSION, TOTAL_WEEKS,
  createDailyEntry, createDailyWeek, createDefaultGoals, createWeeklyEntry,
  initDailyData, initWeeklyData,
} from './lib/trackerData';
import { clampDay, clampWeek, normalizePersistedState } from './lib/trackerNormalization';
import { formatFullDateLabel, getWeekDayFromDate } from './lib/trackerDates';
import type {
  DailyEntry, DailyData, GoalsState, MealPhoto, Page,
  PersistedState, WeeklyData, WeeklyEntry,
} from './lib/trackerTypes';
import type { AuthUser } from './lib/authApi';

const NAV_PAGES: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'daily', label: 'Daily Log', icon: <BookOpen size={16} /> },
  { id: 'weekly', label: 'Weekly Check-in', icon: <CalendarCheck size={16} /> },
  { id: 'progress', label: 'Progress', icon: <TrendingUp size={16} /> },
  { id: 'timer', label: 'Timer', icon: <Timer size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

type Props = { user: AuthUser; onLogout: () => void };

export default function FatLossTracker({ user, onLogout }: Props) {
  // ── Navigation ────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [showAdmin, setShowAdmin] = useState(false);

  // ── Data state ────────────────────────────────────────────────────────────
  const [goals, setGoals] = useState<GoalsState>(() => createDefaultGoals());
  const [weeklyData, setWeeklyData] = useState<WeeklyData>(() => initWeeklyData());
  const [dailyData, setDailyData] = useState<DailyData>(() => initDailyData());
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);

  // ── Timer settings (persisted) ────────────────────────────────────────────
  const [prepTime, setPrepTime] = useState(DEFAULT_PREP_TIME);
  const [workTime, setWorkTime] = useState(DEFAULT_WORK_TIME);
  const [restTime, setRestTime] = useState(DEFAULT_REST_TIME);
  const [totalRounds, setTotalRounds] = useState(DEFAULT_TOTAL_ROUNDS);
  const [totalTabatas, setTotalTabatas] = useState(DEFAULT_TOTAL_TABATAS);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const hasLoadedRef = useRef(false);
  const latestStateRef = useRef<PersistedState | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const buildPersistedState = (): PersistedState => ({
    schemaVersion: STORAGE_SCHEMA_VERSION,
    goals,
    weeklyData,
    dailyData,
    currentWeek,
    currentDay,
    viewMode: 'weekly',
    activePage,
    prepTime,
    workTime,
    restTime,
    totalRounds,
    totalTabatas,
    onboardingDismissed,
  });

  const applyPersistedState = (state: PersistedState) => {
    setGoals(state.goals);
    setWeeklyData(state.weeklyData);
    setDailyData(state.dailyData);
    setCurrentWeek(clampWeek(state.currentWeek));
    setCurrentDay(clampDay(state.currentDay));
    setActivePage(state.activePage ?? 'dashboard');
    setPrepTime(state.prepTime);
    setWorkTime(state.workTime);
    setRestTime(state.restTime);
    setTotalRounds(state.totalRounds);
    setTotalTabatas(state.totalTabatas);
    setOnboardingDismissed(state.onboardingDismissed ?? false);
  };

  // ── Load from backend ─────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const stored = await readState();
        if (!active || !stored) { hasLoadedRef.current = true; return; }
        applyPersistedState(stored);
        const todayPos = getWeekDayFromDate(stored.goals.startDate, new Date(), stored.goals.totalWeeks);
        if (todayPos) {
          setCurrentWeek(clampWeek(todayPos.week, stored.goals.totalWeeks));
          setCurrentDay(clampDay(todayPos.day));
        }
      } catch { /* ignore */ } finally {
        hasLoadedRef.current = true;
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  // ── Auto-save (debounced) ─────────────────────────────────────────────────
  const allDeps = [goals, weeklyData, dailyData, currentWeek, currentDay, activePage,
    prepTime, workTime, restTime, totalRounds, totalTabatas, onboardingDismissed];

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (saveTimeoutRef.current !== null) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      const payload = buildPersistedState();
      void writeState(payload).catch(() => undefined);
    }, SAVE_DEBOUNCE_MS);
    return () => { if (saveTimeoutRef.current !== null) window.clearTimeout(saveTimeoutRef.current); };
  }, allDeps);

  // ── Keep latest state ref (for beforeunload) ───────────────────────────────
  useEffect(() => {
    latestStateRef.current = buildPersistedState();
  }, allDeps);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const payload = latestStateRef.current ?? buildPersistedState();
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE_URL}/api/state`, blob);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Auto-sync weekly averages from daily logs ──────────────────────────────
  useEffect(() => {
    setWeeklyData((prev) => {
      let changed = false;
      const next = { ...prev };
      const syncMax = Math.max(goals.totalWeeks, ...Object.keys(dailyData).map(Number).filter(n => !isNaN(n)));
      for (let week = 1; week <= syncMax; week++) {
        const days = dailyData[week];
        if (!days) continue;
        let calSum = 0, calCount = 0, wtSum = 0, wtCount = 0, workoutCount = 0;
        for (let day = 1; day <= DAYS_PER_WEEK; day++) {
          const e = days[day];
          if (!e) continue;
          const c = parseFloat(e.calories);
          if (!Number.isNaN(c)) { calSum += c; calCount++; }
          const w = parseFloat(e.weight);
          if (!Number.isNaN(w)) { wtSum += w; wtCount++; }
          if (e.workout) workoutCount++;
        }
        const updates: Partial<WeeklyEntry> = {};
        if (calCount > 0) updates.calories = String(Math.round(calSum / calCount));
        if (wtCount > 0) updates.weight = (wtSum / wtCount).toFixed(1);
        if (workoutCount > 0) updates.workouts = String(workoutCount);
        if (Object.keys(updates).length > 0) {
          const nextEntry = { ...prev[week], ...updates };
          if (nextEntry.calories !== prev[week].calories ||
              nextEntry.weight !== prev[week].weight ||
              nextEntry.workouts !== prev[week].workouts) {
            next[week] = nextEntry;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [dailyData]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const t = e.target as HTMLElement;
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.tagName === 'SELECT' || t?.isContentEditable) return;
      if (e.key.toLowerCase() === 't') { e.preventDefault(); handleJumpToToday(); }
      if (activePage === 'daily') {
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigateDay(-1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); navigateDay(1); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activePage, currentWeek, currentDay, goals.startDate]);

  // ── Navigation helpers ────────────────────────────────────────────────────

  function handleJumpToToday() {
    const pos = getWeekDayFromDate(goals.startDate, new Date(), goals.totalWeeks);
    if (!pos) return;
    setCurrentWeek(clampWeek(pos.week, goals.totalWeeks));
    setCurrentDay(clampDay(pos.day));
    setActivePage('daily');
  }

  function navigateDay(delta: number) {
    const total = goals.totalWeeks * DAYS_PER_WEEK;
    const idx = (currentWeek - 1) * DAYS_PER_WEEK + (currentDay - 1) + delta;
    if (idx < 0 || idx >= total) return;
    setCurrentWeek(clampWeek(Math.floor(idx / DAYS_PER_WEEK) + 1, goals.totalWeeks));
    setCurrentDay(clampDay((idx % DAYS_PER_WEEK) + 1));
  }

  const handleExtendProgram = () => {
    setGoals(prev => ({ ...prev, totalWeeks: prev.totalWeeks + 12 }));
  };

  // ── Data handlers ─────────────────────────────────────────────────────────

  const handleUpdateWeek = (week: number, entry: WeeklyEntry) =>
    setWeeklyData((prev) => ({ ...prev, [week]: entry }));

  const handleUpdateDay = (week: number, day: number, entry: DailyEntry) =>
    setDailyData((prev) => ({ ...prev, [week]: { ...prev[week], [day]: entry } }));

  const handleResetWeek = (week: number) => {
    setWeeklyData((prev) => ({ ...prev, [week]: createWeeklyEntry() }));
    setDailyData((prev) => ({ ...prev, [week]: createDailyWeek() }));
  };

  const handleResetAll = async () => {
    setGoals(createDefaultGoals());
    setWeeklyData(initWeeklyData());
    setDailyData(initDailyData());
    setCurrentWeek(1);
    setCurrentDay(1);
    setActivePage('dashboard');
    setPrepTime(DEFAULT_PREP_TIME);
    setWorkTime(DEFAULT_WORK_TIME);
    setRestTime(DEFAULT_REST_TIME);
    setTotalRounds(DEFAULT_TOTAL_ROUNDS);
    setTotalTabatas(DEFAULT_TOTAL_TABATAS);
    setOnboardingDismissed(false);
    try { await clearState(); } catch { /* ignore */ }
  };

  // ── Photo helpers ─────────────────────────────────────────────────────────

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => rej(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });

  const handleAddProgressPhoto = async (week: number, file: File) => {
    try {
      const src = await readFileAsDataUrl(file);
      if (!src) return;
      setWeeklyData((prev) => ({
        ...prev,
        [week]: { ...prev[week], progressPhotos: [...(prev[week].progressPhotos ?? []), src] },
      }));
    } catch { window.alert('Could not read that photo.'); }
  };

  const handleAddMealPhoto = async (week: number, day: number, file: File) => {
    try {
      const src = await readFileAsDataUrl(file);
      if (!src) return;
      setDailyData((prev) => ({
        ...prev,
        [week]: {
          ...prev[week],
          [day]: {
            ...prev[week][day],
            mealPhotos: [...(prev[week][day].mealPhotos ?? []), { src, tag: '' }],
          },
        },
      }));
    } catch { window.alert('Could not read that photo.'); }
  };

  // ── Export/Import ──────────────────────────────────────────────────────────

  const handleExportTxt = () => {
    const stats = calculateStats(weeklyData, dailyData);
    const unit = goals.unit === 'imperial' ? 'lbs' : 'kg';
    let content = `FAT LOSS TRACKER — 12-WEEK PROGRESS REPORT\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `GOALS\nStart Weight: ${goals.startWeight} ${unit}\nTarget Weight: ${goals.targetWeight} ${unit}\n\n`;
    content += `RESULTS\nWeight Lost: ${stats.totalWeightLost.toFixed(1)} ${unit}\nInches Lost: ${stats.totalInchesLost.toFixed(1)}\nTotal Workouts: ${stats.totalWorkouts}\nWeek Streak: ${stats.currentStreak}\n\n`;
    content += `WEEK-BY-WEEK\n`;
    for (let w = 1; w <= TOTAL_WEEKS; w++) {
      const e = weeklyData[w];
      if (e.weight || e.notes) {
        content += `Week ${w}: ${e.weight ? `${e.weight}${unit}` : '—'} | Workouts: ${e.workouts || '0'} | Notes: ${e.notes || '—'}\n`;
      }
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fat-loss-progress.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupJson = () => {
    const payload = buildPersistedState();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fat-loss-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!window.confirm('Replace your current data with this backup? This cannot be undone.')) return;
      applyPersistedState(normalizePersistedState(parsed));
    } catch { window.alert('Could not read that JSON backup file.'); }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const stats = calculateStats(weeklyData, dailyData);
  const progress = calculateProgress(goals, weeklyData);

  // Get current weight (latest weekly entry or start weight)
  const latestWeekWithWeight = Object.keys(weeklyData).map(Number).filter((w) => weeklyData[w].weight).sort((a, b) => b - a)[0];
  const currentWeight = latestWeekWithWeight ? weeklyData[latestWeekWithWeight].weight : goals.startWeight;

  const bodyMetrics = calculateBodyMetrics(goals, currentWeight);
  const todayPos = getWeekDayFromDate(goals.startDate, new Date());
  const todayEntry = todayPos ? (dailyData[todayPos.week]?.[todayPos.day] ?? createDailyEntry()) : createDailyEntry();
  const todayProgress = getDailyProgress(todayEntry, goals);
  const programDay = todayPos ? (todayPos.week - 1) * DAYS_PER_WEEK + todayPos.day : (currentWeek - 1) * DAYS_PER_WEEK + currentDay;
  const weightChartData = getWeightChartData(weeklyData);
  const trendData = getWeightTrendData(weeklyData);
  const projection = getWeightProjection(weeklyData, goals);
  const measurementsData = getMeasurementsChartData(weeklyData);
  const caloriesData = getCaloriesChartData(dailyData, currentWeek, goals.startDate);
  const weeklyMacroTotals = getWeeklyMacroTotals(dailyData, currentWeek);
  const heatmap = buildHeatmap(dailyData, weeklyData);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (showAdmin) {
    return <AdminPage currentUser={user} onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="app-shell">
      {/* Hidden file input for JSON import */}
      <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />

      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          currentWeek={currentWeek}
          totalWeeks={goals.totalWeeks}
          streak={stats.currentStreak}
          programDay={programDay}
          displayName={user.name || user.username}
          isAdmin={user.role === 'admin'}
          onAdminClick={() => setShowAdmin(true)}
          onLogout={onLogout}
        />
      </div>

      {/* Main content */}
      <main className="main-content" style={{ paddingBottom: '80px' }}>
        {activePage === 'dashboard' && (
          <DashboardPage
            goals={goals}
            weeklyData={weeklyData}
            dailyData={dailyData}
            currentWeek={currentWeek}
            currentDay={currentDay}
            stats={stats}
            progress={progress}
            bodyMetrics={bodyMetrics}
            todayEntry={todayEntry}
            todayProgress={todayProgress}
            programDay={programDay}
            onNavigate={setActivePage}
            onGoToToday={handleJumpToToday}
            onExtendProgram={handleExtendProgram}
          />
        )}

        {activePage === 'daily' && (
          <DailyLogPage
            goals={goals}
            dailyData={dailyData}
            currentWeek={currentWeek}
            currentDay={currentDay}
            todayProgress={todayProgress}
            onUpdateDay={handleUpdateDay}
            onNavigateDay={(week, day) => { setCurrentWeek(clampWeek(week, goals.totalWeeks)); setCurrentDay(clampDay(day)); }}
            totalWeeks={goals.totalWeeks}
            startDate={goals.startDate}
            onAddMealPhoto={handleAddMealPhoto}
          />
        )}

        {activePage === 'weekly' && (
          <WeeklyCheckinPage
            goals={goals}
            weeklyData={weeklyData}
            dailyData={dailyData}
            currentWeek={currentWeek}
            weeklyMacroTotals={weeklyMacroTotals}
            onUpdateWeek={handleUpdateWeek}
            onSelectWeek={(week) => setCurrentWeek(clampWeek(week, goals.totalWeeks))}
            onResetWeek={handleResetWeek}
            onAddProgressPhoto={handleAddProgressPhoto}
          />
        )}

        {activePage === 'progress' && (
          <ProgressPage
            goals={goals}
            weeklyData={weeklyData}
            dailyData={dailyData}
            currentWeek={currentWeek}
            weightChartData={weightChartData}
            trendData={trendData}
            projection={projection}
            measurementsData={measurementsData}
            caloriesData={caloriesData}
            heatmap={heatmap}
            startDate={goals.startDate}
          />
        )}

        {activePage === 'timer' && (
          <TimerPage
            settings={{ prepTime, workTime, restTime, totalRounds, totalTabatas }}
            onUpdateSettings={(s) => {
              setPrepTime(s.prepTime);
              setWorkTime(s.workTime);
              setRestTime(s.restTime);
              setTotalRounds(s.totalRounds);
              setTotalTabatas(s.totalTabatas);
            }}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            goals={goals}
            onUpdateGoals={setGoals}
            onExportTxt={handleExportTxt}
            onBackupJson={handleBackupJson}
            onImportJson={handleImportJson}
            onResetAll={handleResetAll}
            tdee={bodyMetrics.tdee}
          />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav md:hidden">
        {NAV_PAGES.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        {user.role === 'admin' && (
          <button className="mobile-nav-item" onClick={() => setShowAdmin(true)} style={{ color: '#f59e0b' }}>
            <Shield size={16} />
            <span>Admin</span>
          </button>
        )}
      </nav>
    </div>
  );
}
