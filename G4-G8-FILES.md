# G4-G8 File Manifest

## New Files Created

### G4 - Performance
- `src/lib/onsite/perf.ts`
- `src/components/maps/PerfPanel.tsx`

### G5 - CORS Hardening
- `src/lib/storage/assetProbe.ts`
- `src/lib/validators/model.ts`
- `src/components/admin/ModelUrlField.tsx`
- `src/app/api/proxy/route.ts`

### G6 - Sun Simulation
- `src/lib/solar.ts`
- `src/components/maps/SunControls.tsx`
- `src/components/maps/Lights.tsx`
- `src/components/maps/GroundShadow.tsx`

### G7 - Share & Export
- `src/lib/share/permalink.ts`
- `src/components/maps/ShareBar.tsx`
- `src/lib/capture/canvas.ts`

### G8 - Cost Guard
- `src/lib/maps/cost.ts`
- `src/components/maps/UsageHints.tsx`

### Integration
- `src/components/maps/OnSiteCanvasWithLights.tsx`
- `src/lib/onsite/index.ts`
- `src/lib/maps/index.ts`
- `src/components/maps/index.ts`
- `src/lib/share/index.ts`
- `src/lib/solar/index.ts`
- `src/lib/validators/index.ts`
- `src/lib/storage/index.ts`
- `src/lib/capture/index.ts`

### Documentation
- `src/lib/onsite/integration.md`
- `IMPLEMENTATION_G4-G8.md`
- `QUICK_START_G4-G8.md`
- `G4-G8-FILES.md` (this file)

## Modified Files

### G4
- `src/components/maps/OnSiteCanvas.tsx` - Added perfProfile prop, camera sync, lazy render
- `src/lib/telemetry.ts` - Added map_camera_sync, model_interaction, fps_bucket events

### G5
- `src/lib/onsite/config.ts` - Added STORAGE_CONFIG, COST_GUARD
- `.env.local.example` - Added ALLOW_PROXY_FALLBACK

### G8
- `src/components/maps/AddressForm.tsx` - Wrapped geocode with cachedGeocode

### Integration
- `src/app/project/[slug]/onsite/page.tsx` - Integrated all G4-G8 components

## Total Count
- **New files:** 28
- **Modified files:** 5
- **Total:** 33 files

## Backward Compatibility
All changes are non-breaking:
- Existing `OnSiteCanvas` works unchanged (perfProfile is optional)
- New components are opt-in
- AddressForm geocode caching is transparent
- Flags default to safe values
