import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, SplitSquareHorizontal, Layers, LayoutTemplate, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { WeeklyData } from '../../lib/trackerTypes';
import { TOTAL_WEEKS } from '../../lib/trackerData';

type ViewMode = 'split' | 'sidebyside' | 'fade';
type FitMode = 'cover' | 'contain';

type Props = {
  weeklyData: WeeklyData;
  unit?: string;
};

// ── Week grid pill ────────────────────────────────────────────────────────────

function WeekPill({
  week,
  hasPhotos,
  selected,
  role,
  onClick,
}: {
  week: number;
  hasPhotos: boolean;
  selected: 'before' | 'after' | null;
  role: 'before' | 'after';
  onClick: () => void;
}) {
  const bg =
    selected === 'before'
      ? 'rgba(124,58,237,0.8)'
      : selected === 'after'
      ? 'rgba(16,185,129,0.8)'
      : hasPhotos
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(255,255,255,0.03)';

  const border =
    selected === 'before'
      ? '1px solid rgba(124,58,237,0.9)'
      : selected === 'after'
      ? '1px solid rgba(16,185,129,0.9)'
      : hasPhotos
      ? '1px solid rgba(255,255,255,0.15)'
      : '1px solid rgba(255,255,255,0.05)';

  return (
    <button
      onClick={onClick}
      title={`Week ${week}${hasPhotos ? ' — has photos' : ''}`}
      className="w-9 h-9 rounded-lg text-xs font-mono font-semibold transition-all duration-150 flex items-center justify-center relative"
      style={{
        background: bg,
        border,
        color: selected ? '#fff' : hasPhotos ? '#cbd5e1' : '#374151',
        cursor: hasPhotos ? 'pointer' : 'default',
        transform: selected ? 'scale(1.1)' : 'scale(1)',
        boxShadow: selected === 'before'
          ? '0 0 12px rgba(124,58,237,0.4)'
          : selected === 'after'
          ? '0 0 12px rgba(16,185,129,0.4)'
          : 'none',
      }}
    >
      {week}
      {hasPhotos && !selected && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ background: '#7c3aed' }}
        />
      )}
    </button>
  );
}

// ── Stat delta chip ───────────────────────────────────────────────────────────

function StatChip({ label, before, after, unit }: { label: string; before: string; after: string; unit: string }) {
  const bVal = parseFloat(before);
  const aVal = parseFloat(after);
  const hasBoth = !Number.isNaN(bVal) && !Number.isNaN(aVal);
  const diff = hasBoth ? aVal - bVal : null;
  const isGood = label === 'Weight' || label === 'Waist' || label === 'Body Fat' ? (diff ?? 0) < 0 : (diff ?? 0) > 0;

  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-mono text-white font-semibold">
        {before || '—'} → {after || '—'}
        {unit && <span className="text-slate-500 ml-1 text-xs">{unit}</span>}
      </div>
      {diff !== null && (
        <div
          className="text-xs font-mono font-bold"
          style={{ color: isGood ? '#10b981' : '#f43f5e' }}
        >
          {diff > 0 ? '+' : ''}{diff.toFixed(1)} {unit}
        </div>
      )}
    </div>
  );
}

// ── Main comparison viewer modal ───────────────────────────────────────────────

function CompareViewer({
  weeklyData,
  unit,
  beforeWeek,
  afterWeek,
  beforePhotoIndex,
  afterPhotoIndex,
  onClose,
  onBeforeWeekChange,
  onAfterWeekChange,
}: {
  weeklyData: WeeklyData;
  unit: string;
  beforeWeek: number;
  afterWeek: number;
  beforePhotoIndex: number;
  afterPhotoIndex: number;
  onClose: () => void;
  onBeforeWeekChange: (w: number) => void;
  onAfterWeekChange: (w: number) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  const [split, setSplit] = useState(50);
  const [fade, setFade] = useState(50); // 0=before, 100=after
  const [isAnimating, setIsAnimating] = useState(false);
  const isDraggingRef = useRef(false);
  const compareRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const animDirRef = useRef(1);

  const weekOptions = useMemo(() => Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1), []);
  const getPhotos = (w: number) => weeklyData[w]?.progressPhotos ?? [];

  const beforePhoto = getPhotos(beforeWeek)[beforePhotoIndex] ?? null;
  const afterPhoto = getPhotos(afterWeek)[afterPhotoIndex] ?? null;
  const canCompare = Boolean(beforePhoto && afterPhoto);

  // Auto-animate fade mode
  useEffect(() => {
    if (!isAnimating || viewMode !== 'fade') return;
    const step = () => {
      setFade((prev) => {
        const next = prev + animDirRef.current * 1.2;
        if (next >= 100) { animDirRef.current = -1; return 100; }
        if (next <= 0) { animDirRef.current = 1; return 0; }
        return next;
      });
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isAnimating, viewMode]);

  // Drag-to-split
  const updateSplitFromClientX = (clientX: number) => {
    const el = compareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSplit(Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))));
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t?.tagName === 'INPUT' || t?.tagName === 'SELECT') return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowLeft' && viewMode === 'split') { e.preventDefault(); setSplit((p) => Math.max(0, p - 2)); }
      if (e.key === 'ArrowRight' && viewMode === 'split') { e.preventDefault(); setSplit((p) => Math.min(100, p + 2)); }
      if (e.key === '1') setViewMode('split');
      if (e.key === '2') setViewMode('sidebyside');
      if (e.key === '3') setViewMode('fade');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewMode, onClose]);

  // Pointer up
  useEffect(() => {
    const up = () => { isDraggingRef.current = false; };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, []);

  const mUnit = unit === 'lbs' ? 'in' : 'cm';
  const bData = weeklyData[beforeWeek];
  const aData = weeklyData[afterWeek];

  const imgStyle = (fit: FitMode): React.CSSProperties => ({
    width: '100%',
    height: '100%',
    objectFit: fit,
    display: 'block',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    pointerEvents: 'none',
  });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#080810' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Top bar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,8,16,0.95)' }}
      >
        <div className="flex items-center gap-4">
          {/* View mode toggles */}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {([
              { id: 'split', icon: <SplitSquareHorizontal size={14} />, label: 'Split' },
              { id: 'sidebyside', icon: <LayoutTemplate size={14} />, label: 'Side by Side' },
              { id: 'fade', icon: <Layers size={14} />, label: 'Fade' },
            ] as { id: ViewMode; icon: React.ReactNode; label: string }[]).map((m) => (
              <button
                key={m.id}
                onClick={() => { setViewMode(m.id); setIsAnimating(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: viewMode === m.id ? 'rgba(124,58,237,0.5)' : 'transparent',
                  color: viewMode === m.id ? '#e9d5ff' : '#64748b',
                  border: viewMode === m.id ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Fit mode */}
          <button
            onClick={() => setFitMode((f) => f === 'cover' ? 'contain' : 'cover')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
            title="Toggle fit/fill"
          >
            {fitMode === 'cover' ? <ZoomIn size={13} /> : <ZoomOut size={13} />}
            {fitMode === 'cover' ? 'Fill' : 'Fit'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-white hidden sm:block">
            <span style={{ color: '#a78bfa' }}>Week {beforeWeek}</span>
            <span className="text-slate-500 mx-2">vs</span>
            <span style={{ color: '#34d399' }}>Week {afterWeek}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Week selectors ── */}
      <div
        className="shrink-0 flex items-center gap-6 px-5 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Before row */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs font-semibold w-12 text-right" style={{ color: '#a78bfa' }}>Before</div>
          <div className="flex gap-1.5 flex-wrap">
            {weekOptions.map((w) => (
              <WeekPill
                key={w}
                week={w}
                hasPhotos={getPhotos(w).length > 0}
                selected={w === beforeWeek ? 'before' : w === afterWeek ? 'after' : null}
                role="before"
                onClick={() => {
                  if (w >= afterWeek || !getPhotos(w).length) return;
                  onBeforeWeekChange(w);
                }}
              />
            ))}
          </div>
        </div>

        <div className="w-px h-8 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* After row */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs font-semibold w-12 text-right" style={{ color: '#34d399' }}>After</div>
          <div className="flex gap-1.5 flex-wrap">
            {weekOptions.map((w) => (
              <WeekPill
                key={w}
                week={w}
                hasPhotos={getPhotos(w).length > 0}
                selected={w === afterWeek ? 'after' : w === beforeWeek ? 'before' : null}
                role="after"
                onClick={() => {
                  if (w <= beforeWeek || !getPhotos(w).length) return;
                  onAfterWeekChange(w);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main viewer area ── */}
      <div className="flex-1 flex flex-col min-h-0">
        {canCompare ? (
          <>
            {/* Image area */}
            <div className="flex-1 min-h-0 relative select-none">

              {/* SPLIT mode */}
              {viewMode === 'split' && (
                <div
                  ref={compareRef}
                  className="absolute inset-0"
                  style={{ cursor: 'col-resize', touchAction: 'none' }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    isDraggingRef.current = true;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    updateSplitFromClientX(e.clientX);
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingRef.current) return;
                    updateSplitFromClientX(e.clientX);
                  }}
                  onPointerUp={(e) => {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    isDraggingRef.current = false;
                  }}
                  onPointerCancel={(e) => {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    isDraggingRef.current = false;
                  }}
                >
                  {/* After photo — full background */}
                  <img src={afterPhoto!} alt="After" style={{ ...imgStyle(fitMode), position: 'absolute', inset: 0 }} draggable={false} />

                  {/* Before photo — clipped left */}
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${split}%` }}>
                    <img src={beforePhoto!} alt="Before" style={{ ...imgStyle(fitMode), position: 'absolute', inset: 0, width: '100%', height: '100%' }} draggable={false} />
                  </div>

                  {/* Labels */}
                  <div
                    className="absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold tracking-wide"
                    style={{ background: 'rgba(124,58,237,0.85)', color: '#fff', border: '1px solid rgba(167,139,250,0.4)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                  >
                    Week {beforeWeek} · Before
                  </div>
                  <div
                    className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-bold tracking-wide"
                    style={{ background: 'rgba(16,185,129,0.85)', color: '#fff', border: '1px solid rgba(52,211,153,0.4)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
                  >
                    Week {afterWeek} · After
                  </div>

                  {/* Divider line */}
                  <div
                    className="absolute inset-y-0 pointer-events-none"
                    style={{ left: `${split}%`, transform: 'translateX(-50%)', width: 2, background: 'rgba(255,255,255,0.9)', boxShadow: '0 0 12px rgba(255,255,255,0.5)' }}
                  />

                  {/* Handle */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-1"
                    style={{ left: `${split}%` }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #10b981)',
                        border: '2px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 0 24px rgba(124,58,237,0.6), 0 4px 12px rgba(0,0,0,0.5)',
                      }}
                    >
                      ‹›
                    </div>
                  </div>
                </div>
              )}

              {/* SIDE-BY-SIDE mode */}
              {viewMode === 'sidebyside' && (
                <div className="absolute inset-0 flex">
                  <div className="flex-1 relative">
                    <img src={beforePhoto!} alt="Before" style={{ ...imgStyle(fitMode), position: 'absolute', inset: 0 }} draggable={false} />
                    <div
                      className="absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: 'rgba(124,58,237,0.85)', color: '#fff', border: '1px solid rgba(167,139,250,0.4)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}
                    >
                      Week {beforeWeek} · Before
                    </div>
                  </div>
                  <div className="w-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="flex-1 relative">
                    <img src={afterPhoto!} alt="After" style={{ ...imgStyle(fitMode), position: 'absolute', inset: 0 }} draggable={false} />
                    <div
                      className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: 'rgba(16,185,129,0.85)', color: '#fff', border: '1px solid rgba(52,211,153,0.4)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}
                    >
                      Week {afterWeek} · After
                    </div>
                  </div>
                </div>
              )}

              {/* FADE mode */}
              {viewMode === 'fade' && (
                <div className="absolute inset-0">
                  <img src={beforePhoto!} alt="Before" style={{ ...imgStyle(fitMode), position: 'absolute', inset: 0, opacity: 1 - fade / 100 }} draggable={false} />
                  <img src={afterPhoto!} alt="After" style={{ ...imgStyle(fitMode), position: 'absolute', inset: 0, opacity: fade / 100 }} draggable={false} />
                  <div
                    className="absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold transition-opacity"
                    style={{ background: 'rgba(124,58,237,0.85)', color: '#fff', border: '1px solid rgba(167,139,250,0.4)', opacity: 1 - fade / 100 }}
                  >
                    Week {beforeWeek} · Before
                  </div>
                  <div
                    className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-bold transition-opacity"
                    style={{ background: 'rgba(16,185,129,0.85)', color: '#fff', border: '1px solid rgba(52,211,153,0.4)', opacity: fade / 100 }}
                  >
                    Week {afterWeek} · After
                  </div>
                </div>
              )}
            </div>

            {/* ── Bottom control bar ── */}
            <div
              className="shrink-0 flex flex-col gap-2 px-5 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,8,16,0.95)' }}
            >
              {/* Slider */}
              {viewMode === 'split' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-14 text-right" style={{ color: '#a78bfa' }}>Before</span>
                  <input
                    type="range" min="0" max="100" value={split}
                    onChange={(e) => setSplit(Number(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none"
                    style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
                  />
                  <span className="text-xs font-semibold w-14" style={{ color: '#34d399' }}>After</span>
                </div>
              )}
              {viewMode === 'fade' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-14 text-right" style={{ color: '#a78bfa' }}>Before</span>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range" min="0" max="100" value={fade}
                      onChange={(e) => { setFade(Number(e.target.value)); setIsAnimating(false); }}
                      className="flex-1 h-1.5 rounded-full appearance-none"
                      style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
                    />
                    <button
                      onClick={() => setIsAnimating((a) => !a)}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0"
                      style={{
                        background: isAnimating ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)',
                        border: isAnimating ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        color: isAnimating ? '#e9d5ff' : '#94a3b8',
                      }}
                    >
                      {isAnimating ? '⏸ Pause' : '▶ Auto'}
                    </button>
                  </div>
                  <span className="text-xs font-semibold w-14" style={{ color: '#34d399' }}>After</span>
                </div>
              )}
              {viewMode === 'sidebyside' && (
                <p className="text-xs text-center text-slate-600">Tip: switch to Split or Fade for interactive comparison</p>
              )}

              {/* Stats strip */}
              <div className="flex flex-wrap gap-2 justify-center">
                <StatChip label="Weight" before={bData?.weight} after={aData?.weight} unit={unit} />
                {(bData?.waist || aData?.waist) && (
                  <StatChip label="Waist" before={bData?.waist} after={aData?.waist} unit={mUnit} />
                )}
                {(bData?.bodyFat || aData?.bodyFat) && (
                  <StatChip label="Body Fat" before={bData?.bodyFat} after={aData?.bodyFat} unit="%" />
                )}
                {(bData?.chest || aData?.chest) && (
                  <StatChip label="Chest" before={bData?.chest} after={aData?.chest} unit={mUnit} />
                )}
              </div>

              {/* Hints */}
              <p className="text-xs text-center text-slate-700">
                {viewMode === 'split' ? 'Drag image or slider · ←/→ keys · ' : ''}
                Keys 1 / 2 / 3 switch modes · ESC closes
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
            <SplitSquareHorizontal size={48} className="opacity-20" />
            <p className="text-sm">Select two weeks that both have progress photos.</p>
            <p className="text-xs text-slate-700">Weeks with a dot (●) have photos — click them above.</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Panel (embedded in Progress page) ────────────────────────────────────────

export default function ComparisonPanel({ weeklyData, unit = 'kg' }: Props) {
  const [beforeWeek, setBeforeWeek] = useState(1);
  const [afterWeek, setAfterWeek] = useState(TOTAL_WEEKS);
  const [beforePhotoIndex, setBeforePhotoIndex] = useState(0);
  const [afterPhotoIndex, setAfterPhotoIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  const weekOptions = useMemo(() => Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1), []);
  const getPhotos = (w: number) => weeklyData[w]?.progressPhotos ?? [];
  const beforePhotos = getPhotos(beforeWeek);
  const afterPhotos = getPhotos(afterWeek);
  const beforePhoto = beforePhotos[beforePhotoIndex] ?? null;
  const afterPhoto = afterPhotos[afterPhotoIndex] ?? null;
  const canCompare = Boolean(beforePhoto && afterPhoto);
  const weeksWithPhotos = weekOptions.filter((w) => getPhotos(w).length > 0);

  useEffect(() => {
    setBeforePhotoIndex((i) => Math.min(i, Math.max(0, beforePhotos.length - 1)));
  }, [beforePhotos.length]);

  useEffect(() => {
    setAfterPhotoIndex((i) => Math.min(i, Math.max(0, afterPhotos.length - 1)));
  }, [afterPhotos.length]);

  const handleBeforeWeek = (w: number) => {
    const clamped = Math.min(w, afterWeek - 1);
    setBeforeWeek(clamped);
    const p = getPhotos(clamped);
    setBeforePhotoIndex(p.length > 0 ? p.length - 1 : 0);
  };

  const handleAfterWeek = (w: number) => {
    const clamped = Math.max(w, beforeWeek + 1);
    setAfterWeek(clamped);
    const p = getPhotos(clamped);
    setAfterPhotoIndex(p.length > 0 ? p.length - 1 : 0);
  };

  return (
    <div>
      {/* Before / After cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Before */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="eyebrow mb-0.5" style={{ color: '#a78bfa' }}>Before</div>
              <div className="text-white font-semibold">Week {beforeWeek}</div>
            </div>
            <select
              className="dark-select text-xs"
              value={beforeWeek}
              onChange={(e) => handleBeforeWeek(Number(e.target.value))}
            >
              {weekOptions.filter((w) => w < afterWeek).map((w) => (
                <option key={w} value={w}>Week {w}{getPhotos(w).length ? ' ●' : ''}</option>
              ))}
            </select>
          </div>

          {beforePhoto ? (
            <div className="rounded-xl overflow-hidden aspect-square bg-white/5" style={{ border: '1px solid rgba(124,58,237,0.2)' }}>
              <img src={beforePhoto} alt={`Week ${beforeWeek}`} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 text-slate-600 text-sm" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
              <span>No photo</span>
              <span className="text-xs">Upload in Weekly Check-in</span>
            </div>
          )}

          {beforePhotos.length > 1 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {beforePhotos.map((src, i) => (
                <button key={i} onClick={() => setBeforePhotoIndex(i)} className="shrink-0 w-12 h-12 rounded-lg overflow-hidden" style={{ border: `2px solid ${i === beforePhotoIndex ? '#7c3aed' : 'rgba(255,255,255,0.1)'}` }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-1 text-sm text-slate-400">
            {weeklyData[beforeWeek]?.weight && <div>Weight: <span className="text-white font-mono">{weeklyData[beforeWeek].weight} {unit}</span></div>}
            {weeklyData[beforeWeek]?.waist && <div>Waist: <span className="text-white font-mono">{weeklyData[beforeWeek].waist}</span></div>}
            {weeklyData[beforeWeek]?.bodyFat && <div>Body Fat: <span className="text-white font-mono">{weeklyData[beforeWeek].bodyFat}%</span></div>}
          </div>
        </div>

        {/* After */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="eyebrow mb-0.5" style={{ color: '#34d399' }}>After</div>
              <div className="text-white font-semibold">Week {afterWeek}</div>
            </div>
            <select
              className="dark-select text-xs"
              value={afterWeek}
              onChange={(e) => handleAfterWeek(Number(e.target.value))}
            >
              {weekOptions.filter((w) => w > beforeWeek).map((w) => (
                <option key={w} value={w}>Week {w}{getPhotos(w).length ? ' ●' : ''}</option>
              ))}
            </select>
          </div>

          {afterPhoto ? (
            <div className="rounded-xl overflow-hidden aspect-square bg-white/5" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
              <img src={afterPhoto} alt={`Week ${afterWeek}`} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 text-slate-600 text-sm" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
              <span>No photo</span>
              <span className="text-xs">Upload in Weekly Check-in</span>
            </div>
          )}

          {afterPhotos.length > 1 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {afterPhotos.map((src, i) => (
                <button key={i} onClick={() => setAfterPhotoIndex(i)} className="shrink-0 w-12 h-12 rounded-lg overflow-hidden" style={{ border: `2px solid ${i === afterPhotoIndex ? '#10b981' : 'rgba(255,255,255,0.1)'}` }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-1 text-sm text-slate-400">
            {weeklyData[afterWeek]?.weight && <div>Weight: <span className="text-white font-mono">{weeklyData[afterWeek].weight} {unit}</span></div>}
            {weeklyData[afterWeek]?.waist && <div>Waist: <span className="text-white font-mono">{weeklyData[afterWeek].waist}</span></div>}
            {weeklyData[afterWeek]?.bodyFat && <div>Body Fat: <span className="text-white font-mono">{weeklyData[afterWeek].bodyFat}%</span></div>}
          </div>
        </div>
      </div>

      {/* Delta strip */}
      {weeklyData[beforeWeek]?.weight && weeklyData[afterWeek]?.weight && (() => {
        const diff = parseFloat(weeklyData[afterWeek].weight) - parseFloat(weeklyData[beforeWeek].weight);
        const isLoss = diff < 0;
        return (
          <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-4 flex-wrap" style={{ background: isLoss ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)', border: `1px solid ${isLoss ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)'}` }}>
            <div className="text-2xl font-mono font-bold" style={{ color: isLoss ? '#10b981' : '#f43f5e' }}>
              {isLoss ? '↓' : '↑'} {Math.abs(diff).toFixed(1)} {unit}
            </div>
            <div className="text-sm text-slate-400">
              {isLoss ? 'lost' : 'gained'} from Week {beforeWeek} → Week {afterWeek}
              <span className="ml-2 text-slate-600 text-xs">({afterWeek - beforeWeek} week{afterWeek - beforeWeek !== 1 ? 's' : ''})</span>
            </div>
            {(parseFloat(weeklyData[afterWeek].weight) / parseFloat(weeklyData[beforeWeek].weight)) > 0 && (
              <div className="ml-auto text-xs text-slate-500">
                {((Math.abs(diff) / parseFloat(weeklyData[beforeWeek].weight)) * 100).toFixed(1)}% of start weight
              </div>
            )}
          </div>
        );
      })()}

      {/* Open button */}
      <button
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${canCompare ? '' : 'opacity-40 pointer-events-none'}`}
        style={{
          background: canCompare ? 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(16,185,129,0.5))' : 'rgba(255,255,255,0.05)',
          border: canCompare ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.08)',
          color: '#fff',
          boxShadow: canCompare ? '0 0 24px rgba(124,58,237,0.2)' : 'none',
        }}
        onClick={() => setViewerOpen(true)}
      >
        <Maximize2 size={16} />
        {canCompare ? 'Open Full-Screen Viewer' : 'Add photos to both weeks to compare'}
      </button>

      {weeksWithPhotos.length === 0 && (
        <p className="text-xs text-slate-700 text-center mt-3">
          Upload progress photos in Weekly Check-in → Progress Photos section.
        </p>
      )}

      {/* Full-screen viewer */}
      {viewerOpen && (
        <CompareViewer
          weeklyData={weeklyData}
          unit={unit}
          beforeWeek={beforeWeek}
          afterWeek={afterWeek}
          beforePhotoIndex={beforePhotoIndex}
          afterPhotoIndex={afterPhotoIndex}
          onClose={() => setViewerOpen(false)}
          onBeforeWeekChange={handleBeforeWeek}
          onAfterWeekChange={handleAfterWeek}
        />
      )}
    </div>
  );
}
