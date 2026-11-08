const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two lat/lon points, in meters. */
export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const a = sinDLat * sinDLat + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * sinDLon * sinDLon;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Full weight beyond this distance from the nearest docking station (meters).
export const DAMPING_FULL_WEIGHT_RADIUS_METERS = 180;
// Minimum weight a submission keeps even right next to a station - a report
// right beside existing infrastructure is still a real signal, just weaker.
export const DAMPING_FLOOR = 0.25;

/**
 * Linear falloff: weight is DAMPING_FLOOR at distance 0, ramping up to 1.0
 * at DAMPING_FULL_WEIGHT_RADIUS_METERS and beyond.
 */
export function dampingWeight(nearestStationDistanceMeters: number): number {
  const t = Math.min(1, Math.max(0, nearestStationDistanceMeters / DAMPING_FULL_WEIGHT_RADIUS_METERS));
  return DAMPING_FLOOR + (1 - DAMPING_FLOOR) * t;
}
