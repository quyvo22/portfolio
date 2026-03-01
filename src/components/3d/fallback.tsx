"use client";

import { Html, useProgress } from "@react-three/drei";
import { Loader2 } from "lucide-react";

export function LoadingFallback() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-ink-faint">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm font-medium">{Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

interface ErrorFallbackProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorFallback({ message, onRetry }: ErrorFallbackProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-faint bg-surface-overlay rounded-lg">
      <p className="text-sm font-medium">Không thể tải model 3D</p>
      <p className="text-xs">{message}</p>
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
