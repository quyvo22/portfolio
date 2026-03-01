const VALID_EXTENSIONS = [".glb", ".gltf"];

export function validateModelUrl(url: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!url) return { valid: false, error: "No URL provided" };

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return { valid: false, error: "URL must use HTTPS" };
    }

    const ext = parsed.pathname.toLowerCase().split(".").pop();
    if (!ext || !VALID_EXTENSIONS.includes(`.${ext}`)) {
      return { valid: false, error: "File must be .glb or .gltf" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}
