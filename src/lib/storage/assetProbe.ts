export interface ProbeResult {
  ok: boolean;
  status?: number;
  mime?: string;
  size?: number;
  corsLikely: boolean;
  error?: string;
}

export async function probeAsset(url: string): Promise<ProbeResult> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      mode: "cors",
      credentials: "omit",
    });

    const mime = response.headers.get("content-type") || undefined;
    const sizeHeader = response.headers.get("content-length");
    const size = sizeHeader ? parseInt(sizeHeader, 10) : undefined;

    return {
      ok: response.ok,
      status: response.status,
      mime,
      size,
      corsLikely: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const corsLikely = errorMessage.includes("CORS") || errorMessage.includes("NetworkError");

    return {
      ok: false,
      corsLikely,
      error: errorMessage,
    };
  }
}
