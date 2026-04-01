import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import HomePageIndex from "../app/(home-page)/index";

const mockAnimateCamera = jest.fn();

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MapView = React.forwardRef(
    ({ children, onMapReady, ...props }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        animateCamera: mockAnimateCamera,
      }));
      React.useEffect(() => {
        if (onMapReady) onMapReady();
      }, [onMapReady]);
      return <View {...props}>{children}</View>;
    },
  );
  const Marker = ({ children, ...props }: any) => (
    <View {...props}>{children}</View>
  );
  const Polygon = ({ children, ...props }: any) => (
    <View {...props}>{children}</View>
  );
  return {
    __esModule: true,
    default: MapView,
    Marker,
    Polygon,
    PROVIDER_GOOGLE: "google",
  };
});

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useNavigation: () => ({
    setOptions: jest.fn(),
    getParent: () => ({ setOptions: jest.fn() }),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("@mapbox/polyline", () => ({
  decode: jest.fn(() => []),
}));

jest.mock("../components/search-bar/SearchBar", () => () => null);
jest.mock("../components/SearchPanel", () => () => null);
jest.mock("../components/FloatingActionButton", () => () => null);
jest.mock("../components/CampusSwitcher", () => () => null);
jest.mock("../components/BuildingMarker", () => () => null);
jest.mock("../components/BuildingPopup", () => () => null);
jest.mock("../components/EventDetailsPopup", () => () => null);
jest.mock(
  "../components/navigation-config/NavigationConfigView",
  () => () => null,
);
jest.mock("../components/DirectionPath", () => () => null);
jest.mock(
  "../components/navigation-info/NavigationInfoBottom",
  () => () => null,
);
jest.mock(
  "../components/navigation-direction/NavigationDirectionHUDBottom",
  () => () => null,
);
jest.mock(
  "../components/navigation-cancel/NavigationCancelBottom",
  () => () => null,
);
jest.mock("../components/LocationPromptModal", () => () => null);
jest.mock("../components/UpcomingEventButton", () => () => null);

let mockNavState = { isNavigating: false };
jest.mock("../hooks/useNavigationState", () => () => ({
  ...mockNavState,
  isConfiguring: false,
  isSearching: false,
  isIdle: !mockNavState.isNavigating,
  isCancellingNavigation: false,
  setNavigationState: jest.fn(),
}));

jest.mock("../hooks/useNavigationEndpoints", () => () => ({
  origin: null,
  destination: null,
  setOrigin: jest.fn(),
  setDestination: jest.fn(),
  swap: jest.fn(),
  clear: jest.fn(),
}));

jest.mock(
  "../hooks/useNavigationConfig",
  () => (selector: any) =>
    selector({
      allOutdoorRoutes: [],
      setAllOutdoorRoutes: jest.fn(),
      navigationMode: "WALK",
    }),
);

jest.mock(
  "../hooks/useNavigationInfo",
  () => (selector: any) =>
    selector({
      pathDistance: "0 m",
      setIsLoading: jest.fn(),
      setPathDistance: jest.fn(),
      setPathDuration: jest.fn(),
    }),
);

let mockLocation = {
  currentLocation: null as any,
  currentHeading: null as any,
};
jest.mock(
  "../hooks/useLocationStore",
  () => (selector: any) =>
    selector({
      ...mockLocation,
      isInitialized: true,
      permissionStatus: "granted",
      canAskAgain: false,
      hasSeenPermissionScreen: true,
      userSkippedPermission: false,
      nearestBuilding: null,
      nearestBuildingDistance: null,
    }),
);

jest.mock("../hooks/useLocationService", () => () => ({
  requestPermission: jest.fn(),
  markPermissionScreenSeen: jest.fn(),
  markUserSkipped: jest.fn(),
  openSettings: jest.fn(),
  getCurrentPosition: jest.fn(),
  checkPermission: jest.fn(),
}));

jest.mock("../hooks/useRerouting", () => () => ({ isRerouting: false }));
jest.mock(
  "../hooks/useNavigationProgress",
  () => (selector: any) =>
    selector({
      currentStepIndex: 0,
      resetProgress: jest.fn(),
    }),
);

jest.mock("../hooks/useIndoorHandoffStore", () => {
  const mockData = {
    pendingIndoorTarget: null,
    setPendingIndoorTarget: jest.fn(),
    clearPendingIndoorTarget: jest.fn(),
  };
  return {
    useIndoorHandoffStore: jest.fn((selector) => selector(mockData)),
  };
});

jest.mock("../hooks/useGeneralSettings", () => {
  const mockHydrate = jest.fn().mockResolvedValue(null);
  const mockData = {
    defaultCampus: "SGW",
    hydrateFromStorage: mockHydrate,
  };
  const store: any = jest.fn(() => mockData);
  store.getState = jest.fn(() => mockData);
  return {
    useGeneralSettingsStore: store,
    useGeneralSettings: jest.fn(() => mockData),
  };
});

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({ colors: {}, isDark: false }),
}));

describe("HomePageIndex Map Centering Branches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavState.isNavigating = false;
    mockLocation.currentLocation = null;
    mockLocation.currentHeading = null;
  });

  it("calls animateCamera with currentHeading when available", async () => {
    mockNavState.isNavigating = true;
    mockLocation.currentLocation = { latitude: 45.5, longitude: -73.57 };
    mockLocation.currentHeading = 90;

    render(<HomePageIndex />);

    await waitFor(() => {
      expect(mockAnimateCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          center: { latitude: 45.5, longitude: -73.57 },
          heading: 90,
        }),
        expect.any(Object),
      );
    });
  });

  it("calls animateCamera with heading 0 when currentHeading is null (branch coverage)", async () => {
    mockNavState.isNavigating = true;
    mockLocation.currentLocation = { latitude: 45.5, longitude: -73.57 };
    mockLocation.currentHeading = null;

    render(<HomePageIndex />);

    await waitFor(() => {
      expect(mockAnimateCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          center: { latitude: 45.5, longitude: -73.57 },
          heading: 0,
        }),
        expect.any(Object),
      );
    });
  });
});
