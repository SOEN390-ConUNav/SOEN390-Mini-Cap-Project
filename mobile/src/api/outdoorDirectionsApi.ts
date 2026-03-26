import { TransportModeApi, ManeuverTypeApi } from "../type";
import { API_BASE_URL } from "../const";

export interface Step {
  instruction: string;
  distance: string;
  duration: string;
  maneuverType: ManeuverTypeApi;
  polyline: string;
}

export interface OutdoorDirectionResponse {
  distance: string;
  duration: string;
  polyline: string;
  transportMode: TransportModeApi;
  steps: Step[];
}

const normalizeTransportMode = (mode: unknown): TransportModeApi => {
  const normalized = typeof mode === "string" ? mode.toLowerCase() : "";
  switch (normalized) {
    case "walking":
    case "driving":
    case "bicycling":
    case "transit":
    case "shuttle":
      return normalized;
    default:
      return "walking";
  }
};

const normalizeOutdoorDirectionResponse = (
  data: OutdoorDirectionResponse,
): OutdoorDirectionResponse => ({
  ...data,
  transportMode: normalizeTransportMode(data.transportMode),
});

export const getOutdoorDirections = async (
  origin: string,
  destination: string,
  mode: TransportModeApi = "walking",
  options?: {
    originBuildingId?: string;
    destinationBuildingId?: string;
  },
): Promise<OutdoorDirectionResponse | null> => {
  try {
    const params = new URLSearchParams({
      origin,
      destination,
      transportMode: mode.toUpperCase(),
    });
    if (options?.originBuildingId) {
      params.append("originBuildingId", options.originBuildingId);
    }
    if (options?.destinationBuildingId) {
      params.append("destinationBuildingId", options.destinationBuildingId);
    }
    const url = `${API_BASE_URL}/api/directions/outdoor?${params.toString()}`;
    const response = await fetch(url);

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = (await response.json()) as OutdoorDirectionResponse;
    return normalizeOutdoorDirectionResponse(data);
  } catch (error) {
    console.error("Failed to fetch directions:", error);
    return null;
  }
};
export async function getOutdoorDirectionsWithShuttle(
  origin: string,
  destination: string,
  dest_shuttle: string,
  options?: {
    originBuildingId?: string;
    destinationBuildingId?: string;
  },
): Promise<OutdoorDirectionResponse | null> {
  try {
    const params = new URLSearchParams({
      origin,
      destination,
      destinationShuttle: dest_shuttle,
    });
    if (options?.originBuildingId) {
      params.append("originBuildingId", options.originBuildingId);
    }
    if (options?.destinationBuildingId) {
      params.append("destinationBuildingId", options.destinationBuildingId);
    }
    const url = `${API_BASE_URL}/api/directions/outdoor/shuttle?${params.toString()}`;
    const response = await fetch(url);
    const contentLength = response.headers.get("content-length");
    if (response.status === 204 || contentLength === "0") {
      console.log(
        "Shuttle not available (Schedule closed or logic returned null)",
      );
      return null;
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = (await response.json()) as OutdoorDirectionResponse;
    return normalizeOutdoorDirectionResponse(data);
  } catch (error) {
    console.error("Failed to fetch directions:", error);
    return null;
  }
}
