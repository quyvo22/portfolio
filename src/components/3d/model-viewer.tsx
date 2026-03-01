"use client";

import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
  Component,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Maximize, Minimize, RotateCcw, Box } from "lucide-react";
import Image from "next/image";
import { CAMERA, MOBILE_BREAKPOINT } from "@/lib/3d-config";
import { Model } from "./model";
import { Controls } from "./controls";
import { Lighting } from "./lighting";
import { LoadingFallback, ErrorFallback } from "./fallback";

interface ModelViewerProps {
  url: string;
  poster?: string | null;
}

// Error boundary for Three.js errors
class ThreeErrorBoundary extends Component<
  { children: ReactNode; onError: (msg: string) => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    const msg = error.message || "Unknown error";
    // Detect CORS
    if (msg.includes("Failed to fetch") || msg.includes("CORS")) {
      this.props.onError("Lỗi CORS — storage chưa cho phép truy cập từ domain này");
    } else {
      this.props.onError(msg);
    }
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function ModelViewer({ url, poster }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Viewport intersection — mount Canvas only when near viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Mobile detection
  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  // Mark as mounted after Canvas appears
  useEffect(() => {
    if (inView) setMounted(true);
  }, [inView]);

  // Fullscreen change listener
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setResetKey((k) => k + 1);
  }, []);

  return (
    <div ref={containerRef} className="card flex flex-col bg-surface-overlay relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface text-sm z-10">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Box size={14} />
          <span className="text-xs font-medium">3D Model</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md hover:bg-surface-overlay transition-colors"
            aria-label="Reset view (R)"
            title="Reset view (R)"
          >
            <RotateCcw size={16} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-surface-overlay transition-colors"
            aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Viewer area */}
      <div className="relative aspect-square bg-surface-overlay">
        {/* Poster image — shown before Canvas mounts */}
        {!mounted && poster && (
          <Image
            src={poster}
            alt="Model preview"
            fill
            className="object-cover opacity-30"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}

        {/* Error overlay */}
        {error && <ErrorFallback message={error} onRetry={handleRetry} />}

        {/* Three.js Canvas — only mounts when in viewport */}
        {inView && !error && (
          <Canvas
            key={resetKey}
            camera={{
              fov: CAMERA.fov,
              position: CAMERA.position,
              near: CAMERA.near,
              far: CAMERA.far,
            }}
            dpr={isMobile ? [1, 1.5] : [1, 2]}
            frameloop="demand"
            gl={{ antialias: true, preserveDrawingBuffer: false }}
            onCreated={({ gl }) => {
              // Handle WebGL context loss
              const canvas = gl.domElement;
              canvas.addEventListener("webglcontextlost", (e) => {
                e.preventDefault();
                setError("WebGL context lost — GPU quá tải hoặc bị thu hồi");
              });
              canvas.addEventListener("webglcontextrestored", () => {
                setError(null);
              });
            }}
            className="!absolute inset-0"
          >
            <ThreeErrorBoundary onError={setError}>
              <Suspense fallback={<LoadingFallback />}>
                <Model url={url} />
              </Suspense>
              <Lighting isMobile={isMobile} />
              <Controls onReset={handleReset} />
            </ThreeErrorBoundary>
          </Canvas>
        )}

        {/* Placeholder when not yet in viewport */}
        {!inView && !poster && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-faint">
            <Box size={48} strokeWidth={1} />
            <p className="text-sm font-medium">Trình xem 3D</p>
          </div>
        )}
      </div>
    </div>
  );
}
