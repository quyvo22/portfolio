export const MAPTILER_DEFAULTS = {
  style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? ""}`,
  center: [106.660172, 10.762622] as [number, number],
  zoom: 17,
  pitch: 55,
  bearing: 0,
};
