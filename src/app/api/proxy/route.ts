import { NextRequest, NextResponse } from "next/server";

const ALLOW_PROXY_FALLBACK = process.env.ALLOW_PROXY_FALLBACK === "true";

export async function GET(request: NextRequest) {
  if (!ALLOW_PROXY_FALLBACK) {
    return NextResponse.json(
      { error: "Proxy fallback is disabled" },
      { status: 403 }
    );
  }

  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  try {
    const targetUrl = new URL(url);

    if (targetUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only HTTPS URLs are allowed" },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ModelProxy/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy failed" },
      { status: 500 }
    );
  }
}
