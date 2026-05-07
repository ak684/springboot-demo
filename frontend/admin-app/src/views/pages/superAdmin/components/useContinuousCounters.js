import { useEffect, useMemo, useRef, useState } from 'react';

const STOCK_RAMP_DURATION_MS = 1200;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const prepareMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const entries = Object.entries(metadata);
  if (!entries.length) {
    return null;
  }

  return entries.reduce((acc, [key, config]) => {
    if (!config || typeof config !== 'object') {
      return acc;
    }

    acc[key] = {
      ...config,
      periodStartMs: parseTimestamp(config.periodStart),
      periodEndMs: parseTimestamp(config.periodEnd)
    };
    return acc;
  }, {});
};

const useContinuousCounters = ({ totals, enabled }) => {
  const metadata = totals?.continuousCounters;
  const parsedMetadata = useMemo(() => prepareMetadata(metadata), [metadata]);
  const [values, setValues] = useState({});
  const frameRef = useRef(null);
  const stockStartRef = useRef(Date.now());

  useEffect(() => {
    stockStartRef.current = Date.now();
  }, [parsedMetadata, enabled]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const cancelFrame = () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    if (!enabled || !parsedMetadata) {
      cancelFrame();
      setValues({});
      return undefined;
    }

    let mounted = true;

    const computeValue = (config, now) => {
      if (!config || typeof config !== 'object') {
        return null;
      }

      if (config.mode === 'stock') {
        const elapsed = now - stockStartRef.current;
        const progress = clamp(elapsed / STOCK_RAMP_DURATION_MS, 0, 1);
        return (config.targetValue || 0) * progress;
      }

      if ((config.mode === 'flow' || config.mode === 'loop') &&
          config.periodStartMs != null && config.periodEndMs != null &&
          config.periodEndMs > config.periodStartMs) {
        const duration = config.periodEndMs - config.periodStartMs;
        let elapsed = now - config.periodStartMs;
        if (config.mode === 'loop') {
          elapsed = ((elapsed % duration) + duration) % duration;
        } else {
          elapsed = clamp(elapsed, 0, duration);
        }

        const progress = duration === 0 ? 0 : elapsed / duration;
        return (config.targetValue || 0) * progress;
      }

      return null;
    };

    const tick = () => {
      const now = Date.now();
      const nextValues = {};

      Object.entries(parsedMetadata).forEach(([key, config]) => {
        const value = computeValue(config, now);
        if (typeof value === 'number' && !Number.isNaN(value)) {
          nextValues[key] = value;
        }
      });

      if (mounted) {
        setValues(nextValues);
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      mounted = false;
      cancelFrame();
    };
  }, [enabled, parsedMetadata]);

  return values;
};

export default useContinuousCounters;
