import {NAVIGATION_STATE} from "./const";

export type NavigationState = typeof NAVIGATION_STATE[keyof typeof NAVIGATION_STATE];
export type TransportMode = "WALK" | "BIKE" | "BUS" | "SHUTTLE" | "CAR";
export type Coordinate = {latitude: number, longitude: number};
export type NamedCoordinate = Coordinate & { name?: string }; // includes name for destination marker

export type TransportModeApi = "walking" | "driving" | "bicycling" | "transit" | "shuttle";

export type ManeuverTypeApi =
  | "TURN_SLIGHT_LEFT" | "TURN_SHARP_LEFT" | "TURN_LEFT"
  | "TURN_SLIGHT_RIGHT" | "TURN_SHARP_RIGHT" | "TURN_RIGHT"
  | "KEEP_RIGHT" | "KEEP_LEFT"
  | "UTURN_LEFT" | "UTURN_RIGHT"
  | "STRAIGHT" | "RAMP_LEFT" | "RAMP_RIGHT"
  | "MERGE" | "FORK_LEFT" | "FORK_RIGHT"
  | "FERRY" | "FERRY_TRAIN"
  | "ROUNDABOUT_LEFT" | "ROUNDABOUT_RIGHT";

export const TRANSPORT_MODE_API_MAP: Record<TransportMode, TransportModeApi> = {
  WALK: 'walking',
  BIKE: 'bicycling',
  BUS: 'transit',
  SHUTTLE: 'shuttle',
  CAR: 'driving',
};