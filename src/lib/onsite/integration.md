# G4-G8 Integration Guide

## Quick Start

Replace `OnSiteCanvas` with `OnSiteCanvasWithLights` for full G4-G8 support:

```tsx
import { OnSiteCanvasWithLights } from "@/components/maps/OnSiteCanvasWithLights";
import { PerfPanel } from "@/components/maps/PerfPanel";
import { SunControls } from "@/components/maps/SunControls";
import { ShareBar } from "@/components/maps/ShareBar";
import { UsageHints } from "@/components/maps/UsageHints";

<OnSiteCanvasWithLights
  map={mapInstance}
  modelUrl={modelUrl}
  placement={placement}
  perfProfile={perfProfile}
  sunState={sunState}
  enableSun={true}
/>

<PerfPanel onChange={setPerfProfile} />
<SunControls onChange={setSunState} />
<ShareBar state={shareState} onReset={handleReset} />
<UsageHints />
```

## Features

### G4 - Performance
- Auto-detect low-end devices
- FPS capping (30/60)
- Lazy rendering when idle
- Camera sync telemetry

### G5 - CORS Hardening
- URL validation with `ModelUrlField`
- MIME/size probing
- Optional proxy fallback (disabled by default)

```tsx
import { ModelUrlField } from "@/components/admin/ModelUrlField";

<ModelUrlField
  value={url}
  onChange={setUrl}
  onValidationChange={(result) => console.log(result)}
/>
```

### G6 - Sun Simulation
- Solar azimuth/elevation calculator
- Time-of-day presets
- DirectionalLight follows sun
- Ground shadow plane

### G7 - Share & Export
- Permalink with full state (lat/lng/sun/perf/lot)
- Copy link one-click
- Canvas capture (overlay only)

### G8 - Cost Guard
- Geocode debounce (600ms default)
- In-memory + localStorage cache
- Usage warnings at threshold

## Environment Variables

```env
ALLOW_PROXY_FALLBACK=false  # G5: Enable CORS proxy
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=...
```

## Non-Breaking Changes

All components are optional and additive:
- Use `OnSiteCanvas` as before (no sun/perf features)
- Or upgrade to `OnSiteCanvasWithLights` for full suite
- `AddressForm` automatically uses cost guard
- Permalink state is read on mount, doesn't affect existing flow
