# GLB on Map

## Setup

1. Create `.env.local` at the project root:
   ```
   NEXT_PUBLIC_MAPTILER_API_KEY="your-key-here"
   ```

2. Run `npm install` then `npm run dev`.

3. Open `/maps/glb-on-map`.

## Restrict Origins

Go to https://cloud.maptiler.com/account/keys/ and add your production domain(s) to the allowed origins for your API key.

## CORS

The GLB URL must be served with CORS headers (`Access-Control-Allow-Origin`). GitHub raw URLs, Cloudinary, and most CDNs work. Local files won't unless served by a dev server with CORS enabled.
