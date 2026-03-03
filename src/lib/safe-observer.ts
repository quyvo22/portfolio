/**
 * Patches IntersectionObserver.prototype.observe to silently skip
 * non-Element targets instead of throwing.
 *
 * Needed because Google Maps JS API (vector/WebGL mode) internally calls
 * observer.observe() and can pass a non-Element during race conditions
 * (React 18 unmount / Strict Mode double-invoke).
 *
 * Safe to import multiple times — patches only once.
 */

let patched = false;

export function patchIntersectionObserver(): void {
  if (
    patched ||
    typeof window === "undefined" ||
    typeof IntersectionObserver === "undefined"
  )
    return;

  const origObserve = IntersectionObserver.prototype.observe;

  IntersectionObserver.prototype.observe = function (target: unknown) {
    if (!(target instanceof Element)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[safe-observer] IntersectionObserver.observe skipped — target is not an Element:",
          target
        );
      }
      return;
    }
    return origObserve.call(this, target as Element);
  };

  patched = true;
}
