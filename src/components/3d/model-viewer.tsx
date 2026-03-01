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
  const [contextLost, setContextLost] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const retryCountRef = useRef(0);

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

  useEffect(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  useEffect(() => {
    if (inView) setMounted(true);
  }, [inView]);

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
    retryCountRef.current = 0;
    setError(null);
    setContextLost(false);
    setResetKey((k) => k + 1);
  }, []);

  const handleContextLost = useCallback((e: Event) => {
    e.preventDefault();
    setContextLost(true);

    // Auto-retry after a short delay (GPU may recover)
    retryCountRef.current += 1;
    if (retryCountRef.current <= 3) {
      setTimeout(() => {
        setContextLost(false);
        setResetKey((k) => k + 1);
      }, 1500);
    } else {
      setError("WebGL context lost — GPU quá tải. Vui lòng tải lại trang.");
    }
  }, []);

  const handleContextRestored = useCallback(() => {
    setContextLost(false);
    retryCountRef.current = 0;
  }, []);

  // Separate fatal errors (unmount Canvas) from context loss (keep Canvas, overlay)
  const showCanvas = inView && !error;

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

        {/* Error overlay (fatal — Canvas unmounted) */}
        {error && <ErrorFallback message={error} onRetry={handleRetry} />}

        {/* Context lost overlay (temporary — Canvas stays alive) */}
        {contextLost && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-overlay/80 text-ink-faint">
            <div className="animate-spin h-6 w-6 border-2 border-ink-faint border-t-transparent rounded-full" />
            <p className="text-sm font-medium">Đang khôi phục WebGL...</p>
          </div>
        )}

        {/* Three.js Canvas */}
        {showCanvas && (
          <Canvas
            key={resetKey}
            camera={{
              fov: CAMERA.fov,
              position: CAMERA.position,
              near: CAMERA.near,
              far: CAMERA.far,
            }}
            dpr={isMobile ? [1, 1] : [1, 1.5]}
            frameloop="demand"
            gl={{
              antialias: !isMobile,
              preserveDrawingBuffer: false,
              powerPreference: "default",
              failIfMajorPerformanceCaveat: false,
            }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              canvas.addEventListener("webglcontextlost", handleContextLost);
              canvas.addEventListener("webglcontextrestored", handleContextRestored);
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
