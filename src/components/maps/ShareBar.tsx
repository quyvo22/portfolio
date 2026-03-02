"use client";

import { useState } from "react";
import { buildPermalink, type PermalinkState } from "@/lib/share/permalink";

interface ShareBarProps {
  state: PermalinkState;
  onReset?: () => void;
}

export function ShareBar({ state, onReset }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const url = buildPermalink(state);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        {copied ? "✓ Copied!" : "📋 Copy Link"}
      </button>

      {onReset && (
        <button
          onClick={onReset}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
        >
          ↺ Reset
        </button>
      )}
    </div>
  );
}
