"use client";

import { useRef, useState } from "react";
import { Box, ExternalLink } from "lucide-react";

interface ModelUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ModelUpload({ value, onChange }: ModelUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".glb")) {
      setError("Chỉ hỗ trợ file .glb (binary). Vui lòng export lại từ Blender dạng GLB.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File quá lớn. Tối đa 100 MB.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      // Step 1: Get signed upload params from our API
      const sigRes = await fetch("/api/upload-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "portfolio", resourceType: "raw" }),
      });

      if (!sigRes.ok) {
        const data = await sigRes.json();
        throw new Error(data.error || "Không lấy được chữ ký upload");
      }

      const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

      // Step 2: Upload directly to Cloudinary from browser (no server body limit)
      // Only include params that were signed — extras cause signature mismatch (400)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", String(timestamp));
      formData.append("api_key", apiKey);
      formData.append("folder", folder);

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.secure_url);
          } else {
            reject(new Error(`Upload thất bại (${xhr.status})`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Lỗi mạng khi upload")));
        xhr.addEventListener("abort", () => reject(new Error("Upload bị hủy")));

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);
        xhr.send(formData);
      });

      const secureUrl = await uploadPromise;
      onChange(secureUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
      setProgress(0);
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
