import { BuildingId } from '../data/buildings';
import { getBuildingFloorPlans } from '../data/floorPlans';


export function hasIndoorMaps(buildingId: BuildingId): boolean {
  const floorPlans = getBuildingFloorPlans(buildingId);
  return floorPlans.length > 0;
}

export function getAvailableFloors(buildingId: BuildingId): string[] {
  const floorPlans = getBuildingFloorPlans(buildingId);
  return floorPlans.map(plan => plan.floorNumber).sort((a, b) => a.localeCompare(b));
}


export function getBackendBuildingId(buildingId: BuildingId, floorNumber?: string): string {
  if (buildingId === 'H') {
    const floor = floorNumber || '8';
    return `Hall-${floor}`;
  }
  if (buildingId === 'VE') {
    const floor = floorNumber || '1';
    return `VE-${floor}`;
  }

  if (buildingId === 'VL') {
    const floor = floorNumber || '1';
    return `VL-${floor}`;
  }
  if (buildingId === 'LB') {
    const floor = floorNumber || '2';
    return `LB-${floor}`; 
  }
  if (buildingId === 'MB') {
    const floor = floorNumber || 'S2';
    return `MB-${floor}`;
  }
  if (buildingId === 'CC') {
    const floor = floorNumber || '1';
    return `CC-${floor}`;
  }

  return `Building-${buildingId}`;
}


export function getDefaultFloor(buildingId: BuildingId): string {
  const floors = getAvailableFloors(buildingId);
  if (floors.length > 0) {
    return floors[0];
  }

  if (buildingId === 'LB') return '2';
  if (buildingId === 'VL') return '1';
  if (buildingId === 'H') return '1';
  if (buildingId === 'MB') return 'S2';
  if (buildingId === 'CC') return '1';
  return '1'; 
}
