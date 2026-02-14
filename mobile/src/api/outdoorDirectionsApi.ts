import Constants from 'expo-constants';
import { TransportModeApi, ManeuverTypeApi } from '../type';

const API_BASE_URL = (Constants.expoConfig?.extra as any)?.API_BASE_URL;

export interface Step {
  instruction: string;
  distance: string;
  duration: string;
  maneuverType: ManeuverTypeApi;
}

export interface OutdoorDirectionResponse {
  distance: string;
  duration: string;
  polyline: string;
  transportMode: TransportModeApi;
  steps: Step[];
}

/**
 * @param origin - Starting location string (Required)
 * @param destination - Ending location string (Required)
 * @param mode - Transport mode: walking, driving, bicycling, or transit (Required)
 */
export const getOutdoorDirections = async (
  origin: string,
  destination: string,
  mode: TransportModeApi = 'walking',
): Promise<OutdoorDirectionResponse | null> => {
  try {
    const url = `${API_BASE_URL}/api/directions/outdoor?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&transportMode=${mode}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const data: OutdoorDirectionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch directions:', error);
    return null;
  }
};
