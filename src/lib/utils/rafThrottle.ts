/**
 * rAF-based throttle — calls `fn` at most once per animation frame.
 */
export function rafThrottle<T extends (...args: any[]) => void>(
  fn: T
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
  let rafId: number | null = null;
  let latestArgs: Parameters<T> | null = null;

  const call = (...args: Parameters<T>) => {
    latestArgs = args;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (latestArgs) fn(...latestArgs);
    });
  };

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return { call, cancel };
}

/**
 * Interval-based FPS throttle.
 * When `intervalMs` is null/0, falls back to plain rafThrottle (unlimited).
 */
export function fpsThrottle<T extends (...args: any[]) => void>(
  fn: T,
  intervalMs: number | null
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
  if (!intervalMs) return rafThrottle(fn);

  let lastCall = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const call = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = intervalMs - (now - lastCall);
    if (remaining <= 0) {
      lastCall = now;
      fn(...args);
    } else if (!timerId) {
      timerId = setTimeout(() => {
        lastCall = Date.now();
        timerId = null;
        fn(...args);
      }, remaining);
    }
  };

  const cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return { call, cancel };
}
