/**
 * India territorial bounds and point-in-polygon check for ground track / burn location.
 * Coordinates in [longitude, latitude] degrees.
 */

// Bounding box for early rejection:
const INDIA_BBOX = {
  minLon: 68.0,
  maxLon: 97.5,
  minLat: 6.5,
  maxLat: 37.2,
};

// Simplified polygon boundary of India (mainland):
const INDIA_POLYGON: [number, number][] = [
  [74.8, 37.1], [77.8, 35.5], [78.7, 34.3], [79.0, 32.7], [80.3, 31.1],
  [80.1, 30.1], [81.0, 29.8], [88.2, 27.8], [88.9, 27.3], [89.8, 26.7],
  [92.1, 27.8], [95.0, 28.5], [97.4, 28.2], [97.1, 27.5], [95.2, 26.0],
  [93.3, 24.5], [92.3, 23.8], [92.2, 22.0], [91.8, 21.5], [89.0, 21.6],
  [87.0, 21.5], [85.0, 19.5], [83.0, 17.7], [80.3, 15.8], [80.3, 13.0],
  [79.8, 10.3], [79.3, 9.2], [77.5, 8.1], [76.5, 8.8], [75.0, 12.0],
  [73.8, 15.5], [72.8, 19.0], [72.6, 21.0], [69.0, 22.3], [68.2, 23.7],
  [70.5, 24.5], [71.0, 26.5], [73.5, 29.8], [74.5, 32.5], [74.8, 37.1]
];

/**
 * Standard Ray-casting algorithm for Point-In-Polygon.
 * @param latDeg Latitude in degrees (-90 to 90)
 * @param lonDeg Longitude in degrees (-180 to 180)
 */
export function isOverIndia(latDeg: number, lonDeg: number): boolean {
  if (
    lonDeg < INDIA_BBOX.minLon ||
    lonDeg > INDIA_BBOX.maxLon ||
    latDeg < INDIA_BBOX.minLat ||
    latDeg > INDIA_BBOX.maxLat
  ) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = INDIA_POLYGON.length - 1; i < INDIA_POLYGON.length; j = i++) {
    const xi = INDIA_POLYGON[i][0], yi = INDIA_POLYGON[i][1];
    const xj = INDIA_POLYGON[j][0], yj = INDIA_POLYGON[j][1];

    const intersect = ((yi > latDeg) !== (yj > latDeg)) &&
      (lonDeg < (xj - xi) * (latDeg - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const INDIA_COORDINATES = INDIA_POLYGON;
export const INDIA_BOUNDS = INDIA_BBOX;
