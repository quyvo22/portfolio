export interface SunPosition {
  azimuth: number;
  elevation: number;
}

export function getSunDirection(
  lat: number,
  lng: number,
  date: Date
): SunPosition {
  const jd = toJulianDay(date);
  const n = jd - 2451545.0;

  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);

  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * (Math.PI / 180);

  const epsilon = (23.439 - 0.0000004 * n) * (Math.PI / 180);

  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

  const gmst = (280.460 + 360.9856474 * n) % 360;
  const lst = (gmst + lng) * (Math.PI / 180);

  const h = lst - ra;

  const latRad = lat * (Math.PI / 180);

  const sinAlt = Math.sin(latRad) * Math.sin(dec) +
                 Math.cos(latRad) * Math.cos(dec) * Math.cos(h);
  const alt = Math.asin(sinAlt);

  const cosAz = (Math.sin(dec) - Math.sin(latRad) * sinAlt) /
                (Math.cos(latRad) * Math.cos(alt));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));

  if (Math.sin(h) > 0) {
    az = 2 * Math.PI - az;
  }

  return {
    azimuth: az * (180 / Math.PI),
    elevation: alt * (180 / Math.PI),
  };
}

function toJulianDay(date: Date): number {
  const time = date.getTime();
  return time / 86400000 + 2440587.5;
}

export function sunPositionToDirection(sun: SunPosition): [number, number, number] {
  const azRad = sun.azimuth * (Math.PI / 180);
  const elRad = sun.elevation * (Math.PI / 180);

  const x = Math.cos(elRad) * Math.sin(azRad);
  const y = Math.sin(elRad);
  const z = Math.cos(elRad) * Math.cos(azRad);

  return [x, y, z];
}
