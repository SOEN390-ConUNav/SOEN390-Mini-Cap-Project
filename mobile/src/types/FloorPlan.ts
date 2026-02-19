

export interface Point {
  x: number;
  y: number;
}

export interface Room {
  id: string;
  name: string; 
  type: 'classroom' | 'office' | 'lab' | 'bathroom' | 'elevator' | 'stairs' | 'hallway' | 'other';
  position: Point;
  width: number;
  height: number;
  rotation?: number; 
  label?: string; 
}

export interface Hallway {
  id: string;
  points: Point[]; 
  width: number;
}

export interface Waypoint {
  id: string;
  position: Point;
  type: 'room' | 'hallway' | 'elevator' | 'stairs' | 'entrance' | 'exit';
  connectedTo: string[]; 
  roomId?: string; 
}

export interface Connection {
  from: string; 
  to: string; 
  path?: Point[]; 
  type: 'hallway' | 'elevator' | 'stairs' | 'door';
}

export interface FloorPlan {
  id: string;
  buildingId: string;
  floorNumber: string; 
  name: string; 
  width: number; 
  height: number; 
  rooms: Room[];
  hallways: Hallway[];
  waypoints: Waypoint[];
  connections: Connection[];
  scale?: number; 
}

export interface Route {
  waypoints: Point[]; 
  color?: string;
  width?: number;
}
