import { API_BASE_URL } from "../const";
import { TransportModeApi } from "../type";
import { checkAndGetViableShuttleDestination } from "../utils/navigationUtils";
import {
  getOutdoorDirections,
  getOutdoorDirectionsWithShuttle,
  OutdoorDirectionResponse,
} from "./outdoorDirectionsApi";

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
}

export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  placeType: string,
): Promise<NearbyPlace[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/places/outdoor` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&placeType=${placeType}`,
      { method: "POST" },
    );

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const json = await response.json();

    return (json.places ?? []).map((p: any, index: number) => ({
      id: index.toString(),
      name: p.displayName?.text ?? "Unknown",
      address: p.formattedAddress ?? "",
      location: p.location,
      rating: p.rating,
    }));
  } catch {
    return [];
  }
}
export const getAllOutdoorDirectionsInfo = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) => {
  const modes: TransportModeApi[] = [
    "walking",
    "bicycling",
    "transit",
    "driving",
  ];

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;

  try {
    const results = await Promise.all(
      modes.map((mode) => getOutdoorDirections(originStr, destStr, mode)),
    );
    const dest_shuttle = checkAndGetViableShuttleDestination(
      destination,
      origin,
    );
    if (dest_shuttle) {
      results.push(
        await getOutdoorDirectionsWithShuttle(originStr, destStr, dest_shuttle),
      );
    }

    const validResults = results.filter(
      (res): res is OutdoorDirectionResponse => res !== null,
    );

    return validResults;
  } catch (error) {
    console.error("Error fetching all transport modes:", error);
    return [];
  }
};
