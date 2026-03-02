# API Comparison: OnSiteCanvas vs OnSiteCanvasWithLights

## OnSiteCanvas (Original)

```tsx
interface OnSiteCanvasProps {
  map: google.maps.Map;
  modelUrl: string;
  placement: PlacementTransform;
  ghostAnchor?: Coords | null;
  perfProfile?: PerfProfile;        // NEW - optional
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onLoaded?: () => void;
}
```

**What changed:**
- Added optional `perfProfile` prop
- Camera sync listeners added
- Lazy render support
- FPS capping
- Low-end quality adjustments
- **100% backward compatible** - works without perfProfile

**Usage:**
```tsx
<OnSiteCanvas
  map={mapInstance}
  modelUrl={modelUrl}
  placement={placement}
  perfProfile={perfProfile}  // Optional
/>
```

## OnSiteCanvasWithLights (New - G6)

```tsx
interface OnSiteCanvasWithLightsProps {
  map: google.maps.Map;
  modelUrl: string;
  placement: PlacementTransform;
  ghostAnchor?: Coords | null;
  perfProfile?: PerfProfile;
  sunState?: SunState;              // NEW
  enableSun?: boolean;              // NEW
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onLoaded?: () => void;
}
```

**New features:**
- All OnSiteCanvas features
- Sun simulation with `sunState` prop
- Dynamic lighting based on time/date
- Ground shadow
- DirectionalLight follows solar path

**Usage:**
```tsx
<OnSiteCanvasWithLights
  map={mapInstance}
  modelUrl={modelUrl}
  placement={placement}
  perfProfile={perfProfile}
  sunState={sunState}
  enableSun={true}
/>
```

## Feature Matrix

| Feature | OnSiteCanvas | OnSiteCanvasWithLights |
|---------|--------------|------------------------|
| Basic 3D rendering | ✅ | ✅ |
| Model placement | ✅ | ✅ |
| Performance profile | ✅ | ✅ |
| Camera sync | ✅ | ✅ |
| FPS capping | ✅ | ✅ |
| Lazy rendering | ✅ | ✅ |
| Sun simulation | ❌ | ✅ |
| Time-based lighting | ❌ | ✅ |
| Ground shadow | ❌ | ✅ |
| Solar path tracking | ❌ | ✅ |

## Migration Path

### Step 1: Keep OnSiteCanvas (Minimal effort)
```diff
<OnSiteCanvas
  map={mapInstance}
  modelUrl={modelUrl}
  placement={placement}
+ perfProfile={perfProfile}
/>
```

### Step 2: Upgrade to OnSiteCanvasWithLights (Full features)
```diff
- import { OnSiteCanvas } from "@/components/maps/OnSiteCanvas";
+ import { OnSiteCanvasWithLights } from "@/components/maps/OnSiteCanvasWithLights";

- <OnSiteCanvas
+ <OnSiteCanvasWithLights
    map={mapInstance}
    modelUrl={modelUrl}
    placement={placement}
    perfProfile={perfProfile}
+   sunState={sunState}
+   enableSun={true}
/>
```

## Performance Impact

| Component | Desktop | Mobile Low-end |
|-----------|---------|----------------|
| OnSiteCanvas | ~60 FPS | ~30 FPS (auto-adjusted) |
| OnSiteCanvasWithLights (sun off) | ~60 FPS | ~30 FPS (auto-adjusted) |
| OnSiteCanvasWithLights (sun on) | ~55-60 FPS | ~25-30 FPS (simplified shadows) |

## When to Use Each

### Use OnSiteCanvas when:
- You don't need sun simulation
- You want minimal bundle size
- You're upgrading incrementally

### Use OnSiteCanvasWithLights when:
- You want architectural sun studies
- Time-of-day visualization is important
- You need dynamic shadows
- You're building new features from scratch

## Breaking Changes

**None.** Both components maintain backward compatibility with all existing code.
