export function scheduleIdleTask(callback, timeout = 1500) {
  if (typeof window === "undefined") {
    callback();
    return () => {};
  }

  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(handle);
  }

  const handle = window.setTimeout(callback, Math.min(timeout, 500));
  return () => window.clearTimeout(handle);
}
