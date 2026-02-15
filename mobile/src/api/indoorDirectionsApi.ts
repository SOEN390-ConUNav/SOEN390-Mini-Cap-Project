import Constants from "expo-constants";

import { IndoorDirectionResponse, RoutePoint } from "../types/indoorDirections";


const getDefaultApiUrl = () => {
  return (Constants.expoConfig?.extra as any)?.API_BASE_URL;
};

const API_BASE_URL = getDefaultApiUrl();


/**
 * Get indoor directions from backend
 */
export async function getIndoorDirections(
  buildingId: string,
  origin: string,
  destination: string,
  originFloor?: string,
  destinationFloor?: string
): Promise<IndoorDirectionResponse> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined");
  }

  const params = new URLSearchParams({
    buildingId,
    origin,
    destination,
  });

  if (originFloor) params.append("originFloor", originFloor);
  if (destinationFloor) params.append("destinationFloor", destinationFloor);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/directions/indoor?${params.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Backend error (${response.status}): ${errorText}`);
    }

    return response.json();
  } catch (error: any) {
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}.`
      );
    }
    throw error;
  }
}

/**
 * Get list of available rooms for a building/floor from the backend
 */
export async function getAvailableRooms(
  buildingId: string,
  floor?: string
): Promise<string[]> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined");
  }

  const params = new URLSearchParams({
    buildingId,
  });

  if (floor) params.append("floor", floor);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/directions/indoor/rooms?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const rooms = await response.json();
    return Array.isArray(rooms) ? rooms.sort((a: string, b: string) => a.localeCompare(b)) : [];
  } catch (error: any) {
    console.warn("Failed to fetch rooms from backend, using fallback:", error);
    return [];
  }
}

export interface Waypoint {
  x: number;
  y: number;
  id: string;
}

export interface RoomPoint {
  x: number;
  y: number;
  id: string;
}

/**
 * Get list of room points (coordinates) for a building/floor from the backend
 */
export async function getRoomPoints(
  buildingId: string,
  floor?: string
): Promise<RoomPoint[]> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined");
  }

  const params = new URLSearchParams({
    buildingId,
  });

  if (floor) params.append("floor", floor);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/directions/indoor/room-points?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const roomPoints = await response.json();
    return Array.isArray(roomPoints) ? roomPoints : [];
  } catch (error: any) {
    console.error("Failed to fetch room points from backend:", error);
    return [];
  }
}

export interface PoiItem {
  x: number;
  y: number;
  id: string;          
  displayName: string;
  type: string;       
}

/**
 * Get all Points of Interest for a building/floor from the backend
 */
export async function getPointsOfInterest(
  buildingId: string,
  floor?: string
): Promise<PoiItem[]> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined");
  }

  const params = new URLSearchParams({ buildingId });
  if (floor) params.append("floor", floor);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/directions/indoor/pois?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const pois = await response.json();
    return Array.isArray(pois) ? pois : [];
  } catch (error: any) {
    console.error("Failed to fetch POIs from backend:", error);
    return [];
  }
}

/**
 * Get all waypoints for a building/floor from the backend
 */
export async function getWaypoints(
  buildingId: string,
  floor?: string
): Promise<Waypoint[]> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined");
  }

  const params = new URLSearchParams({
    buildingId,
  });

  if (floor) params.append("floor", floor);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/directions/indoor/waypoints?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const waypoints = await response.json();
    return Array.isArray(waypoints) ? waypoints : [];
  } catch (error: any) {
    console.error("Failed to fetch waypoints from backend:", error);
    return [];
  }
}
