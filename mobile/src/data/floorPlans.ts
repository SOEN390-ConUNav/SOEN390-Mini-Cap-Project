/**
 * Floor plan registry
 * Maps building+floor to minimal FloorPlan metadata.
 * Rooms, waypoints, and routes are all loaded from the backend.
 */

import { FloorPlan } from '../types/FloorPlan';

function plan(
  id: string,
  buildingId: string,
  floorNumber: string,
  name: string,
  width: number,
  height: number,
): FloorPlan {
  return {
    id,
    buildingId,
    floorNumber,
    name,
    width,
    height,
    rooms: [],
  hallways: [],
  waypoints: [],
  connections: [],
};
}

export const floorPlanRegistry: Record<string, FloorPlan> = {
  'H-9':  plan('Hall-9', 'H',  '9', 'Hall Building - Floor 9',            1000, 800),
  'H-8':  plan('Hall-8', 'H',  '8', 'Hall Building - Floor 8',             750, 650),
  'H-2':  plan('Hall-2', 'H',  '2', 'Hall Building - Floor 2',            1222, 1351),
  'VL-1': plan('VL-1',   'VL', '1', 'Vanier Library Building - Floor 1',  1024, 1024),
  'VL-2': plan('VL-2',   'VL', '2', 'Vanier Library Building - Floor 2',  1024, 1024),
  'LB-2': plan('LB-2',   'LB', '2', 'Webster Library Building - Floor 2', 1024, 1024),
  'LB-3': plan('LB-3',   'LB', '3', 'Webster Library Building - Floor 3', 1024, 1024),
  'LB-4': plan('LB-4',   'LB', '4', 'Webster Library Building - Floor 4', 1024, 1024),
  'LB-5': plan('LB-5',   'LB', '5', 'Webster Library Building - Floor 5', 1024, 1024),
  'MB-S2': plan('MB-S2',  'MB', 'S2', 'John Molson Building - Floor S2',     1024, 1024),
  'H-1': plan('Hall-1',  'H', '1', 'Hall Building - Floor 1',     1410, 1506),
  'CC-1': plan('CC-1',  'CC', '1', 'Central Building - Floor 1',     1024, 1024),
  'MB-1': plan('MB-1',  'MB', '1', 'John Molson Building - Floor 1',     1024, 1024),
  'VE-1': plan('VE-1',  'VE', '1', 'Vanier Extension - Floor 1',     1024, 1024),
  'VE-2': plan('VE-2',  'VE', '2', 'Vanier Extension - Floor 2',     1024, 1024),
};

export function getFloorPlan(buildingId: string, floorNumber: string): FloorPlan | null {
  return floorPlanRegistry[`${buildingId}-${floorNumber}`] || null;
}

export function getBuildingFloorPlans(buildingId: string): FloorPlan[] {
  return Object.values(floorPlanRegistry).filter(p => p.buildingId === buildingId);
}
