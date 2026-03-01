"use client";

import { useRef, useState } from "react";
import { FileText, ExternalLink } from "lucide-react";

interface PdfUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function PdfUpload({ value, onChange }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload thất bại");
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
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

  // Extract filename from URL
  const fileName = value ? decodeURIComponent(value.split("/").pop() || "file.pdf") : "";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink-muted">PDF File</label>

      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-overlay">
          <FileText size={24} className="text-ink-muted shrink-0" />
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
            onClick={() => inputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-2 w-full py-8
              rounded-lg border-2 border-dashed cursor-pointer transition-colors
              ${dragOver
                ? "border-accent bg-accent/5"
                : "border-border bg-surface-overlay hover:border-accent/50 hover:bg-surface-overlay/80"
              }
            `}
          >
            {uploading ? (
              <span className="text-sm text-ink-muted animate-pulse">Đang tải lên...</span>
            ) : (
              <>
                <FileText size={32} className="text-ink-muted" />
                <span className="text-sm text-ink-muted">Kéo thả hoặc click để chọn PDF</span>
                <span className="text-xs text-ink-muted/60">PDF · tối đa 50 MB</span>
              </>
            )}
          </div>

          {/* Manual URL paste */}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Hoặc dán URL PDF..."
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
        accept="application/pdf"
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
