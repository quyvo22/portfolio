/**
 * 3D Model Viewer — Canvas shell with toolbar, feature-flagged controls.
 *
 * Migration notes:
 *   - Public props `url` and `poster` unchanged.
 *   - All new features controlled by FLAGS in 3d-config.ts.
 *   - Defaults = previous behaviour (MEDIUM/ADVANCED flags off).
 *   - Revert: set all MEDIUM/ADVANCED flags to false.
 */

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
import {
  Maximize,
  Minimize,
  RotateCcw,
  Box,
  Grid3x3,
  Scissors,
  Ruler,
  Sun,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import {
  CAMERA,
  FLAGS,
  LIGHT_PRESETS,
  DEFAULT_LIGHT_PRESET,
  type LightPresetKey,
} from "@/lib/3d-config";
import { emit } from "@/lib/telemetry";
import { useLowEndProfile } from "@/hooks/useLowEndProfile";
import { Model } from "./model";
import { Controls } from "./controls";
import { Lighting } from "./lighting";
import { Progress } from "./progress";
import { ErrorFallback } from "./fallback";

// Lazy-load advanced components only when flags are on
const SectionPlanes = FLAGS.SECTION_PLANES
  ? require("./section-planes").SectionPlanes
  : null;
const MeasureTool = FLAGS.MEASURE_TOOL
  ? require("./measure-tool").MeasureTool
  : null;

// ── Types ────────────────────────────────────────────────

interface ModelViewerProps {
  url: string;
  poster?: string | null;
}

// ── Error Boundary ───────────────────────────────────────

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
    } else if (msg.includes("Failed to load buffer") || msg.includes(".bin")) {
      this.props.onError("File .gltf thiếu buffer (.bin). Vui lòng upload lại dạng .glb");
    } else {
      this.props.onError(msg);
    }
    emit("3d_view_error", { error: msg });
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ── Toolbar Button ───────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  label,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        active ? "bg-accent/20 text-accent" : "hover:bg-surface-overlay"
      }`}
      aria-label={label}
      aria-pressed={active ?? undefined}
      title={title}
    >
      {children}
    </button>
  );
}

// ── Main Component ───────────────────────────────────────

export function ModelViewer({ url, poster }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const profile = useLowEndProfile();

  // Core state
  const [inView, setInView] = useState(!FLAGS.LAZY_MOUNT);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const retryCountRef = useRef(0);

  // Feature state (MEDIUM/ADVANCED)
  const [wireframe, setWireframe] = useState(false);
  const [lightPreset, setLightPreset] = useState<LightPresetKey>(DEFAULT_LIGHT_PRESET);
  const [envIntensity, setEnvIntensity] = useState(1);
  const [sectionAxes, setSectionAxes] = useState({ x: false, y: false, z: false });
  const [sectionOpen, setSectionOpen] = useState(false);
  const [measureActive, setMeasureActive] = useState(false);

  // Lazy mount via IntersectionObserver
  useEffect(() => {
    if (!FLAGS.LAZY_MOUNT) return;
    const el = containerRef.current;
    if (!(el instanceof Element)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) setMounted(true);
  }, [inView]);

  // Fullscreen
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ESC to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    emit("3d_toolbar_fullscreen", { fullscreen: !isFullscreen });
  }, [isFullscreen]);

  // Reset
  const handleReset = useCallback(() => {
    setResetKey((k) => k + 1);
    setWireframe(false);
    setSectionAxes({ x: false, y: false, z: false });
    setMeasureActive(false);
    setLightPreset(DEFAULT_LIGHT_PRESET);
    setEnvIntensity(1);
    emit("3d_toolbar_reset");
  }, []);

  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    setError(null);
    setContextLost(false);
    setResetKey((k) => k + 1);
  }, []);

  // WebGL context
  const handleContextLost = useCallback((e: Event) => {
    e.preventDefault();
    setContextLost(true);
    retryCountRef.current += 1;
    emit("3d_view_error", { error: "webgl_context_lost" });

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

  // Light preset cycle
  const presetKeys = Object.keys(LIGHT_PRESETS) as LightPresetKey[];
  const cycleLightPreset = useCallback(() => {
    setLightPreset((prev) => {
      const idx = presetKeys.indexOf(prev);
      const next = presetKeys[(idx + 1) % presetKeys.length];
      emit("3d_toolbar_switch_env", { preset: next });
      return next;
    });
  }, [presetKeys]);

  // Section axes helpers
  const anySectionActive = sectionAxes.x || sectionAxes.y || sectionAxes.z;
  const toggleSectionAxis = useCallback((axis: "x" | "y" | "z") => {
    setSectionAxes((prev) => {
      const next = { ...prev, [axis]: !prev[axis] };
      emit("3d_toolbar_toggle_section", { axes: next });
      return next;
    });
  }, []);

  // Close section dropdown on outside click
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sectionOpen) return;
    const onClick = (e: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setSectionOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [sectionOpen]);

  // Derived
  const showCanvas = inView && !error;
  const isMobile = profile.isLowEnd;
  const dpr: [number, number] = profile.isLowEnd ? [1, 1] : [1, 1.5];

  return (
    <div ref={containerRef} className="card flex flex-col bg-surface-overlay relative">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface text-sm z-10">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <Box size={14} />
          <span className="text-xs font-medium">3D Model</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Reset */}
          {FLAGS.RESET_VIEW && (
            <ToolbarBtn
              onClick={handleReset}
              label="Reset view (R)"
              title="Reset view (R)"
            >
              <RotateCcw size={16} />
            </ToolbarBtn>
          )}

          {/* Wireframe toggle */}
          {FLAGS.WIREFRAME_TOGGLE && (
            <ToolbarBtn
              onClick={() => {
                setWireframe((w) => !w);
                emit("3d_toolbar_toggle_wireframe", { wireframe: !wireframe });
              }}
              active={wireframe}
              label="Toggle wireframe"
              title="Wireframe"
            >
              <Grid3x3 size={16} />
            </ToolbarBtn>
          )}

          {/* Section planes with dropdown */}
          {FLAGS.SECTION_PLANES && (
            <div ref={sectionRef} className="relative">
              <button
                onClick={() => setSectionOpen((o) => !o)}
                className={`flex items-center gap-0.5 p-1.5 rounded-md transition-colors ${
                  anySectionActive
                    ? "bg-accent/20 text-accent"
                    : "hover:bg-surface-overlay"
                }`}
                aria-label="Section planes"
                aria-pressed={anySectionActive}
                title="Section planes (X/Y/Z)"
              >
                <Scissors size={16} />
                <ChevronDown size={12} />
              </button>
              {sectionOpen && (
                <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[120px] py-1">
                  {(["x", "y", "z"] as const).map((axis) => (
                    <button
                      key={axis}
                      onClick={() => toggleSectionAxis(axis)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-surface-overlay transition-colors ${
                        sectionAxes[axis] ? "text-accent font-medium" : "text-ink-muted"
                      }`}
                      aria-pressed={sectionAxes[axis]}
                    >
                      <span>Axis {axis.toUpperCase()}</span>
                      {sectionAxes[axis] && (
                        <span className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Measure */}
          {FLAGS.MEASURE_TOOL && (
            <ToolbarBtn
              onClick={() => {
                setMeasureActive((m) => !m);
                emit("3d_toolbar_toggle_measure", { active: !measureActive });
              }}
              active={measureActive}
              label="Measure distance"
              title="Measure (2-point)"
            >
              <Ruler size={16} />
            </ToolbarBtn>
          )}

          {/* Light preset */}
          {FLAGS.LIGHT_PRESETS && (
            <ToolbarBtn
              onClick={cycleLightPreset}
              label={`Lighting: ${LIGHT_PRESETS[lightPreset].label}`}
              title={`Lighting: ${LIGHT_PRESETS[lightPreset].label} — click to cycle`}
            >
              <Sun size={16} />
            </ToolbarBtn>
          )}

          <div className="w-px h-4 bg-border mx-1" />

          {/* Fullscreen */}
          <ToolbarBtn
            onClick={toggleFullscreen}
            active={isFullscreen}
            label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </ToolbarBtn>
        </div>
      </div>

      {/* ── Env intensity slider (MEDIUM) ── */}
      {FLAGS.ENV_HDRI_SWITCH && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-surface text-xs">
          <span className="text-ink-muted w-16">Env: {envIntensity.toFixed(1)}</span>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={envIntensity}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setEnvIntensity(v);
              emit("3d_toolbar_intensity_change", { intensity: v });
            }}
            className="flex-1 h-1 accent-accent"
            aria-label="Environment intensity"
          />
        </div>
      )}

      {/* ── Viewer area ── */}
      <div className="relative aspect-square bg-surface-overlay">
        {/* Poster */}
        {FLAGS.FALLBACK_POSTER && !mounted && poster && (
          <Image
            src={poster}
            alt="Model preview"
            fill
            className="object-cover opacity-30"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}

        {/* Fatal error */}
        {error && <ErrorFallback message={error} onRetry={handleRetry} />}

        {/* Context lost overlay */}
        {contextLost && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-overlay/80 text-ink-faint">
            <div className="animate-spin h-6 w-6 border-2 border-ink-faint border-t-transparent rounded-full" />
            <p className="text-sm font-medium">Đang khôi phục WebGL...</p>
          </div>
        )}

        {/* Canvas */}
        {showCanvas && (
          <Canvas
            key={resetKey}
            camera={{
              fov: CAMERA.fov,
              position: CAMERA.position,
              near: CAMERA.near,
              far: CAMERA.far,
            }}
            dpr={dpr}
            frameloop="demand"
            gl={{
              antialias: !profile.disableAntialias,
              preserveDrawingBuffer: false,
              powerPreference: "default",
              failIfMajorPerformanceCaveat: false,
              localClippingEnabled: FLAGS.SECTION_PLANES,
            }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              canvas.addEventListener("webglcontextlost", handleContextLost);
              canvas.addEventListener("webglcontextrestored", handleContextRestored);
            }}
            className="!absolute inset-0"
          >
            <ThreeErrorBoundary onError={setError}>
              <Suspense fallback={<Progress />}>
                <Model url={url} wireframe={wireframe} />
              </Suspense>
              <Lighting
                isMobile={isMobile}
                disableShadows={profile.disableShadows}
                preset={lightPreset}
                envIntensity={FLAGS.ENV_HDRI_SWITCH ? envIntensity : undefined}
                envResolution={profile.isLowEnd ? profile.envResolution : undefined}
              />
              <Controls onReset={handleReset} />
              {FLAGS.SECTION_PLANES && SectionPlanes && (
                <SectionPlanes axes={sectionAxes} />
              )}
              {FLAGS.MEASURE_TOOL && MeasureTool && (
                <MeasureTool active={measureActive} />
              )}
            </ThreeErrorBoundary>
          </Canvas>
        )}

        {/* Placeholder */}
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
