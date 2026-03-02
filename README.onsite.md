# Google Maps On-Site Placement

## Overview

Three-phase implementation of Google Maps "On-Site Placement" for GLB models using Next.js App Router, Maps JS API, and WebGLOverlayView with ThreeJSOverlayView for georeferenced placement.

## Features

### G1 - Prototype overlay & fixed placement
- ✅ Vector map with tilt & rotation enabled (via MAP_ID)
- ✅ ThreeJSOverlayView for georeferenced 3D model placement
- ✅ Load GLB from project.modelUrl (CORS-safe, HTTPS)
- ✅ Basic toolbar: Place, Reset, Fullscreen
- ✅ Safe defaults with feature flags
- ✅ Non-breaking: existing 3D viewer unchanged
- ✅ Graceful error handling for missing modelUrl

### G2 - Geocode + Elevation + oriented placement
- ✅ Address geocoding with debounce
- ✅ Ghost house marker at geocoded location
- ✅ Elevation API integration for altitude baseline
- ✅ Heading slider (0-360°) with 15° steps
- ✅ Altitude offset slider with 0.5m steps
- ✅ State persistence (URL params + localStorage)

### G3 - Lot polygon & fine-tune placement
- ✅ Interactive polygon drawing (click to add vertices)
- ✅ Editable polygon with vertex manipulation
- ✅ Centroid calculation and snap-to-center
- ✅ Draggable ghost marker within lot bounds
- ✅ Three modes: Edit Lot / Place / Confirm
- ✅ Final placement confirmation with telemetry

## File Structure

```
src/
├── lib/
│   ├── onsite/
│   │   ├── types.ts           # Type definitions
│   │   ├── config.ts          # Default values & constants
│   │   └── state.ts           # State management & localStorage
│   ├── maps/
│   │   ├── loader.ts          # Google Maps loader
│   │   ├── geocode.ts         # Geocoding API helper
│   │   └── elevation.ts       # Elevation API helper
│   └── telemetry.ts           # Analytics hooks (extended)
├── components/
│   └── maps/
│       ├── OnSiteCanvas.tsx          # ThreeJSOverlayView + model renderer
│       ├── ThreeJSOverlayCanvas.tsx  # Alternative implementation
│       ├── AddressForm.tsx           # Address search with geocoding
│       ├── PlacementControls.tsx     # Heading/altitude sliders
│       ├── LotEditor.tsx             # Polygon drawing & editing
│       └── DraggableGhost.tsx        # Draggable marker
└── app/
    └── project/
        └── [slug]/
            ├── page.tsx              # Main project page (with tab nav)
            └── onsite/
                └── page.tsx          # On-Site Placement page
```

## Environment Variables

Add to `.env.local`:

```bash
# Google Maps API (required)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your-map-id-for-vector-tiles
```

### Obtaining API Keys

1. **Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable: Maps JavaScript API, Geocoding API, Elevation API
   - Create credentials → API Key
   - Restrict key to your domain

2. **Map ID** (for vector tiles):
   - Go to [Google Cloud Console → Maps](https://console.cloud.google.com/google/maps-apis/studio/maps)
   - Create a new Map ID
   - Enable tilt and rotation in settings

## Usage

1. Navigate to any project with a 3D model
2. Click "On-Site Placement" tab
3. Search for an address or click on the map
4. Adjust heading and altitude using sliders
5. (Optional) Draw a lot polygon and snap to centroid
6. Drag the ghost marker to fine-tune position
7. Click "Confirm" to save placement

## API Routes

None required. All Google Maps APIs are called client-side.

## Dependencies

```json
{
  "@googlemaps/js-api-loader": "^1.x",
  "@googlemaps/three": "^1.x",
  "three": "^0.183.x"
}
```

## Telemetry Events

- `geocode_success` - Address successfully geocoded
- `elevation_fetch` - Elevation data fetched
- `placement_confirmed` - User confirmed final placement
- `lot_drawn` - Polygon lot drawn

## Acceptance Criteria

### G1
- [x] Map displays with vector tiles (tilt/rotate enabled)
- [x] Overlay renders GLB at correct anchor
- [x] Tilt, rotate, zoom work correctly
- [x] Reset button returns camera to default
- [x] Graceful error for missing modelUrl

### G2
- [x] Address input geocodes and centers map
- [x] Ghost house marker appears at result
- [x] Heading/altitude sliders update model in real-time
- [x] State persists on page reload (localStorage)

### G3
- [x] Draw polygon by clicking map
- [x] Edit polygon vertices
- [x] Snap to centroid button works
- [x] Drag ghost marker within lot
- [x] Confirm saves final transform
- [x] Reload preserves last confirmed placement

## Notes

- Uses ThreeJSOverlayView from @googlemaps/three for easier georeferencing
- Model is automatically centered and grounded (bottom = altitude)
- Polygon editing requires clicking "Edit Lot" mode first
- All coordinates use WGS84 (standard lat/lng)
- Altitude is in meters above ground
- Heading is in degrees (0 = North, 90 = East, etc.)
