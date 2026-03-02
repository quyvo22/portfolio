# Quick Start: G4-G8 Features

## 1. Install (Already Done)
All files are created. Just add to existing onsite page.

## 2. Update Your Page

### Option A: Keep Simple (Current OnSiteCanvas)
```tsx
import { OnSiteCanvas } from "@/components/maps/OnSiteCanvas";
import { PerfPanel } from "@/components/maps/PerfPanel";
import { ShareBar } from "@/components/maps/ShareBar";
import { UsageHints } from "@/components/maps/UsageHints";

// Add state
const [perfProfile, setPerfProfile] = useState(loadPerfProfile());

// Update canvas
<OnSiteCanvas
  map={mapInstance}
  modelUrl={modelUrl}
  placement={placement}
  perfProfile={perfProfile}  // New prop
/>

// Add UI
<PerfPanel onChange={setPerfProfile} />
<UsageHints />
<ShareBar state={shareState} onReset={handleReset} />
```

### Option B: Full Features (With Sun)
```tsx
import { OnSiteCanvasWithLights } from "@/components/maps/OnSiteCanvasWithLights";
import { PerfPanel } from "@/components/maps/PerfPanel";
import { SunControls } from "@/components/maps/SunControls";
import { ShareBar } from "@/components/maps/ShareBar";
import { UsageHints } from "@/components/maps/UsageHints";

// Add state
const [perfProfile, setPerfProfile] = useState(loadPerfProfile());
const [sunState, setSunState] = useState({ date: new Date(), hour: 12 });

// Replace canvas
<OnSiteCanvasWithLights
  map={mapInstance}
  modelUrl={modelUrl}
  placement={placement}
  perfProfile={perfProfile}
  sunState={sunState}
  enableSun={true}
/>

// Add UI
<PerfPanel onChange={setPerfProfile} />
<SunControls onChange={setSunState} />
<UsageHints />
<ShareBar state={shareState} onReset={handleReset} />
```

## 3. Environment Variables

Add to `.env.local`:
```env
ALLOW_PROXY_FALLBACK=false
```

## 4. Test

1. Open onsite page
2. Check PerfPanel loads (Low-end auto-detected on mobile)
3. Use SunControls to change time → light direction updates
4. Copy link → open in new tab → state preserved
5. Geocode search → debounced, cached
6. Check console: no new errors

## Features Enabled

✅ G4: Auto perf profile, FPS cap, lazy render
✅ G5: Model URL validation (use ModelUrlField in admin)
✅ G6: Sun simulation with time/date controls
✅ G7: Shareable permalinks with full state
✅ G8: Geocode cost guard (auto-cached)

## Admin: Validate Model URLs

```tsx
import { ModelUrlField } from "@/components/admin/ModelUrlField";

<ModelUrlField
  value={modelUrl}
  onChange={setModelUrl}
  onValidationChange={(result) => {
    if (!result.valid) {
      console.error(result.errors);
    }
  }}
/>
```

## Rollback

Remove G4-G8 components from page, keep OnSiteCanvas as-is. Zero breaking changes.
