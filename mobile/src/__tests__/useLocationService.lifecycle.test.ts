import { act, renderHook } from "@testing-library/react-native";
import { AppState, Linking, Platform } from "react-native";
import useLocationStore from "../hooks/useLocationStore";
import useLocationService from "../hooks/useLocationService";

const mockPermission = {
  initialize: jest.fn(async () => {}),
  checkLocationServices: jest.fn(async () => true),
  checkPermission: jest.fn(async () => "granted"),
  requestPermission: jest.fn(async () => true),
  markPermissionScreenSeen: jest.fn(async () => {}),
  markUserSkipped: jest.fn(async () => {}),
};

const mockWatcher = {
  startWatching: jest.fn(async () => {}),
  stopWatching: jest.fn(() => {}),
  getCurrentPosition: jest.fn(async () => ({ latitude: 0, longitude: 0 })),
};

let mockIsNavigating = false;
let appStateHandler: ((state: any) => void | Promise<void>) | null = null;

jest.mock("../hooks/useNavigationState", () => ({
  __esModule: true,
  default: () => ({ isNavigating: mockIsNavigating }),
}));

jest.mock("../hooks/useLocationPermission", () => ({
  __esModule: true,
  default: () => mockPermission,
}));

jest.mock("../hooks/useLocationWatcher", () => ({
  __esModule: true,
  default: () => mockWatcher,
}));

jest.mock("../hooks/useNearbyBuildings", () => ({
  __esModule: true,
  default: () => ({ getNearbyBuildingUpdates: jest.fn(() => ({})) }),
}));

describe("useLocationService lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsNavigating = false;
    appStateHandler = null;
    Object.defineProperty(AppState, "currentState", {
      value: "active",
      configurable: true,
    });

    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type: any, handler: any) => {
        appStateHandler = handler;
        return { remove: jest.fn() } as any;
      });

    useLocationStore.setState({
      isInitialized: true,
      permissionStatus: "granted",
      hasSeenPermissionScreen: true,
      userSkippedPermission: false,
      movementMode: "idle",
      isAppInBackground: false,
    });
  });

  it("handles app background and foreground transitions", async () => {
    const { unmount } = renderHook(() => useLocationService());
    expect(appStateHandler).toBeTruthy();

    await act(async () => {
      await appStateHandler?.("background");
    });
    expect(useLocationStore.getState().isAppInBackground).toBe(true);
    expect(mockWatcher.stopWatching).toHaveBeenCalled();

    mockPermission.checkPermission.mockResolvedValueOnce("granted");
    await act(async () => {
      await appStateHandler?.("active");
    });
    expect(useLocationStore.getState().isAppInBackground).toBe(false);
    expect(mockWatcher.startWatching).toHaveBeenCalled();

    mockPermission.checkPermission.mockResolvedValueOnce("denied");
    await act(async () => {
      await appStateHandler?.("background");
      await appStateHandler?.("active");
    });
    expect(mockWatcher.stopWatching).toHaveBeenCalled();

    unmount();
  });

  it("does not stop watcher on background when navigating", async () => {
    mockIsNavigating = true;
    renderHook(() => useLocationService());

    await act(async () => {
      await appStateHandler?.("background");
    });

    expect(useLocationStore.getState().isAppInBackground).toBe(true);
    expect(mockWatcher.stopWatching).not.toHaveBeenCalled();
  });

  it("openSettings calls iOS deep-link path on iOS", async () => {
    const openURLSpy = jest
      .spyOn(Linking, "openURL")
      .mockResolvedValue(undefined);
    const openSettingsSpy = jest
      .spyOn(Linking, "openSettings")
      .mockResolvedValue();
    const originalOS = Platform.OS;
    (Platform as any).OS = "ios";

    const { result } = renderHook(() => useLocationService());
    await act(async () => {
      await result.current.openSettings();
    });

    expect(openURLSpy).toHaveBeenCalledWith("app-settings:");
    expect(openSettingsSpy).not.toHaveBeenCalled();

    (Platform as any).OS = originalOS;
    openURLSpy.mockRestore();
    openSettingsSpy.mockRestore();
  });
});
