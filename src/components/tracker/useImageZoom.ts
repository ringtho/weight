import { useCallback, useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };

type ZoomConfig = {
  min?: number;
  max?: number;
  step?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function useImageZoom(config: ZoomConfig = {}) {
  const minZoom = config.min ?? 1;
  const maxZoom = config.max ?? 3;
  const step = config.step ?? 0.2;

  const [zoom, setZoom] = useState(minZoom);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  const pointersRef = useRef<Map<number, Point>>(new Map());
  const lastDistanceRef = useRef<number | null>(null);
  const lastPanPointRef = useRef<Point | null>(null);

  useEffect(() => {
    if (zoom <= minZoom) {
      setOffset({ x: 0, y: 0 });
    }
  }, [zoom, minZoom]);

  const zoomIn = useCallback(() => {
    setZoom((prev) => clamp(prev + step, minZoom, maxZoom));
  }, [maxZoom, minZoom, step]);

  const zoomOut = useCallback(() => {
    setZoom((prev) => clamp(prev - step, minZoom, maxZoom));
  }, [maxZoom, minZoom, step]);

  const resetZoom = useCallback(() => {
    setZoom(minZoom);
    setOffset({ x: 0, y: 0 });
  }, [minZoom]);

  const getDistance = () => {
    const points = Array.from(pointersRef.current.values());
    if (points.length < 2) return null;
    const [a, b] = points;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 1) {
      lastPanPointRef.current = { x: event.clientX, y: event.clientY };
    }
    if (pointersRef.current.size === 2) {
      lastDistanceRef.current = getDistance();
    }
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.has(event.pointerId)) return;
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointersRef.current.size === 2) {
        const distance = getDistance();
        if (distance && lastDistanceRef.current) {
          const ratio = distance / lastDistanceRef.current;
          setZoom((prev) => clamp(prev * ratio, minZoom, maxZoom));
        }
        lastDistanceRef.current = distance;
        return;
      }

      if (pointersRef.current.size === 1 && zoom > minZoom) {
        const lastPan = lastPanPointRef.current;
        if (lastPan) {
          const deltaX = event.clientX - lastPan.x;
          const deltaY = event.clientY - lastPan.y;
          setOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        }
        lastPanPointRef.current = { x: event.clientX, y: event.clientY };
      }
    },
    [maxZoom, minZoom, zoom]
  );

  const onPointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      lastDistanceRef.current = null;
    }
    if (pointersRef.current.size === 1) {
      const remaining = Array.from(pointersRef.current.values())[0];
      lastPanPointRef.current = remaining ?? null;
    } else {
      lastPanPointRef.current = null;
    }
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const next = event.deltaY > 0 ? zoom - step : zoom + step;
      setZoom(clamp(next, minZoom, maxZoom));
    },
    [maxZoom, minZoom, step, zoom]
  );

  return {
    zoom,
    offset,
    zoomIn,
    zoomOut,
    resetZoom,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onWheel
    }
  };
}
