import { TransportModeApi, ManeuverTypeApi } from '../type';
import { API_BASE_URL } from "../const";

export interface Step {
  instruction: string;
  distance: string;
  duration: string;
  maneuverType: ManeuverTypeApi;
  polyline: string; // now returned per-step from backend
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
    mode: TransportModeApi = 'walking',
): Promise<OutdoorDirectionResponse | null> => {
  try {
    const url = `${API_BASE_URL}/api/directions/outdoor?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&transportMode=${mode}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    const text = await response.text();
    if (!text) return null;

    const data: OutdoorDirectionResponse = JSON.parse(text);
    return data;
  } catch (error) {
    console.error('Failed to fetch directions:', error);
    return null;
  }
};