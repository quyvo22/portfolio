# Migration Guide - On-Site Placement Feature

## Overview

This guide helps you integrate the Google Maps On-Site Placement feature into your existing Next.js portfolio application.

## Prerequisites

- Next.js 14+ with App Router
- Existing project structure with 3D model viewer
- Project data model with `modelUrl` field

## Step-by-Step Integration

### 1. Install Dependencies

```bash
npm install @googlemaps/js-api-loader @googlemaps/three
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your-map-id
```

### 3. Enable Google Cloud APIs

In Google Cloud Console:
1. Enable Maps JavaScript API
2. Enable Geocoding API
3. Enable Elevation API
4. Create Map ID with vector tiles + tilt/rotation

### 4. Update next.config.js

```js
const nextConfig = {
  // ... existing config
  transpilePackages: ["three"],
};
```

### 5. File Structure

All new files are in:
- `src/lib/onsite/` - Core logic
- `src/lib/maps/` - Google Maps integration
- `src/components/maps/` - UI components
- `src/app/project/[slug]/onsite/` - Page route

### 6. Integration Points

#### A. Project Page (Optional Tab Navigation)

The tab navigation is automatically added if the project has a valid `modelUrl`.

```tsx
// src/app/project/[slug]/page.tsx
import { ProjectTabs } from "@/components/project/ProjectTabs";

<ProjectTabs
  slug={slug}
  modelUrl={project.modelUrl}
  projectTitle={project.title}
/>
```

#### B. Direct Link

Or link directly:

```tsx
<Link
  href={`/project/${slug}/onsite?modelUrl=${encodeURIComponent(
    project.modelUrl
  )}&title=${encodeURIComponent(project.title)}`}
>
  On-Site Placement
</Link>
```

### 7. Testing

1. Navigate to a project with a 3D model
2. Click "On-Site Placement" tab
3. Search for an address
4. Verify model appears on map
5. Test heading/altitude controls
6. Test polygon drawing
7. Confirm placement saves to localStorage

## Rollback Strategy

### Complete Rollback

Remove these directories:
- `src/lib/onsite/`
- `src/lib/maps/`
- `src/components/maps/`
- `src/app/project/[slug]/onsite/`
- `src/components/project/`

Revert changes to:
- `src/app/project/[slug]/page.tsx`
- `src/lib/telemetry.ts`
- `next.config.js`

### Partial Rollback

To disable only specific phases:

**Disable G3 (Polygon tools)**:
```tsx
// Comment out in onsite/page.tsx
// <LotEditor ... />
```

**Disable G2 (Geocoding)**:
```tsx
// Comment out in onsite/page.tsx
// <AddressForm ... />
// <PlacementControls ... />
```

**Disable G1 (3D overlay)**:
```tsx
// Comment out in onsite/page.tsx
// <OnSiteCanvas ... />
```

## Configuration Options

### Map Defaults

Edit `src/lib/onsite/config.ts`:

```ts
export const DEFAULT_PLACEMENT = {
  lat: 10.762622,    // Default latitude
  lng: 106.660172,   // Default longitude
  altitude: 0,       // Default altitude (m)
  heading: 0,        // Default rotation (degrees)
  scale: 1,          // Default scale
};

export const MAP_CONFIG = {
  zoom: 18,           // Default zoom level
  tilt: 45,           // Map tilt (0-67.5°)
  heading: 0,         // Map heading (degrees)
  mapTypeId: "satellite",
};
```

### Control Steps

```ts
export const HEADING_STEP = 15;      // Heading slider step (degrees)
export const ALTITUDE_STEP = 0.5;    // Altitude slider step (meters)
export const SCALE_MIN = 0.1;
export const SCALE_MAX = 5;
```

## Troubleshooting

### "Google Maps not loaded"

- Verify API key in `.env.local`
- Check API key restrictions in Cloud Console
- Ensure Maps JavaScript API is enabled

### "Invalid Map ID"

- Create new Map ID in Cloud Console
- Enable vector tiles
- Enable tilt and rotation
- Copy Map ID to `.env.local`

### "Model not rendering"

- Verify model URL is HTTPS
- Check CORS headers on model storage
- Ensure GLB format (not separate .gltf + .bin)
- Check browser console for errors

### "Geocoding fails"

- Verify Geocoding API is enabled
- Check API key has geocoding permissions
- Try with full address (street, city, country)

### "State not persisting"

- Check localStorage is enabled in browser
- Verify localStorage isn't full
- Check for third-party cookie restrictions

## Performance Tips

1. **Optimize Model Size**: Keep GLB files under 10MB
2. **Use Draco Compression**: Compress geometry
3. **Limit Polygon Vertices**: Keep lot polygons simple
4. **Cache Geocoding**: Already implemented
5. **Request-based Rendering**: Already optimized

## Security Considerations

1. **API Key Restrictions**:
   - Restrict by HTTP referrer
   - Restrict to specific APIs only
   - Monitor usage in Cloud Console

2. **Model URL Validation**:
   - Already validates HTTPS
   - Already checks CORS
   - Already validates MIME type

3. **localStorage Data**:
   - Only stores coordinates
   - No sensitive information
   - Can be cleared by user

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Full |
| Firefox | 88+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Edge    | 90+     | ✅ Full |
| Mobile  | All     | ✅ Responsive |

## API Costs (Google Maps)

Estimated per 1000 users/month:

- Maps JavaScript API: $7.00
- Geocoding API: $5.00
- Elevation API: $5.00
- **Total**: ~$17.00

Free tier: $200/month credit

## Support

For issues:
1. Check browser console
2. Verify API keys and Map ID
3. Test with example address
4. Review CORS configuration
5. Check model URL accessibility

## Next Steps

After successful integration:
1. Customize default coordinates
2. Add project-specific coordinates to database
3. Integrate with project creation form
4. Add export functionality (screenshot, coordinates)
5. Consider adding scale controls
6. Add measurement units (metric/imperial)
