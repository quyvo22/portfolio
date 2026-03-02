"use client";

import { useState, useEffect } from "react";
import { validateModelUrl, type ValidationResult } from "@/lib/validators/model";

interface ModelUrlFieldProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (result: ValidationResult) => void;
  label?: string;
  required?: boolean;
  sizeLimitMB?: number;
}

export function ModelUrlField({
  value,
  onChange,
  onValidationChange,
  label = "Model URL",
  required = false,
  sizeLimitMB = 100,
}: ModelUrlFieldProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!value) {
      setValidationResult(null);
      onValidationChange?.(null as any);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidating(true);
      const result = await validateModelUrl(value, sizeLimitMB);
      setValidationResult(result);
      onValidationChange?.(result);
      setIsValidating(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [value, sizeLimitMB, onValidationChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/model.glb"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />

      {isValidating && (
        <p className="text-xs text-gray-500">Validating...</p>
      )}

      {validationResult && !isValidating && (
        <div className="space-y-1">
          {validationResult.errors.map((error, i) => (
            <p key={i} className="text-xs text-red-600">
              ❌ {error}
            </p>
          ))}

          {validationResult.warnings.map((warning, i) => (
            <p key={i} className="text-xs text-yellow-600">
              ⚠️ {warning}
            </p>
          ))}

          {validationResult.valid && validationResult.probe?.ok && (
            <p className="text-xs text-green-600">
              ✓ Valid ({validationResult.probe.mime}, {
                validationResult.probe.size
                  ? `${(validationResult.probe.size / (1024 * 1024)).toFixed(2)}MB`
                  : "size unknown"
              })
            </p>
          )}
        </div>
      )}
    </div>
  );
}
