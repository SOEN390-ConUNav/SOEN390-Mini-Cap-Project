import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import HomePageIndex from "../app/(home-page)/index";
import { NAVIGATION_STATE } from "../const";
import { getAllOutdoorDirectionsInfo, searchLocations } from "../api";
import { buildEventIndoorTarget } from "../utils/eventIndoorNavigation";
import { findBuildingFromLocationText } from "../utils/eventLocationBuildingMatcher";

let mockEventPayload = {
  locationText: "45.50000,-73.57000",
  detailsText: "Classroom: H-937",
};

const mockPush = jest.fn();
const mockSetOptions = jest.fn();
const mockParentSetOptions = jest.fn();

let mockNavStateStore: any;
let mockEndpointsStore: any;
let mockNavConfigStore: any;
let mockNavInfoStore: any;
let mockLocationStore: any;
let mockLocationService: any;
let mockNavigationProgressStore: any;
const mockNavigationInfoBottom = jest.fn(() => null);
const mockNavigationDirectionHudBottom = jest.fn(() => null);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useNavigation: () => ({
    setOptions: mockSetOptions,
    getParent: () => ({ setOptions: mockParentSetOptions }),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock("@mapbox/polyline", () => ({
  decode: jest.fn(() => [
    [45.5, -73.57],
    [45.5001, -73.5701],
  ]),
}));

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MapView = React.forwardRef(({ children, ...props }: any, _ref: any) => (
    <View {...props}>{children}</View>
  ));
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
  () => (props: any) => mockNavigationInfoBottom(props),
);
jest.mock(
  "../components/navigation-direction/NavigationDirectionHUDBottom",
  () => (props: any) => mockNavigationDirectionHudBottom(props),
);
jest.mock(
  "../components/navigation-cancel/NavigationCancelBottom",
  () => () => null,
);
jest.mock("../components/LocationPromptModal", () => () => null);

jest.mock("../components/UpcomingEventButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return ({ onRequestDirections }: any) => (
    <Pressable
      testID="event-directions-btn"
      onPress={() => onRequestDirections?.(mockEventPayload)}
    >
      <Text>Event Directions</Text>
    </Pressable>
  );
});

jest.mock("../hooks/useNavigationState", () => ({
  __esModule: true,
  default: () => mockNavStateStore,
}));

jest.mock("../hooks/useNavigationEndpoints", () => ({
  __esModule: true,
  default: () => mockEndpointsStore,
}));

jest.mock("../hooks/useNavigationConfig", () => ({
  __esModule: true,
  default: (selector: any) => selector(mockNavConfigStore),
}));

jest.mock("../hooks/useNavigationInfo", () => ({
  __esModule: true,
  default: (selector: any) => selector(mockNavInfoStore),
}));

jest.mock("../hooks/useLocationStore", () => ({
  __esModule: true,
  default: (selector: any) => selector(mockLocationStore),
}));

jest.mock("../hooks/useLocationService", () => ({
  __esModule: true,
  default: () => mockLocationService,
}));

jest.mock("../hooks/useRerouting", () => ({
  __esModule: true,
  default: () => ({ isRerouting: false }),
}));

jest.mock("../hooks/useNavigationProgress", () => ({
  __esModule: true,
  default: (selector: any) => selector(mockNavigationProgressStore),
}));

jest.mock("../utils/buildingIndoorMaps", () => ({
  hasIndoorMaps: jest.fn(() => true),
  getDefaultFloor: jest.fn(() => "1"),
}));

jest.mock("../api", () => ({
  getAllOutdoorDirectionsInfo: jest.fn(),
  searchLocations: jest.fn(),
}));

jest.mock("../services/handleGeocode", () => ({
  reverseGeocode: jest.fn(async () => "Current Location"),
}));

jest.mock("../utils/eventLocationBuildingMatcher", () => ({
  findBuildingFromLocationText: jest.fn(),
}));

jest.mock("../utils/eventIndoorNavigation", () => ({
  buildEventIndoorTarget: jest.fn(),
}));

jest.mock("../data/buildings", () => ({
  BUILDINGS: [
    {
      id: "H",
      name: "Hall Building",
      marker: { latitude: 45.5, longitude: -73.57 },
      polygon: [],
      addressLines: ["1455 De Maisonneuve Blvd W"],
      openingHours: { label: "Open" },
      hasStudySpots: false,
      image: null,
      accessibility: {
        isAccessible: true,
        hasElevator: true,
        hasParking: false,
      },
    },
  ],
}));

const resetStores = () => {
  mockNavStateStore = {
    setNavigationState: jest.fn(),
    isNavigating: false,
    isConfiguring: false,
    isSearching: false,
    isIdle: true,
    isCancellingNavigation: false,
  };

  mockEndpointsStore = {
    origin: null,
    destination: {
      latitude: 45.5,
      longitude: -73.57,
      label: "Selected Location",
    },
    setOrigin: jest.fn((endpoint) => {
      mockEndpointsStore.origin = endpoint;
    }),
    setDestination: jest.fn((endpoint) => {
      mockEndpointsStore.destination = endpoint;
    }),
    swap: jest.fn(),
    clear: jest.fn(),
  };

  mockNavConfigStore = {
    allOutdoorRoutes: [],
    setAllOutdoorRoutes: jest.fn((routes) => {
      mockNavConfigStore.allOutdoorRoutes = routes;
    }),
    navigationMode: "WALK",
  };

  mockNavInfoStore = {
    pathDistance: "5 m",
    setIsLoading: jest.fn(),
    setPathDistance: jest.fn(),
    setPathDuration: jest.fn(),
  };

  mockLocationStore = {
    isInitialized: true,
    permissionStatus: "granted",
    canAskAgain: false,
    hasSeenPermissionScreen: true,
    userSkippedPermission: false,
    currentLocation: { latitude: 45.5, longitude: -73.57 },
    nearestBuilding: null,
    nearestBuildingDistance: null,
  };

  mockLocationService = {
    requestPermission: jest.fn(),
    markPermissionScreenSeen: jest.fn(),
    markUserSkipped: jest.fn(),
    openSettings: jest.fn(),
    getCurrentPosition: jest.fn(async () => ({
      latitude: 45.49,
      longitude: -73.58,
    })),
    checkPermission: jest.fn(),
  };

  mockNavigationProgressStore = {
    currentStepIndex: 0,
    resetProgress: jest.fn(),
  };
};

describe("HomePageIndex event handoff coverage", () => {
  beforeAll(() => {
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetStores();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([
      {
        transportMode: "WALKING",
        distance: "120 m",
        duration: "2 mins",
        steps: [],
      },
    ]);
    (searchLocations as jest.Mock).mockResolvedValue([]);
    (findBuildingFromLocationText as jest.Mock).mockReturnValue(null);
    (buildEventIndoorTarget as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("starts routing from event directions when location is lat,lng", async () => {
    mockEventPayload = {
      locationText: "45.50000,-73.57000",
      detailsText: "Classroom: H-937",
    };
    (buildEventIndoorTarget as jest.Mock).mockResolvedValue({
      buildingId: "H",
      floor: "9",
      startFloor: "9",
      floorSupported: true,
      destinationRoom: "H9-937",
      startRoom: "Hall-Elevator-Main",
    });

    const screen = render(<HomePageIndex />);
    fireEvent.press(screen.getByTestId("event-directions-btn"));

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(1);
    });
    expect(mockNavStateStore.setNavigationState).toHaveBeenCalledWith(
      NAVIGATION_STATE.ROUTE_CONFIGURING,
    );
    expect(searchLocations).not.toHaveBeenCalled();
  });

  it("alerts when search fallback cannot resolve event coordinates", async () => {
    mockEventPayload = {
      locationText: "Unknown Event Place",
      detailsText: "Classroom: H-937",
    };
    (findBuildingFromLocationText as jest.Mock).mockReturnValue(null);
    (searchLocations as jest.Mock).mockResolvedValue([{ name: "No coords" }]);

    const screen = render(<HomePageIndex />);
    fireEvent.press(screen.getByTestId("event-directions-btn"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Directions error",
        "Could not find route coordinates for this event location.",
      );
    });
  });

  it("routes directly to local building match without geosearch fallback", async () => {
    mockEventPayload = {
      locationText: "Hall Building",
      detailsText: "Classroom: H-937",
    };
    (buildEventIndoorTarget as jest.Mock).mockResolvedValue({
      buildingId: "H",
      floor: "9",
      startFloor: "9",
      floorSupported: true,
      destinationRoom: "H9-937",
      startRoom: "Hall-Elevator-Main",
    });
    (findBuildingFromLocationText as jest.Mock).mockImplementation(
      (value: string) => {
        if (value === "Hall Building") {
          return {
            id: "H",
            name: "Hall Building",
            marker: { latitude: 45.5, longitude: -73.57 },
          };
        }
        return null;
      },
    );

    const screen = render(<HomePageIndex />);
    fireEvent.press(screen.getByTestId("event-directions-btn"));

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(1);
    });
    expect(searchLocations).not.toHaveBeenCalled();
  });

  it("shows continue inside near the outdoor destination and opens indoor navigation when pressed", async () => {
    mockEventPayload = {
      locationText: "45.50000,-73.57000",
      detailsText: "Classroom: H-937",
    };
    (buildEventIndoorTarget as jest.Mock).mockResolvedValue({
      buildingId: "H",
      floor: "9",
      startFloor: "1",
      floorSupported: true,
      destinationRoom: "H9-937",
      startRoom: "Hall-Elevator-Main",
    });

    const screen = render(<HomePageIndex />);
    fireEvent.press(screen.getByTestId("event-directions-btn"));
    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(1);
    });

    mockNavStateStore.isNavigating = true;
    mockNavStateStore.isIdle = false;
    screen.rerender(<HomePageIndex />);

    await waitFor(() => {
      expect(screen.getByText("Continue Inside")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("outdoor-arrival-action"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/indoor-navigation",
        params: {
          buildingId: "H",
          floor: "1",
          forceBuildingId: "1",
          startRoom: "Hall-Elevator-Main",
          endRoom: "H9-937",
          returnOutdoorOriginLat: "45.5",
          returnOutdoorOriginLng: "-73.58",
          returnOutdoorOriginLat: "45.49",
          returnOutdoorOriginLabel: "Current Location",
          returnOutdoorDestinationLat: "45.5",
          returnOutdoorDestinationLng: "-73.57",
          returnOutdoorDestinationLabel: "Selected Location",
          returnOutdoorMode: "WALK",
        },
      });
    });
  });

  it("shows continue inside near the outdoor destination and alerts when indoor floor is unavailable", async () => {
    mockEventPayload = {
      locationText: "45.50000,-73.57000",
      detailsText: "Classroom: H-937",
    };
    (buildEventIndoorTarget as jest.Mock).mockResolvedValue({
      buildingId: "H",
      floor: null,
      startFloor: null,
      floorSupported: false,
      destinationRoom: "H9-937",
      startRoom: "Hall-Elevator-Main",
    });

    const screen = render(<HomePageIndex />);
    fireEvent.press(screen.getByTestId("event-directions-btn"));
    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(1);
    });

    mockNavStateStore.isNavigating = true;
    mockNavStateStore.isIdle = false;
    screen.rerender(<HomePageIndex />);

    await waitFor(() => {
      expect(screen.getByText("Continue Inside")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("outdoor-arrival-action"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Indoor directions unavailable",
        "Floor for your next class is not supported.",
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows i have arrived near the outdoor destination when there is no indoor handoff target", async () => {
    mockNavStateStore.isNavigating = true;
    mockNavStateStore.isIdle = false;

    const screen = render(<HomePageIndex />);

    await waitFor(() => {
      expect(screen.getByText("I Have Arrived")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("outdoor-arrival-action"));

    expect(mockNavStateStore.setNavigationState).toHaveBeenCalledWith(
      NAVIGATION_STATE.IDLE,
    );
    expect(mockEndpointsStore.clear).toHaveBeenCalled();
    mockNavStateStore.isNavigating = false;
    mockNavStateStore.isIdle = true;
    screen.rerender(<HomePageIndex />);
    await waitFor(() => {
      expect(mockNavigationInfoBottom).toHaveBeenLastCalledWith(
        expect.objectContaining({ visible: false }),
      );
    });
  });

  it("restores the navigation UI when navigation resumes externally after being dismissed", async () => {
    mockNavStateStore.isNavigating = true;
    mockNavStateStore.isIdle = false;

    const screen = render(<HomePageIndex />);

    await waitFor(() => {
      expect(screen.getByText("I Have Arrived")).toBeTruthy();
      expect(mockNavigationInfoBottom).toHaveBeenLastCalledWith(
        expect.objectContaining({ visible: true }),
      );
    });

    fireEvent.press(screen.getByTestId("outdoor-arrival-action"));

    mockNavStateStore.isNavigating = false;
    mockNavStateStore.isIdle = true;
    screen.rerender(<HomePageIndex />);

    await waitFor(() => {
      expect(mockNavigationInfoBottom).toHaveBeenLastCalledWith(
        expect.objectContaining({ visible: false }),
      );
    });

    mockNavStateStore.isNavigating = true;
    mockNavStateStore.isIdle = false;
    screen.rerender(<HomePageIndex />);

    await waitFor(() => {
      expect(mockNavigationInfoBottom).toHaveBeenLastCalledWith(
        expect.objectContaining({ visible: true }),
      );
    });
  });

  it("provides a fallback HUD step when resumed outdoor navigation has no steps", async () => {
    mockNavStateStore.isNavigating = true;
    mockNavStateStore.isIdle = false;
    mockEndpointsStore.destination = {
      latitude: 45.5,
      longitude: -73.57,
      label: "Hall Building",
      buildingId: "H",
    };
    mockNavConfigStore.allOutdoorRoutes = [
      {
        transportMode: "walking",
        distance: "182 m",
        duration: "3 mins",
        polyline: "abc",
        steps: [],
      },
    ];
    mockNavInfoStore.pathDistance = "182 m";

    render(<HomePageIndex />);

    await waitFor(() => {
      expect(mockNavigationDirectionHudBottom).toHaveBeenLastCalledWith(
        expect.objectContaining({
          visible: true,
          steps: [
            expect.objectContaining({
              instruction: "Continue to Hall Building",
              distance: "182 m",
              polyline: "abc",
            }),
          ],
        }),
      );
    });
  });
});
