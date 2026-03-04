export interface GlbProbeResult {
  ok: boolean;
  status?: number;
  mime?: string;
  size?: number;
  message: string;
}

export async function probeGlbUrl(url: string): Promise<GlbProbeResult> {
  if (!url) return { ok: false, message: "No URL provided." };

  try {
    new URL(url);
  } catch {
    return { ok: false, message: "Invalid URL format." };
  }

  try {
    const res = await fetch(url, { method: "HEAD", mode: "cors", credentials: "omit" });

    const mime = res.headers.get("content-type") ?? undefined;
    const sizeRaw = res.headers.get("content-length");
    const size = sizeRaw ? parseInt(sizeRaw, 10) : undefined;

    if (!res.ok) {
      return { ok: false, status: res.status, mime, size, message: `HTTP ${res.status} — server rejected the request.` };
    }

    const validMimes = ["model/gltf-binary", "model/gltf+json", "application/octet-stream", "application/json"];
    const mimeOk = !mime || validMimes.some((m) => mime.startsWith(m));
    if (!mimeOk) {
      return { ok: true, status: res.status, mime, size, message: `Warning: unexpected Content-Type "${mime}". Loading may still work.` };
    }

    const sizeMB = size ? (size / 1048576).toFixed(1) : "unknown";
    return { ok: true, status: res.status, mime, size, message: `OK — ${sizeMB} MB, CORS allowed.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("CORS") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
      return { ok: false, message: "CORS error — the server does not allow cross-origin requests from this domain." };
    }
    return { ok: false, message: `Network error: ${msg}` };
  }
}
