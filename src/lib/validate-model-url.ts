const VALID_EXTENSIONS = [".glb", ".gltf"];

export function validateModelUrl(url: string | null | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!url || !url.trim()) return { valid: false, error: "No URL provided" };

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      return { valid: false, error: "URL must use HTTPS" };
    }

    const pathname = parsed.pathname.toLowerCase();

    // Check if pathname ends with a valid extension
    const hasValidExt = VALID_EXTENSIONS.some((ext) => pathname.endsWith(ext));

    // Also accept Cloudinary raw URLs that contain glb/gltf in the path
    const isCloudinaryRaw =
      parsed.hostname.includes("cloudinary.com") &&
      pathname.includes("/raw/upload/");

    if (!hasValidExt && !isCloudinaryRaw) {
      return { valid: false, error: "File must be .glb or .gltf" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}
