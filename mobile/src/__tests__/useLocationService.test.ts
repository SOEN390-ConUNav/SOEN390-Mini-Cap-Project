import { act, renderHook } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";
import useLocationService from "../hooks/useLocationService";
import useLocationStore from "../hooks/useLocationStore";

jest.mock("../hooks/useNavigationState", () => ({
  __esModule: true,
  default: () => ({ isNavigating: false }),
}));

jest.mock("expo-location", () => ({
  Accuracy: {
    Low: 1,
    Balanced: 2,
    High: 3,
    BestForNavigation: 4,
  },
  hasServicesEnabledAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

import * as Location from "expo-location";

describe("useLocationService", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "undetermined",
      canAskAgain: true,
    });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        status: "denied",
      },
    );
    useLocationStore.setState({
      isInitialized: false,
      permissionStatus: "undetermined",
      locationServicesEnabled: true,
      canAskAgain: true,
      hasSeenPermissionScreen: false,
      userSkippedPermission: false,
      currentLocation: null,
      currentSpeed: 0,
      currentHeading: null,
      movementMode: "idle",
      nearestBuilding: null,
      nearestBuildingDistance: null,
      isWatchingLocation: false,
      isAppInBackground: false,
      lastPermissionCheck: 0,
    });
  });

  it("returns denied when permission is denied and not previously granted", async () => {
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
      canAskAgain: false,
    });

    const { result } = renderHook(() => useLocationService());
    let status = "undetermined";

    await act(async () => {
      status = await result.current.checkPermission();
    });

    expect(status).toBe("denied");
    expect(useLocationStore.getState().permissionStatus).toBe("denied");
  });

  it("returns undetermined when permission check throws", async () => {
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.getForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error("permission api down"),
    );

    const { result } = renderHook(() => useLocationService());
    let status = "granted";

    await act(async () => {
      status = await result.current.checkPermission();
    });

    expect(status).toBe("undetermined");
    expect(useLocationStore.getState().permissionStatus).toBe("undetermined");
  });

  it("returns granted from checkPermission and updates store", async () => {
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
      canAskAgain: true,
    });

    const { result } = renderHook(() => useLocationService());
    let status = "undetermined";

    await act(async () => {
      status = await result.current.checkPermission();
    });

    expect(status).toBe("granted");
    expect(useLocationStore.getState().permissionStatus).toBe("granted");
  });

  it("returns revoked when denied after previously granted permission", async () => {
    (Location.hasServicesEnabledAsync as jest.Mock).mockResolvedValue(true);
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "denied",
      canAskAgain: false,
    });
    await AsyncStorage.setItem("@location_permission_previous", "granted");

    const { result } = renderHook(() => useLocationService());
    let status = "undetermined";

    await act(async () => {
      status = await result.current.checkPermission();
    });

    expect(status).toBe("revoked");
    expect(useLocationStore.getState().permissionStatus).toBe("revoked");
  });

  it("requestPermission returns false and stores denied state", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        status: "denied",
      },
    );

    const { result } = renderHook(() => useLocationService());
    let granted = true;

    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(false);
    await expect(AsyncStorage.getItem("@location_user_skipped")).resolves.toBe(
      "false",
    );
  });

  it("requestPermission returns true and stores granted state", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      {
        status: "granted",
      },
    );

    const { result } = renderHook(() => useLocationService());
    let granted = false;

    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(true);
    await expect(
      AsyncStorage.getItem("@location_permission_previous"),
    ).resolves.toBe("granted");
  });

  it("requestPermission returns false on exception", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(
      new Error("request failed"),
    );

    const { result } = renderHook(() => useLocationService());
    let granted = true;

    await act(async () => {
      granted = await result.current.requestPermission();
    });

    expect(granted).toBe(false);
  });

  it("marks permission screen as seen", async () => {
    const { result } = renderHook(() => useLocationService());

    await act(async () => {
      await result.current.markPermissionScreenSeen();
    });

    await expect(
      AsyncStorage.getItem("@location_permission_screen_seen"),
    ).resolves.toBe("true");
  });

  it("marks user as skipped and sets seen", async () => {
    const { result } = renderHook(() => useLocationService());

    await act(async () => {
      await result.current.markUserSkipped();
    });

    expect(useLocationStore.getState().userSkippedPermission).toBe(true);
    expect(useLocationStore.getState().hasSeenPermissionScreen).toBe(true);
    await expect(AsyncStorage.getItem("@location_user_skipped")).resolves.toBe(
      "true",
    );
  });

  it("openSettings uses platform-specific API", async () => {
    const openSettingsSpy = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue();
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue();

    const { result } = renderHook(() => useLocationService());

    await act(async () => {
      await result.current.openSettings();
    });

    if (Platform.OS === "ios") {
      expect(openURLSpy).toHaveBeenCalledWith("app-settings:");
    } else {
      expect(openSettingsSpy).toHaveBeenCalledTimes(1);
    }

    openSettingsSpy.mockRestore();
    openURLSpy.mockRestore();
  });

  it("getCurrentPosition throws when permission is not granted", async () => {
    useLocationStore.setState({ permissionStatus: "denied" });
    const { result } = renderHook(() => useLocationService());

    await expect(result.current.getCurrentPosition()).rejects.toThrow(
      "Location permission not granted",
    );
  });

  it("getCurrentPosition returns coords when permission is granted", async () => {
    useLocationStore.setState({ permissionStatus: "granted" });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 45.497,
        longitude: -73.579,
        speed: 0,
        heading: 0,
      },
    });

    const { result } = renderHook(() => useLocationService());
    let coords: { latitude: number; longitude: number } | null = null;

    await act(async () => {
      coords = await result.current.getCurrentPosition();
    });

    expect(coords).toEqual({ latitude: 45.497, longitude: -73.579 });
    expect(useLocationStore.getState().currentLocation).toEqual({
      latitude: 45.497,
      longitude: -73.579,
    });
  });
});
