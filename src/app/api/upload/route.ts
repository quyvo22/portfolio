import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/upload — upload image to Cloudinary (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const isPdf = file.type === "application/pdf";
  const isImage = imageTypes.includes(file.type);
  const modelTypes = ["model/gltf-binary", "model/gltf+json", "application/octet-stream"];
  const isModel = modelTypes.includes(file.type) ||
    file.name.endsWith(".glb") ||
    file.name.endsWith(".gltf");

  if (!isImage && !isPdf && !isModel) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF, GLB, glTF." },
      { status: 400 }
    );
  }

  const maxSize = isModel ? 100 * 1024 * 1024 : isPdf ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    const limitLabel = isModel ? "100" : isPdf ? "50" : "10";
    return NextResponse.json(
      { error: `File too large. Maximum size is ${limitLabel} MB.` },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const resourceType = (isPdf || isModel) ? "raw" as const : "image" as const;

  const result = await new Promise<{
    secure_url: string;
    width: number;
    height: number;
    public_id: string;
  }>((resolve, reject) => {
    const originalName = file.name.replace(/\.[^.]+$/, "");
    cloudinary.uploader
      .upload_stream(
        {
          folder: "portfolio",
          resource_type: resourceType,
          ...(isModel && { public_id: `${originalName}-${Date.now()}` }),
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve({
            secure_url: result.secure_url,
            width: result.width ?? 0,
            height: result.height ?? 0,
            public_id: result.public_id,
          });
        }
      )
      .end(buffer);
  });

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
    ...(isImage ? { width: result.width, height: result.height } : {}),
  });
}
