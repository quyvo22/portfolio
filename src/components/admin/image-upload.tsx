"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  value: string; // current image URL
  onChange: (data: { url: string; width: number; height: number }) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Hình ảnh" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

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

      onChange({ url: data.url, width: data.width, height: data.height });
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
    onChange({ url: "", width: 0, height: 0 });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-ink-muted">{label}</label>

      {value ? (
        <div className="relative w-full max-w-xs">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-surface-overlay">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              sizes="320px"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
          >
            Xóa
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 w-full max-w-xs aspect-video
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
              <svg className="w-8 h-8 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-ink-muted">Kéo thả hoặc click để chọn</span>
              <span className="text-xs text-ink-muted/60">JPEG, PNG, WebP · tối đa 10 MB</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
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
