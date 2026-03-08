"use client";

import { useState } from "react";
import { Box, ExternalLink } from "lucide-react";
import { useGlbUpload } from "@/hooks/useGlbUpload";

interface ModelUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ModelUpload({ value, onChange }: ModelUploadProps) {
  const [{ uploading, progress, error }, { uploadFile, inputRef }] = useGlbUpload();
  const [dragOver, setDragOver] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  async function handleFile(file: File) {
    const url = await uploadFile(file);
    if (url) onChange(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handlePasteUrl() {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setManualUrl("");
    }
  }

  const fileName = value ? decodeURIComponent(value.split("/").pop() || "model.glb") : "";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink-muted">3D Model</label>

      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-overlay">
          <Box size={24} className="text-ink-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ink truncate">{fileName}</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              Xem file <ExternalLink size={10} />
            </a>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="px-2 py-1 rounded-md bg-black/60 text-white text-xs hover:bg-black/80 transition-colors shrink-0"
          >
            Xóa
          </button>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-2 w-full py-8
              rounded-lg border-2 border-dashed transition-colors
              ${uploading ? "cursor-wait" : "cursor-pointer"}
              ${dragOver
                ? "border-accent bg-accent/5"
                : "border-border bg-surface-overlay hover:border-accent/50 hover:bg-surface-overlay/80"
              }
            `}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-ink-muted">Đang tải lên... {progress}%</span>
                <div className="w-48 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Box size={32} className="text-ink-muted" />
                <span className="text-sm text-ink-muted">Kéo thả hoặc click để chọn model</span>
                <span className="text-xs text-ink-muted/60">Chỉ file .glb (binary) · tối đa 100 MB</span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Hoặc dán URL model (.glb)..."
              className="flex-1 px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handlePasteUrl}
              disabled={!manualUrl.trim()}
              className="px-3 py-2 rounded-lg border border-border text-sm text-ink-muted hover:bg-surface-overlay transition-colors disabled:opacity-30"
            >
              Dùng URL
            </button>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".glb"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
