import { useCallback } from "react";
import useLocationStore from "./useLocationStore";
import { findNearestBuilding, isOnCampus } from "../utils/locationUtils";
import { BUILDINGS } from "../data/buildings";

type LocationStoreState = ReturnType<typeof useLocationStore.getState>;

export type NearbyBuildingUpdatesGetter = (
  prev: LocationStoreState,
  coords: { latitude: number; longitude: number },
) => Record<string, unknown>;

export default function useNearbyBuildings() {
  const getNearbyBuildingUpdates: NearbyBuildingUpdatesGetter = useCallback(
    (prev, coords) => {
      const updates: Record<string, unknown> = {};
      const campusInfo = isOnCampus(coords);

      if (!campusInfo.onCampus) {
        if (prev.nearestBuilding !== null) {
          updates.nearestBuilding = null;
          updates.nearestBuildingDistance = null;
        }
        return updates;
      }

      const nearest = findNearestBuilding(coords, BUILDINGS);
      if (nearest && nearest.distance < 200) {
        const shouldUpdateNearest =
          prev.nearestBuilding?.id !== nearest.building.id ||
          prev.nearestBuildingDistance === null ||
          Math.abs(prev.nearestBuildingDistance - nearest.distance) > 1;

        if (shouldUpdateNearest) {
          updates.nearestBuilding = nearest.building;
          updates.nearestBuildingDistance = nearest.distance;
        }
        return updates;
      }

      if (prev.nearestBuilding !== null) {
        updates.nearestBuilding = null;
        updates.nearestBuildingDistance = null;
      }

      return updates;
    },
    [],
  );

  return { getNearbyBuildingUpdates };
}
