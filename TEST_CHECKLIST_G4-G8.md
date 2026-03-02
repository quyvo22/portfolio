# G4-G8 Testing Checklist

## Pre-Flight

- [ ] `npm install` completed without errors
- [ ] `.env.local` has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
- [ ] `ALLOW_PROXY_FALLBACK=false` added to `.env.local`
- [ ] Dev server starts: `npm run dev`
- [ ] No TypeScript errors: `npm run build` (or `tsc --noEmit`)

## G4 - Performance Profile

### Desktop Chrome
- [ ] Open onsite page
- [ ] Check PerfPanel appears in sidebar
- [ ] Default: Low-end OFF, FPS cap NONE, Lazy render OFF
- [ ] Model loads and renders smoothly (~60 FPS)
- [ ] Enable "Low-end mode" → shadows reduce quality
- [ ] Set FPS cap to 30 → rendering throttled
- [ ] Enable "Lazy render" → when not interacting, rendering pauses

### Mobile Device (iOS/Android)
- [ ] Open onsite page on real device
- [ ] PerfPanel auto-detects low-end (if <4GB RAM or <4 CPU cores)
- [ ] Model loads without crashing
- [ ] FPS stable (~30 FPS)
- [ ] Camera interactions smooth

### Telemetry
- [ ] Open DevTools → Console
- [ ] Drag map → see `map_camera_sync` events
- [ ] Adjust scale/heading → see `model_interaction` events

## G5 - CORS & Storage Hardening

### Admin URL Validation
- [ ] Add `<ModelUrlField>` to admin form (or test standalone)
- [ ] Enter valid GLB URL (HTTPS, ends with .glb)
  - [ ] After 800ms, shows ✓ Valid with MIME and size
- [ ] Enter non-HTTPS URL
  - [ ] Shows error: "URL must use HTTPS protocol"
- [ ] Enter URL without .glb/.gltf extension
  - [ ] Shows error: "URL must end with .glb or .gltf"
- [ ] Enter URL to server that blocks CORS
  - [ ] Shows error: "CORS error" + warning
- [ ] Enter URL to large file (>100MB)
  - [ ] Shows error: "File too large"

### Proxy Fallback
- [ ] Default: ALLOW_PROXY_FALLBACK=false
- [ ] Call `/api/proxy?url=...` → Returns 403 "Proxy fallback is disabled"
- [ ] Set ALLOW_PROXY_FALLBACK=true, restart server
- [ ] Call `/api/proxy?url=https://valid-url.com/model.glb` → Proxies successfully
- [ ] Revert to false after testing

## G6 - Sun Path & Shadow Study

### Sun Controls UI
- [ ] Open onsite page (use page-with-sun.example.tsx or integrated version)
- [ ] SunControls panel appears in sidebar
- [ ] Default: Today's date, 12:00 hour
- [ ] Change time slider 6→18 → DirectionalLight position changes
- [ ] Click "9AM" preset → Light updates instantly
- [ ] Click "12PM" preset → Light updates to noon position
- [ ] Click "3PM" preset → Light updates to afternoon position
- [ ] Click "Play" button → Time animates from current to 18:00 (stops automatically)
- [ ] During play, pause works

### Sun Calculation
- [ ] Set date to summer solstice (June 21)
- [ ] Set time to 12:00 → Sun high in sky (elevation ~60-70°)
- [ ] Set date to winter solstice (Dec 21)
- [ ] Set time to 12:00 → Sun lower in sky (elevation ~20-30°)
- [ ] Shadow direction changes accordingly

### Shadow Quality
- [ ] Desktop: Sharp shadows, smooth gradients
- [ ] Mobile low-end: Softer shadows, reduced resolution
- [ ] Ground shadow plane visible under model

## G7 - Export & Share

### Permalink
- [ ] Set custom lat/lng/altitude/heading/scale
- [ ] Adjust sun time to 15:00
- [ ] Enable low-end mode
- [ ] Draw lot polygon (if available)
- [ ] Click "Copy Link" in ShareBar
- [ ] Toast shows "✓ Copied!"
- [ ] Open link in new tab/incognito
  - [ ] All state restored: placement, sun time, low-end, polygon

### Reset
- [ ] Click "Reset" button
- [ ] All values return to defaults
- [ ] Sun time resets to 12:00, today
- [ ] Placement resets to DEFAULT_PLACEMENT

### Canvas Capture
- [ ] Call `captureOverlay(scene, camera, renderer)` programmatically
- [ ] Returns data URL
- [ ] Can download as PNG
- [ ] Watermark text appears at bottom (if specified)
- [ ] Note: Google Map layer not captured (expected due to CORS)

## G8 - Cost Guard & Quota Hygiene

### Geocode Debounce
- [ ] Open AddressForm
- [ ] Type address quickly → Only 1 call after 600ms pause
- [ ] Check Network tab → Geocode API called once per 600ms minimum

### Cache
- [ ] Search "123 Main St" → API called
- [ ] Search "123 Main St" again → No API call (cached)
- [ ] Refresh page
- [ ] Search "123 Main St" again → No API call (localStorage cache hit)

### Usage Warning
- [ ] Make 50+ geocode searches in rapid succession
- [ ] UsageHints panel appears
- [ ] Shows warning: "High API Usage"
- [ ] Count displayed: "You've made 50 geocode requests"
- [ ] Click "Dismiss" → Warning hides

## Integration Smoke Test

### Full Flow
- [ ] Start dev server
- [ ] Navigate to `/project/[slug]/onsite?modelUrl=https://...&title=Test`
- [ ] Map loads
- [ ] Search address → marker placed
- [ ] Adjust placement controls → model updates
- [ ] Draw lot polygon → polygon renders
- [ ] Drag ghost to new position → model follows
- [ ] Click "Confirm" → placement locked
- [ ] Adjust sun time → lighting changes
- [ ] Toggle perf settings → quality adjusts
- [ ] Copy link → state preserved
- [ ] No console errors
- [ ] No network errors
- [ ] Lighthouse score unchanged (±2 points)

## Regression Tests

### Existing Features Still Work
- [ ] 3D viewer page unaffected
- [ ] Project listing page unaffected
- [ ] Admin upload still works
- [ ] All existing telemetry events fire
- [ ] No broken imports
- [ ] Build succeeds: `npm run build`

## Performance Metrics

### Desktop (Chrome)
- [ ] FPS: 55-60 (without sun) or 50-60 (with sun)
- [ ] First contentful paint: <2s
- [ ] Time to interactive: <3s
- [ ] No memory leaks over 5 minutes

### Mobile (4GB RAM, 4 cores)
- [ ] FPS: 25-30 (low-end profile)
- [ ] No crashes
- [ ] Interactions responsive (<100ms)
- [ ] Battery drain acceptable

### Network
- [ ] Geocode cache hit rate: >80% on repeated searches
- [ ] No unnecessary API calls
- [ ] Proxy disabled by default

## Edge Cases

- [ ] No model URL → Error message displayed
- [ ] Invalid model URL → Validation error shown
- [ ] CORS-blocked model → Early warning, doesn't crash
- [ ] No internet → Graceful offline handling
- [ ] Small screen (<768px) → UI still usable
- [ ] Large model (>50MB) → Progress indicator works
- [ ] Rapid camera movement → No stutter
- [ ] 100+ geocode searches → Cache + debounce prevent spam

## Cleanup

- [ ] Remove test data from localStorage
- [ ] Revert ALLOW_PROXY_FALLBACK to false
- [ ] Document any discovered issues
- [ ] Update CHANGELOG if deploying

## Final Check

- [ ] No console warnings
- [ ] No network errors (except expected CORS for non-compliant URLs)
- [ ] TypeScript types correct
- [ ] ESLint passes
- [ ] All documentation accurate
- [ ] Ready for code review

---

**Pass Criteria:** All core tests pass, no breaking changes, performance acceptable.
