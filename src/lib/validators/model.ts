import { probeAsset, type ProbeResult } from "@/lib/storage/assetProbe";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  probe?: ProbeResult;
}

const ALLOWED_EXTENSIONS = [".glb", ".gltf"];
const MIME_WHITELIST = [
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream",
  "application/json",
];

export async function validateModelUrl(
  url: string,
  sizeLimitMB = 100
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!url) {
    errors.push("URL is required");
    return { valid: false, errors, warnings };
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      errors.push("URL must use HTTPS protocol");
    }

    const ext = parsed.pathname.toLowerCase().match(/\.(glb|gltf)$/);
    if (!ext) {
      errors.push(`URL must end with ${ALLOWED_EXTENSIONS.join(" or ")}`);
    }
  } catch (e) {
    errors.push("Invalid URL format");
    return { valid: false, errors, warnings };
  }

  const probe = await probeAsset(url);

  if (!probe.ok) {
    if (probe.corsLikely) {
      errors.push("CORS error: The server does not allow cross-origin requests");
      warnings.push("Enable CORS on your server or use a CORS proxy");
    } else {
      errors.push(`Failed to probe asset: ${probe.error || "Unknown error"}`);
    }
  }

  if (probe.mime && !MIME_WHITELIST.includes(probe.mime)) {
    warnings.push(
      `Unexpected MIME type: ${probe.mime}. Expected: ${MIME_WHITELIST.join(", ")}`
    );
  }

  if (probe.size) {
    const sizeMB = probe.size / (1024 * 1024);
    if (sizeMB > sizeLimitMB) {
      errors.push(
        `File too large: ${sizeMB.toFixed(2)}MB exceeds limit of ${sizeLimitMB}MB`
      );
    } else if (sizeMB > sizeLimitMB * 0.8) {
      warnings.push(
        `Large file: ${sizeMB.toFixed(2)}MB. Consider optimizing for better performance`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    probe,
  };
}
