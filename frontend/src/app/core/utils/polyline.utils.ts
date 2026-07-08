import { LatLng } from '../models/route.model';

/**
 * Decodes a Google encoded polyline string to an array of LatLng coordinates.
 * Uses precision 5 (Google standard).
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Encodes an array of LatLng coordinates to a Google encoded polyline string.
 * Uses precision 5 (Google standard).
 */
export function encodePolyline(points: LatLng[]): string {
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    output += encodeValue(lat - prevLat);
    output += encodeValue(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return output;
}

function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let output = '';

  while (v >= 0x20) {
    output += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }

  output += String.fromCharCode(v + 63);
  return output;
}

/**
 * Calculates the distance between two points using the Haversine formula (km).
 */
export function calculateDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculates total route distance in km
 */
export function totalRouteDistance(points: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistance(points[i], points[i + 1]);
  }
  return total;
}

/**
 * Finds the nearest segment index to insert a point
 */
export function findInsertIndex(point: LatLng, points: LatLng[]): number {
  if (points.length < 2) return points.length;

  let minDistance = Infinity;
  let insertIndex = points.length;

  for (let i = 0; i < points.length - 1; i++) {
    const dist = distanceToSegment(point, points[i], points[i + 1]);
    if (dist < minDistance) {
      minDistance = dist;
      insertIndex = i + 1;
    }
  }
  return insertIndex;
}

function distanceToSegment(point: LatLng, segStart: LatLng, segEnd: LatLng): number {
  const x = point.lng;
  const y = point.lat;
  const x1 = segStart.lng;
  const y1 = segStart.lat;
  const x2 = segEnd.lng;
  const y2 = segEnd.lat;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = lenSq !== 0 ? dot / lenSq : -1;

  let xx: number, yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}
