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

export const getOutdoorDirections = async (
  origin: string,
  destination: string,
  mode: TransportModeApi = "walking",
): Promise<OutdoorDirectionResponse | null> => {
  try {
    const url = `${API_BASE_URL}/api/directions/outdoor?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&transportMode=${mode}`;
    const response = await fetch(url);

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = (await response.json()) as OutdoorDirectionResponse;
    return data;
  } catch (error) {
    console.error("Failed to fetch directions:", error);
    return null;
  }
};
