import { hasIndoorMaps, getAvailableFloors, getBackendBuildingId, getDefaultFloor } from '../utils/buildingIndoorMaps';
import { BuildingId } from '../data/buildings';



describe('hasIndoorMaps', () => {
  it('returns true for buildings with floor plans (H)', () => {
    expect(hasIndoorMaps('H' as BuildingId)).toBe(true);
  });

  it('returns true for VL', () => {
    expect(hasIndoorMaps('VL' as BuildingId)).toBe(true);
  });

  it('returns true for LB', () => {
    expect(hasIndoorMaps('LB' as BuildingId)).toBe(true);
  });

  it('returns false for a building without floor plans', () => {
    expect(hasIndoorMaps('FAKE' as BuildingId)).toBe(false);
  });
});



describe('getAvailableFloors', () => {
  it('returns sorted floors for H', () => {
    const floors = getAvailableFloors('H' as BuildingId);
    expect(floors.length).toBeGreaterThan(0);
    // Verify sorted
    const sorted = [...floors].sort((a, b) => a.localeCompare(b));
    expect(floors).toEqual(sorted);
  });

  it('returns empty for non-existent building', () => {
    expect(getAvailableFloors('ZZZ' as BuildingId)).toEqual([]);
  });
});



describe('getBackendBuildingId', () => {
  it('returns Hall-8 for H with default floor', () => {
    expect(getBackendBuildingId('H' as BuildingId)).toBe('Hall-8');
  });

  it('returns Hall-9 when floor 9 is specified', () => {
    expect(getBackendBuildingId('H' as BuildingId, '9')).toBe('Hall-9');
  });

  it('returns VL-1 for VL default', () => {
    expect(getBackendBuildingId('VL' as BuildingId)).toBe('VL-1');
  });

  it('returns LB-2 for LB default', () => {
    expect(getBackendBuildingId('LB' as BuildingId)).toBe('LB-2');
  });

  it('returns MB-S2 for MB default', () => {
    expect(getBackendBuildingId('MB' as BuildingId)).toBe('MB-S2');
  });

  it('returns CC-1 for CC default', () => {
    expect(getBackendBuildingId('CC' as BuildingId)).toBe('CC-1');
  });

  it('returns Building-X for unknown building', () => {
    expect(getBackendBuildingId('XX' as BuildingId)).toBe('Building-XX');
  });
});



describe('getDefaultFloor', () => {
  it('returns first available floor for H', () => {
    const floor = getDefaultFloor('H' as BuildingId);
    expect(typeof floor).toBe('string');
    expect(floor.length).toBeGreaterThan(0);
  });

  it('falls back to 1 for unknown building with no floor plans', () => {
    expect(getDefaultFloor('UNKNOWN' as BuildingId)).toBe('1');
  });
});
