"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, MapPin, AlertCircle } from "lucide-react";
import { createSearch } from "@/lib/maps/search";
import type { GeocodeResult } from "@/lib/onsite/types";

interface AddressFormProps {
  onResult: (result: GeocodeResult) => void;
  className?: string;
}

export function AddressForm({ onResult, className }: AddressFormProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const searchRef = useRef(createSearch());

  const handleSearch = useCallback(async () => {
    if (!address.trim()) {
      setError("Vui lòng nhập địa chỉ");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await searchRef.current.search(address.trim());
      setLastResult(result.formatted);
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tìm thấy địa chỉ");
    } finally {
      setLoading(false);
    }
  }, [address, onResult]);

  const handleChange = useCallback((value: string) => {
    setAddress(value);
    setError(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  useEffect(() => {
    return () => {
      searchRef.current.cancel();
    };
  }, []);

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={address}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập địa chỉ..."
            className="w-full px-3 py-2 pl-9 bg-surface border border-border rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={loading}
          />
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !address.trim()}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={16} />
          )}
          Tìm
        </button>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-500">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {lastResult && !error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
          <MapPin size={14} />
          <span>{lastResult}</span>
        </div>
      )}
    </div>
  );
}
