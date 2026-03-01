/**
 * Error fallback overlay (outside Canvas).
 *
 * Migration notes:
 *   - LoadingFallback moved to progress.tsx.
 *   - ErrorFallback API unchanged.
 */

"use client";

interface ErrorFallbackProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorFallback({ message, onRetry }: ErrorFallbackProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-ink-faint bg-surface-overlay rounded-lg">
      <p className="text-sm font-medium">Không thể tải model 3D</p>
      <p className="text-xs max-w-xs text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium hover:opacity-90 transition-opacity"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
