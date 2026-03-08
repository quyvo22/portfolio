"use client";

import { useRef, useState, useCallback } from "react";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface GlbUploadState {
  uploading: boolean;
  progress: number;
  error: string;
}

export interface GlbUploadActions {
  uploadFile: (file: File) => Promise<string | null>;
  clearError: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function useGlbUpload(): [GlbUploadState, GlbUploadActions] {
  const inputRef = useRef<HTMLInputElement>(null!);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    if (!file.name.toLowerCase().endsWith(".glb")) {
      setError("Chỉ hỗ trợ file .glb (binary).");
      return null;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File quá lớn. Tối đa 100 MB.");
      return null;
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError("Thiếu cấu hình Cloudinary. Kiểm tra NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", "portfolio");

      const xhr = new XMLHttpRequest();

      const secureUrl = await new Promise<string>((resolve, reject) => {
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
            let msg = `Upload thất bại (${xhr.status})`;
            try {
              const errData = JSON.parse(xhr.responseText);
              if (errData.error?.message) msg = errData.error.message;
            } catch { /* ignore */ }
            reject(new Error(msg));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Lỗi mạng khi upload")));
        xhr.addEventListener("abort", () => reject(new Error("Upload bị hủy")));

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`);
        xhr.send(formData);
      });

      return secureUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, []);

  const clearError = useCallback(() => setError(""), []);

  return [
    { uploading, progress, error },
    { uploadFile, clearError, inputRef },
  ];
}
