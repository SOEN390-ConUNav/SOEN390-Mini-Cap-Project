import { act, renderHook } from "@testing-library/react-native";
import * as Location from "expo-location";
import useLocationWatcher from "../hooks/useLocationWatcher";
import useLocationStore from "../hooks/useLocationStore";

jest.mock("expo-location", () => ({
  Accuracy: {
    High: 3,
  },
  watchPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

describe("useLocationWatcher", () => {
  const getNearbyBuildingUpdates = jest.fn(() => ({}));

  beforeEach(() => {
    jest.clearAllMocks();
    useLocationStore.setState({
      permissionStatus: "granted",
      currentLocation: null,
      currentSpeed: 0,
      currentHeading: null,
      movementMode: "idle",
      isWatchingLocation: false,
      nearestBuilding: null,
      nearestBuildingDistance: null,
    });
  });

  it("does not start watching when permission is not granted", async () => {
    const { result } = renderHook(() =>
      useLocationWatcher({
        permissionStatus: "denied",
        movementMode: "idle",
        isNavigating: false,
        getNearbyBuildingUpdates,
      }),
    );

    await act(async () => {
      await result.current.startWatching();
    });

    expect(Location.watchPositionAsync).not.toHaveBeenCalled();
  });

  it("starts watcher, reuses same config, and stops watcher", async () => {
    const sub = { remove: jest.fn() };
    (Location.watchPositionAsync as jest.Mock).mockResolvedValue(sub);

    const { result } = renderHook(() =>
      useLocationWatcher({
        permissionStatus: "granted",
        movementMode: "idle",
        isNavigating: false,
        getNearbyBuildingUpdates,
      }),
    );

    await act(async () => {
      await result.current.startWatching();
      await result.current.startWatching();
    });

    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(1);
    expect(useLocationStore.getState().isWatchingLocation).toBe(true);

    act(() => {
      result.current.stopWatching();
    });

    expect(sub.remove).toHaveBeenCalledTimes(1);
    expect(useLocationStore.getState().isWatchingLocation).toBe(false);
  });

  it("recreates subscription when watcher config changes", async () => {
    const sub1 = { remove: jest.fn() };
    const sub2 = { remove: jest.fn() };
    (Location.watchPositionAsync as jest.Mock)
      .mockResolvedValueOnce(sub1)
      .mockResolvedValueOnce(sub2);

    const { result, rerender } = renderHook(
      (props: { movementMode: "idle" | "walking" }) =>
        useLocationWatcher({
          permissionStatus: "granted",
          movementMode: props.movementMode,
          isNavigating: false,
          getNearbyBuildingUpdates,
        }),
      { initialProps: { movementMode: "idle" as const } },
    );

    await act(async () => {
      await result.current.startWatching();
    });

    rerender({ movementMode: "walking" });

    await act(async () => {
      await result.current.startWatching();
    });

    expect(sub1.remove).toHaveBeenCalledTimes(1);
    expect(Location.watchPositionAsync).toHaveBeenCalledTimes(2);
  });

  it("updates store from callback and applies stable movement mode after threshold", async () => {
    const sub = { remove: jest.fn() };
    let callback: ((location: any) => void) | undefined;
    (Location.watchPositionAsync as jest.Mock).mockImplementation(
      async (_cfg: any, cb: (location: any) => void) => {
        callback = cb;
        return sub;
      },
    );

    const nearbyUpdate = {
      nearestBuildingDistance: 10,
      nearestBuilding: { id: "H" },
    } as any;
    const nearbyGetter = jest.fn(() => nearbyUpdate);

    const { result } = renderHook(() =>
      useLocationWatcher({
        permissionStatus: "granted",
        movementMode: "idle",
        isNavigating: false,
        getNearbyBuildingUpdates: nearbyGetter,
      }),
    );

    await act(async () => {
      await result.current.startWatching();
    });

    const emit = (latitude: number, longitude: number, speed = 1) =>
      callback?.({
        coords: {
          latitude,
          longitude,
          speed,
          heading: 45,
        },
      });

    act(() => {
      emit(45.497, -73.579, 1);
      emit(45.4971, -73.5791, 1);
      emit(45.4972, -73.5792, 1);
    });

    const state = useLocationStore.getState();
    expect(state.currentLocation).toEqual({
      latitude: 45.4972,
      longitude: -73.5792,
    });
    expect(state.currentSpeed).toBe(1);
    expect(state.currentHeading).toBe(45);
    expect(state.movementMode).toBe("walking");
    expect(nearbyGetter).toHaveBeenCalled();
  });

  it("logs and continues when watch start fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (Location.watchPositionAsync as jest.Mock).mockRejectedValue(
      new Error("watch failed"),
    );

    const { result } = renderHook(() =>
      useLocationWatcher({
        permissionStatus: "granted",
        movementMode: "idle",
        isNavigating: false,
        getNearbyBuildingUpdates,
      }),
    );

    await act(async () => {
      await result.current.startWatching();
    });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("getCurrentPosition throws when denied and returns coords when granted", async () => {
    const denied = renderHook(() =>
      useLocationWatcher({
        permissionStatus: "denied",
        movementMode: "idle",
        isNavigating: false,
        getNearbyBuildingUpdates,
      }),
    );

    await expect(denied.result.current.getCurrentPosition()).rejects.toThrow(
      "Location permission not granted",
    );

    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 45.5, longitude: -73.6, speed: 0, heading: 0 },
    });

    const granted = renderHook(() =>
      useLocationWatcher({
        permissionStatus: "granted",
        movementMode: "idle",
        isNavigating: false,
        getNearbyBuildingUpdates,
      }),
    );

    let coords: { latitude: number; longitude: number } | null = null;
    await act(async () => {
      coords = await granted.result.current.getCurrentPosition();
    });

    expect(coords).toEqual({ latitude: 45.5, longitude: -73.6 });
  });
});
