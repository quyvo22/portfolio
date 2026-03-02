"use client";

import { useState, useEffect } from "react";
import { getUsageCount, shouldWarnUsage } from "@/lib/maps/cost";

export function UsageHints() {
  const [count, setCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentCount = getUsageCount();
      setCount(currentCount);
      setShowWarning(shouldWarnUsage());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-yellow-600 text-lg">⚠️</span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-yellow-900">
            High API Usage
          </h4>
          <p className="text-xs text-yellow-800 mt-1">
            You&apos;ve made <strong>{count}</strong> geocode requests this session.
            Consider refining your address before searching to reduce costs.
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowWarning(false)}
        className="text-xs text-yellow-700 hover:text-yellow-900 underline"
      >
        Dismiss
      </button>
    </div>
  );
}
