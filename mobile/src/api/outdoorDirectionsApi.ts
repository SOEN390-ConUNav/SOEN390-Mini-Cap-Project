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
): Promise<OutdoorDirectionResponse | null> => {
  try {
    const url = `${API_BASE_URL}/api/directions/outdoor?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&transportMode=${mode.toUpperCase()}`;
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
): Promise<OutdoorDirectionResponse | null> {
  try {
    const url = `${API_BASE_URL}/api/directions/outdoor/shuttle?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&destinationShuttle=${dest_shuttle}`;
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
