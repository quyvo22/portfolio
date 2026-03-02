# G4-G8 Implementation Summary

## Overview
Completed phases G4-G8 for On-Site Placement feature. All changes are non-breaking, additive, and maintain backward compatibility.

## ✅ G4 - Camera Sync & Performance

**Files Created:**
- `src/lib/onsite/perf.ts` - Performance profile helpers
- `src/components/maps/PerfPanel.tsx` - UI controls

**Files Modified:**
- `src/components/maps/OnSiteCanvas.tsx` - Added perf profile support, camera sync listeners, lazy render
- `src/lib/telemetry.ts` - Added events: map_camera_sync, model_interaction, fps_bucket

**Features:**
- Auto-detect low-end mobile devices
- FPS capping (30/60) with throttled render
- Lazy render when idle (no user interaction)
- Camera interaction telemetry
- Quality downgrade on low-end (shadow resolution, ambient intensity)

## ✅ G5 - CORS & Storage Hardening

**Files Created:**
- `src/lib/storage/assetProbe.ts` - HEAD probe for asset validation
- `src/lib/validators/model.ts` - URL/MIME/size validation
- `src/components/admin/ModelUrlField.tsx` - Admin UI with live validation
- `src/app/api/proxy/route.ts` - Optional CORS proxy (disabled by default)

**Files Modified:**
- `src/lib/onsite/config.ts` - Added STORAGE_CONFIG, COST_GUARD
- `.env.local.example` - Added ALLOW_PROXY_FALLBACK

**Features:**
- Async URL validation (HTTPS, extension, MIME, size)
- Early CORS error detection with actionable warnings
- Optional proxy fallback (flag-protected)
- Admin field shows validation status in real-time

## ✅ G6 - Sun Path & Shadow Study

**Files Created:**
- `src/lib/solar.ts` - Solar azimuth/elevation calculator (no external API)
- `src/components/maps/SunControls.tsx` - Date/time picker with presets + play mode
- `src/components/maps/Lights.tsx` - Dynamic light creation/update based on sun position
- `src/components/maps/GroundShadow.tsx` - Contact shadow plane

**Features:**
- Real-time sun direction calculation based on lat/lng/date/time
- DirectionalLight follows solar path
- Intensity adjusts by sun elevation
- 9AM/12PM/3PM presets + auto-play animation
- Ground shadow with quality downgrade on low-end

## ✅ G7 - Export Report & Share

**Files Created:**
- `src/lib/share/permalink.ts` - URL state encoding/decoding
- `src/components/maps/ShareBar.tsx` - Copy link + reset UI
- `src/lib/capture/canvas.ts` - WebGL canvas screenshot utility

**Features:**
- Encode full state in URL: lat/lng/alt/heading/scale/time/date/lowEnd/lotPolygon
- One-click copy permalink with toast feedback
- Canvas capture with watermark (overlay-only, map layer excluded due to CORS)
- Reset to defaults button
- Auto-load state from URL on mount

## ✅ G8 - Cost Guard & Quota Hygiene

**Files Created:**
- `src/lib/maps/cost.ts` - Debounce, cache (memory + localStorage), usage counter
- `src/components/maps/UsageHints.tsx` - Warning UI when threshold exceeded

**Files Modified:**
- `src/components/maps/AddressForm.tsx` - Wrapped geocode with cachedGeocode
- `src/lib/onsite/config.ts` - Added COST_GUARD config

**Features:**
- 600ms debounce on geocode calls
- Two-tier cache: in-memory + localStorage with TTL
- Per-session usage counter (resets hourly)
- Warning UI at 50+ calls/session
- Transparent caching (no API change)

## Integration

**Main Integration File:**
- `src/app/project/[slug]/onsite/page.tsx` - Updated with all G4-G8 components

**New Composite Component:**
- `src/components/maps/OnSiteCanvasWithLights.tsx` - Full-featured canvas with sun simulation

**Barrel Exports:**
- `src/lib/onsite/index.ts`
- `src/lib/maps/index.ts`
- `src/components/maps/index.ts`

**Documentation:**
- `src/lib/onsite/integration.md` - Integration guide with examples

## Migration Path

### Minimal (G4 + G8 only):
Keep existing `OnSiteCanvas`, automatically gets perf + cost guard.

### Standard (G4-G8 without sun):
```tsx
<OnSiteCanvas perfProfile={perfProfile} />
<PerfPanel onChange={setPerfProfile} />
<ShareBar state={shareState} />
<UsageHints />
```

### Full (G4-G8 with sun):
```tsx
<OnSiteCanvasWithLights
  perfProfile={perfProfile}
  sunState={sunState}
  enableSun={true}
/>
<PerfPanel />
<SunControls onChange={setSunState} />
<ShareBar />
<UsageHints />
```

## Environment Variables

```env
ALLOW_PROXY_FALLBACK=false  # G5: Enable CORS proxy
```

## Testing Checklist

- [ ] Desktop Chrome: Mượt mà, không lag
- [ ] Mobile iOS/Android: Low-end profile tự động, FPS ổn định
- [ ] Geocode spam: Debounce + cache hoạt động, warning hiển thị
- [ ] Sun controls: Thay đổi time/date → hướng nắng + bóng chính xác
- [ ] Permalink: Copy → mở tab mới → state khôi phục đúng
- [ ] Model URL validation: CORS/MIME/size errors hiển thị trước khi save
- [ ] Không có console errors mới
- [ ] Lighthouse: không giảm >2 điểm

## Public API Preserved

All existing components work unchanged:
- `OnSiteCanvas` props: optional `perfProfile` added
- `AddressForm` geocode: transparent caching
- All other components: 100% backward compatible

## Flags & Defaults

- `ALLOW_PROXY_FALLBACK`: false (safe default)
- `perfProfile.lowEnd`: auto-detect on first load
- `perfProfile.fpsCap`: null (unlimited)
- `perfProfile.lazyRender`: false
- `COST_GUARD.geocodeDebounceMs`: 600
- `COST_GUARD.perSessionWarn`: 50
