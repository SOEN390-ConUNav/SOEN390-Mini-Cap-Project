export interface RoutePoint {
  x: number;
  y: number;
  label?: string;
}

export interface IndoorDirectionResponse {
  distance: string;
  duration: string;
  buildingName: string;
  buildingId: string;
  startFloor: string;
  endFloor: string;
  steps: any[];
  polyline: string;
  routePoints: RoutePoint[];
  stairMessage?: string | null;
}
