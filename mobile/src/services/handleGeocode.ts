// src/services/geocoding.ts
import * as Location from "expo-location";

interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Reverse-geocodes a coordinate pair into the most human-readable
 * place name available.
 *
 * Resolution order:
 *   1. Named landmark / POI  (r.name)
 *   2. Street address        (r.streetNumber + r.street)
 *   3. Street only           (r.street)
 *   4. District / borough    (r.district)
 *   5. Sub-region            (r.subregion)
 *   6. City                  (r.city)
 *   7. Raw coords fallback   ("45.49700, -73.57900")
 *
 * Throws if expo-location itself throws (caller should handle).
 */
export async function reverseGeocode(coords: Coords): Promise<string> {
  const results = await Location.reverseGeocodeAsync(coords);
  const r = results[0];

  if (!r) {
    return formatCoords(coords);
  }

  if (r.name) return r.name;
  if (r.streetNumber && r.street) return `${r.streetNumber} ${r.street}`;
  if (r.street) return r.street;
  if (r.district) return r.district;
  if (r.subregion) return r.subregion;
  if (r.city) return r.city;

  return formatCoords(coords);
}

/**
 * Formats coordinates as a compact, readable fallback string.
 * e.g. "45.49700, -73.57900"
 */
export function formatCoords(coords: Coords): string {
  return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
}
