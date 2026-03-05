import useLocationStore from "../hooks/useLocationStore";
import { BUILDINGS } from "../data/buildings";

describe("useLocationStore", () => {
  beforeEach(() => {
    useLocationStore.setState({
      isInitialized: false,
      permissionStatus: "undetermined",
      currentLocation: null,
      nearestBuilding: null,
      nearestBuildingDistance: null,
      isWatchingLocation: false,
      isAppInBackground: false,
    });
  });

  it("updates permission and initialization flags", () => {
    const state = useLocationStore.getState();
    state.setPermissionStatus("granted");
    state.setIsInitialized(true);

    const updated = useLocationStore.getState();
    expect(updated.permissionStatus).toBe("granted");
    expect(updated.isInitialized).toBe(true);
  });

  it("updates location and nearest building info", () => {
    const state = useLocationStore.getState();
    state.setCurrentLocation({ latitude: 45.497, longitude: -73.579 });
    state.setNearestBuilding(BUILDINGS[0], 25);

    const updated = useLocationStore.getState();
    expect(updated.currentLocation).toEqual({
      latitude: 45.497,
      longitude: -73.579,
    });
    expect(updated.nearestBuilding?.id).toBe(BUILDINGS[0].id);
    expect(updated.nearestBuildingDistance).toBe(25);
  });

  it("updates watch/background flags", () => {
    const state = useLocationStore.getState();
    state.setIsWatchingLocation(true);
    state.setIsAppInBackground(true);

    const updated = useLocationStore.getState();
    expect(updated.isWatchingLocation).toBe(true);
    expect(updated.isAppInBackground).toBe(true);
  });
});
