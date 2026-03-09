export interface RoutePoint {
  x: number;
  y: number;
  label?: string;
}

/**
 * Mirrors backend enum: com.soen390.backend.enums.IndoorManeuverType
 * Spring serializes these as the enum name (uppercase).
 */
export type IndoorManeuverType =
  | "STRAIGHT"
  | "TURN_LEFT"
  | "TURN_RIGHT"
  | "TURN_AROUND"
  | "ELEVATOR_UP"
  | "ELEVATOR_DOWN"
  | "STAIRS_UP"
  | "STAIRS_DOWN"
  | "ESCALATOR_UP"
  | "ESCALATOR_DOWN"
  | "ENTER_ROOM"
  | "EXIT_ROOM"
  | "ENTER_BUILDING"
  | "EXIT_BUILDING"
  | "ENTER_FLOOR"
  | "EXIT_FLOOR";

export interface IndoorRouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuverType: IndoorManeuverType;
  floor?: string;
  roomNumber?: string | null;
  landmark?: string | null;
}

export interface IndoorDirectionResponse {
  distance: string;
  duration: string;
  buildingName: string;
  buildingId: string;
  startFloor: string;
  endFloor: string;
  steps: IndoorRouteStep[];
  polyline: string;
  routePoints: RoutePoint[];
  stairMessage?: string | null;
}
