import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Switch } from "react-native";
import IndoorNavigation from "../app/indoor-navigation";
import { getAllOutdoorDirectionsInfo } from "../api";
import { BUILDING_EXIT_ROOMS } from "../data/buildingExits";
import {
  getAvailableRooms,
  getIndoorDirections,
  getPointsOfInterest,
  getRoomPoints,
  getUniversalDirections,
} from "../api/indoorDirectionsApi";
import { useNavigationEndpointsStore } from "../hooks/useNavigationEndpoints";
import useNavigationConfig from "../hooks/useNavigationConfig";
import useNavigationInfo from "../hooks/useNavigationInfo";
import useNavigationProgress from "../hooks/useNavigationProgress";
import { useIndoorHandoffStore } from "../hooks/useIndoorHandoffStore";
import { useNavigationStore } from "../hooks/useNavigationState";

const mockSetParams = jest.fn();
const mockReplace = jest.fn();
const mockDrawRoute = jest.fn();
const mockClearRoute = jest.fn();

let mockParams: {
  buildingId?: string;
  floor?: string;
  startRoom?: string;
  endRoom?: string;
  forceBuildingId?: string;
  resumeOutdoorNavigation?: string;
  resumeOutdoorNavigationToken?: string;
  returnOutdoorOriginLat?: string;
  returnOutdoorOriginLng?: string;
  returnOutdoorOriginLabel?: string;
  returnOutdoorOriginBuildingId?: string;
  returnOutdoorDestinationLat?: string;
  returnOutdoorDestinationLng?: string;
  returnOutdoorDestinationLabel?: string;
  returnOutdoorDestinationBuildingId?: string;
  returnOutdoorMode?: string;
  globalOriginRoom?: string;
  globalOriginBuildingId?: string;
  globalDestinationRoom?: string;
  globalDestinationBuildingId?: string;
  navigationKey?: string;
} = {
  buildingId: "H",
  floor: "8",
};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    setParams: mockSetParams,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("../api/indoorDirectionsApi", () => ({
  getIndoorDirections: jest.fn(),
  getAvailableRooms: jest.fn(),
  getRoomPoints: jest.fn(),
  getPointsOfInterest: jest.fn(),
  getUniversalDirections: jest.fn(),
}));

jest.mock("../api", () => ({
  getAllOutdoorDirectionsInfo: jest.fn(),
}));

jest.mock("../components/FloorPlanWebView", () => {
  const ReactLocal = require("react");
  const { View, Text, Pressable } = require("react-native");

  const MockFloorPlan = ReactLocal.forwardRef((props: any, ref: any) => {
    ReactLocal.useImperativeHandle(ref, () => ({
      drawRoute: mockDrawRoute,
      clearRoute: mockClearRoute,
    }));

    return (
      <View testID="floor-plan-webview">
        <Text testID="floor-plan-building">{props.buildingId}</Text>
        <Text testID="floor-plan-floor">{props.floorNumber}</Text>
        <Text testID="route-point-count">
          {String(props.routePoints?.length ?? 0)}
        </Text>
        <Pressable
          testID="sim-poi-tap"
          onPress={() => props.onPoiTap && props.onPoiTap({ id: "VL-101" })}
        />
        <Pressable
          testID="sim-room-tap"
          onPress={() => props.onRoomTap && props.onRoomTap({ id: "H-843" })}
        />
      </View>
    );
  });

  return {
    __esModule: true,
    default: MockFloorPlan,
  };
});

jest.mock("../components/IndoorSearchBar", () => {
  const { View, Text, Pressable } = require("react-native");
  return (props: any) => (
    <View>
      <Text testID="building-name">{props.buildingName}</Text>
      <Text testID="start-room-value">{props.startRoom}</Text>
      <Text testID="end-room-value">{props.endRoom}</Text>
      <Pressable testID="open-start" onPress={props.onStartPress}>
        <Text>Open Start</Text>
      </Pressable>
      <Pressable testID="open-end" onPress={props.onEndPress}>
        <Text>Open End</Text>
      </Pressable>
      <Pressable testID="swap-locations" onPress={props.onSwap}>
        <Text>Swap</Text>
      </Pressable>
      <Pressable testID="clear-start" onPress={props.onClearStart}>
        <Text>Clear Start</Text>
      </Pressable>
      <Pressable testID="clear-end" onPress={props.onClearEnd}>
        <Text>Clear End</Text>
      </Pressable>
    </View>
  );
});

jest.mock("../components/RoomListModal", () => {
  const { View, Text, Pressable } = require("react-native");
  return (props: any) => {
    if (!props.visible) return null;

    return (
      <View>
        <Text testID="selecting-for">{props.selectingFor}</Text>
        <Pressable
          testID="pick-room-first"
          onPress={() => props.onSelectRoom(props.filteredRooms[0] || "H-801")}
        >
          <Text>Pick First Room</Text>
        </Pressable>
        <Pressable
          testID="pick-room-second"
          onPress={() => props.onSelectRoom(props.filteredRooms[1] || "H-820")}
        >
          <Text>Pick Second Room</Text>
        </Pressable>
        {/* NEW BUTTON FOR CROSS-CAMPUS COVERAGE */}
        <Pressable
          testID="pick-room-universal"
          onPress={() => props.onSelectRoom("VL-101")}
        >
          <Text>Pick VL Room</Text>
        </Pressable>
        <Pressable
          testID="pick-room-unknown"
          onPress={() => props.onSelectRoom("UNKNOWN")}
        >
          <Text>Pick Unknown Room</Text>
        </Pressable>
        <Pressable testID="close-room-modal" onPress={props.onClose}>
          <Text>Close Room Modal</Text>
        </Pressable>
      </View>
    );
  };
});

jest.mock("../components/FloorSelector", () => {
  const { Pressable, Text } = require("react-native");
  return (props: any) => (
    <Pressable testID="change-floor" onPress={() => props.onFloorSelect("9")}>
      <Text>Change Floor</Text>
    </Pressable>
  );
});

jest.mock("../components/BottomPanel", () => {
  const { View, Text, Pressable } = require("react-native");
  return (props: any) => (
    <View>
      <Text testID="bottom-start">{props.startRoom}</Text>
      <Text testID="bottom-end">{props.endRoom}</Text>
      <Pressable testID="toggle-directions" onPress={props.onToggleDirections}>
        <Text>Toggle Directions</Text>
      </Pressable>
    </View>
  );
});

jest.mock("../components/DirectionsPanel", () => {
  const { Text, Pressable, View } = require("react-native");
  return (props: any) => {
    if (!props.visible) return null;
    return (
      <View>
        <Text testID="directions-panel">
          Steps: {props.routeData?.steps?.length ?? 0}
        </Text>
        <Pressable
          testID="collapse-directions"
          onPress={() => props.onSnapIndexChange?.(0)}
        >
          <Text>Collapse Directions</Text>
        </Pressable>
        <Pressable
          testID="expand-directions"
          onPress={() => props.onSnapIndexChange?.(1)}
        >
          <Text>Expand Directions</Text>
        </Pressable>
        <Pressable testID="close-directions" onPress={props.onClose}>
          <Text>Close Directions</Text>
        </Pressable>
      </View>
    );
  };
});

const buildCrossFloorRoute = (overrides: Record<string, unknown> = {}) => ({
  distance: "50 m",
  duration: "3 min",
  buildingName: "Hall Building",
  buildingId: "Hall-8",
  startFloor: "8",
  endFloor: "9",
  steps: [
    {
      instruction: "Walk to the elevator",
      distance: "10 m",
      duration: "1 min",
      floor: "8",
      maneuverType: "STRAIGHT",
    },
    {
      instruction: "Take elevator to floor 9",
      distance: "0 m",
      duration: "1 min",
      floor: "8",
      maneuverType: "ELEVATOR_UP",
    },
    {
      instruction: "Continue to H9-903",
      distance: "15 m",
      duration: "1 min",
      floor: "9",
      maneuverType: "STRAIGHT",
    },
    {
      instruction: "Arrive at H9-903",
      distance: "0 m",
      duration: "0 sec",
      floor: "9",
      maneuverType: "ENTER_ROOM",
    },
  ],
  polyline: "",
  routePoints: [
    { x: 10, y: 20, label: "H8-801" },
    { x: 15, y: 25, label: "H8-Main-Elevator" },
    { x: 15, y: 25, label: "TRANSITION_ELEVATOR_TO_9" },
    { x: 20, y: 30, label: "H9-Main-Elevator" },
    { x: 20, y: 30, label: "H9-903" },
  ],
  stairMessage: null,
  ...overrides,
});

const buildUniversalContinuationResponse = (
  outdoorRouteOverrides: Record<string, unknown> = {},
) => ({
  startIndoorRoute: {
    startFloor: "8",
    endFloor: "8",
    steps: [
      {
        instruction: "Head to the building exit",
        distance: "10 m",
        duration: "1 min",
        floor: "8",
        maneuverType: "STRAIGHT",
      },
    ],
    routePoints: [{ x: 1, y: 1, label: "H8-801" }],
  },
  outdoorRoute: {
    distance: "500 m",
    duration: "7 min",
    polyline: "abc",
    transportMode: "walking",
    steps: [],
    ...outdoorRouteOverrides,
  },
  endIndoorRoute: {
    startFloor: "1",
    endFloor: "1",
    buildingName: "Vanier Library Building",
    steps: [
      {
        instruction: "Proceed to VL-101",
        distance: "10 m",
        duration: "1 min",
        floor: "1",
        maneuverType: "STRAIGHT",
      },
    ],
    routePoints: [
      { x: 2, y: 2, label: "VL-Entrance-Exit" },
      { x: 4, y: 4, label: "VL-101" },
    ],
  },
  nextShuttleTime: null,
  totalDuration: "12 min",
});

const buildDecisionHeavySameFloorRoute = () => ({
  distance: "60 m",
  duration: "3 min",
  buildingName: "Hall Building",
  buildingId: "Hall-8",
  startFloor: "8",
  endFloor: "8",
  steps: [
    {
      instruction: "Walk east",
      distance: "20 m",
      duration: "1 min",
      floor: "8",
      maneuverType: "STRAIGHT",
    },
    {
      instruction: "Turn toward the hallway",
      distance: "20 m",
      duration: "1 min",
      floor: "8",
      maneuverType: "TURN_RIGHT",
    },
    {
      instruction: "Continue to H-820",
      distance: "20 m",
      duration: "1 min",
      floor: "8",
      maneuverType: "TURN_LEFT",
    },
  ],
  polyline: "",
  routePoints: [
    { x: 0, y: 0, label: "H-801" },
    { x: 24, y: 0, label: "H8-Corner-A" },
    { x: 24, y: 24, label: "H8-Corner-B" },
    { x: 48, y: 24, label: "H-820" },
  ],
  stairMessage: null,
});

const openUniversalContinuationStepAction = async () => {
  const utils = render(<IndoorNavigation />);

  fireEvent.press(utils.getByTestId("open-start"));
  fireEvent.press(utils.getByTestId("pick-room-first"));
  fireEvent.press(utils.getByTestId("open-end"));
  fireEvent.press(utils.getByTestId("pick-room-universal"));
  fireEvent.press(utils.getByTestId("toggle-directions"));

  await waitFor(() => {
    expect(utils.getByTestId("directions-panel")).toBeTruthy();
  });

  fireEvent.press(utils.getByTestId("collapse-directions"));

  await waitFor(() => {
    expect(utils.getByTestId("next-action-button")).toBeTruthy();
  });

  return utils;
};

describe("IndoorNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { buildingId: "H", floor: "8" };
    mockSetParams.mockImplementation((nextParams: Record<string, string>) => {
      mockParams = {
        ...mockParams,
        ...nextParams,
      };
    });
    useNavigationEndpointsStore.getState().clear();
    useNavigationConfig.setState({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });
    useNavigationInfo.setState({
      pathDistance: "0",
      pathDuration: "0",
      isLoading: false,
    });
    useNavigationProgress.getState().resetProgress();
    useIndoorHandoffStore.getState().clearPendingIndoorTarget();
    useNavigationStore.getState().setNavigationState("IDLE");

    (getAvailableRooms as jest.Mock).mockResolvedValue(["H-801", "H-820"]);
    (getRoomPoints as jest.Mock).mockResolvedValue([
      { id: "H-801", x: 1, y: 2 },
    ]);
    (getPointsOfInterest as jest.Mock).mockResolvedValue([
      { id: "POI-1", x: 4, y: 5, displayName: "Cafe", type: "food" },
    ]);
    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: null,
      outdoorRoute: null,
      endIndoorRoute: null,
      nextShuttleTime: null,
      totalDuration: "0 min",
    });
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([
      {
        distance: "500 m",
        duration: "7 min",
        polyline: "abc",
        transportMode: "walking",
        steps: [],
      },
    ]);
  });

  it("hands manual cross-building routes off to outdoor navigation before the destination indoor leg", async () => {
    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        startFloor: "1",
        endFloor: "1",
        steps: [
          {
            instruction: "Proceed to the main entrance",
            distance: "10 m",
            duration: "1 min",
            floor: "1",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [{ x: 1, y: 1, label: "MB1-Main-Entrance" }],
      },
      outdoorRoute: {
        distance: "500 m",
        duration: "7 min",
        polyline: "abc",
        transportMode: "walking",
        steps: [],
      },
      endIndoorRoute: {
        startFloor: "1",
        endFloor: "1",
        buildingName: "Vanier Libary Building",
        steps: [
          {
            instruction: "Proceed to VL-101",
            distance: "10 m",
            duration: "1 min",
            floor: "1",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [
          { x: 2, y: 2, label: "VL-Entrance-Exit" },
          { x: 4, y: 4, label: "VL-101" },
        ],
      },
      nextShuttleTime: null,
      totalDuration: "12 min",
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-universal"));

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByText("Continue Outside")).toBeTruthy();
      expect(getByTestId("next-action-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("next-action-button"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(home-page)");
      expect(useNavigationConfig.getState().allOutdoorRoutes).toHaveLength(1);
      expect(useNavigationConfig.getState().allOutdoorRoutes[0]?.steps).toEqual(
        [
          expect.objectContaining({
            instruction: "Continue to Vanier Libary Building",
            polyline: "abc",
          }),
        ],
      );
      expect(useNavigationInfo.getState().pathDistance).toBe("500 m");
      expect(useNavigationStore.getState().navigationState).toBe("NAVIGATING");
      expect(useIndoorHandoffStore.getState().pendingIndoorTarget).toEqual(
        expect.objectContaining({
          buildingId: "VL",
          floor: "1",
          startFloor: "1",
          floorSupported: true,
          destinationRoom: "VL-101",
          startRoom: "VL-Entrance-Exit",
        }),
      );
    });
  });

  it.each([
    ["bicycling", "BIKE"],
    ["driving", "CAR"],
    ["transit", "BUS"],
    ["shuttle", "SHUTTLE"],
  ])(
    "preserves existing outdoor steps and maps %s continuation routes to %s",
    async (transportMode, expectedMode) => {
      const preservedSteps = [
        {
          instruction: `Continue by ${transportMode}`,
          distance: "500 m",
          duration: "7 min",
          maneuverType: "STRAIGHT",
          polyline: "existing-polyline",
        },
      ];

      useNavigationConfig.setState({
        navigationMode: expectedMode as "BIKE" | "CAR" | "BUS" | "SHUTTLE",
        allOutdoorRoutes: [],
      });
      (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([]);
      (getUniversalDirections as jest.Mock).mockResolvedValue(
        buildUniversalContinuationResponse({
          transportMode,
          polyline: "existing-polyline",
          steps: preservedSteps,
        }),
      );

      const { getByTestId } = await openUniversalContinuationStepAction();

      fireEvent.press(getByTestId("next-action-button"));

      await waitFor(() => {
        expect(useNavigationConfig.getState().navigationMode).toBe(
          expectedMode,
        );
        expect(
          useNavigationConfig.getState().allOutdoorRoutes[0]?.steps,
        ).toEqual(preservedSteps);
        expect(mockReplace).toHaveBeenCalledWith("/(home-page)");
      });
    },
  );

  it("keeps outdoor routes step-free when the continuation route has no polyline", async () => {
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([]);
    (getUniversalDirections as jest.Mock).mockResolvedValue(
      buildUniversalContinuationResponse({
        polyline: "",
        steps: [],
      }),
    );

    const { getByTestId } = await openUniversalContinuationStepAction();

    fireEvent.press(getByTestId("next-action-button"));

    await waitFor(() => {
      expect(useNavigationConfig.getState().allOutdoorRoutes).toHaveLength(1);
      expect(useNavigationConfig.getState().allOutdoorRoutes[0]?.steps).toEqual(
        [],
      );
      expect(useNavigationConfig.getState().allOutdoorRoutes[0]?.polyline).toBe(
        "",
      );
    });
  });

  it("builds the destination indoor handoff from the destination leg, not stale end-room state", async () => {
    mockParams = {
      buildingId: "H",
      floor: "1",
      startRoom: "H1-Maisonneuve-Entry",
      endRoom: "VL-101",
    };

    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        startFloor: "1",
        endFloor: "1",
        steps: [
          {
            instruction: "Proceed to the main entrance",
            distance: "10 m",
            duration: "1 min",
            floor: "1",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [{ x: 1, y: 1, label: "H1-Maisonneuve-Entry" }],
      },
      outdoorRoute: {
        distance: "500 m",
        duration: "7 min",
        polyline: "abc",
        transportMode: "walking",
        steps: [],
      },
      endIndoorRoute: {
        startFloor: "1",
        endFloor: "S2",
        buildingName: "John Molson Building",
        steps: [
          {
            instruction: "Proceed to MB-S2-330",
            distance: "10 m",
            duration: "1 min",
            floor: "1",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [
          { x: 2, y: 2, label: "MB1-Main-Entrance" },
          { x: 4, y: 4, label: "MB-S2-330" },
        ],
      },
      nextShuttleTime: null,
      totalDuration: "12 min",
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByText("Continue Outside")).toBeTruthy();
    });

    fireEvent.press(getByTestId("next-action-button"));

    await waitFor(() => {
      expect(useIndoorHandoffStore.getState().pendingIndoorTarget).toEqual(
        expect.objectContaining({
          buildingId: "MB",
          floor: "S2",
          startFloor: "1",
          floorSupported: true,
          destinationRoom: "MB-S2-330",
          startRoom: "MB1-Main-Entrance",
        }),
      );
    });
  });

  it("reorients the destination indoor handoff when the destination leg route points are reversed", async () => {
    mockParams = {
      buildingId: "MB",
      floor: "1",
      startRoom: "MB1-Main-Entrance",
      endRoom: "H9-937",
    };

    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        startFloor: "1",
        endFloor: "1",
        buildingName: "John Molson Building",
        steps: [
          {
            instruction: "Proceed to the main entrance",
            distance: "10 m",
            duration: "1 min",
            floor: "1",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [{ x: 1, y: 1, label: "MB1-Main-Entrance" }],
      },
      outdoorRoute: {
        distance: "500 m",
        duration: "7 min",
        polyline: "abc",
        transportMode: "walking",
        steps: [],
      },
      endIndoorRoute: {
        startFloor: "9",
        endFloor: "1",
        buildingName: "Hall Building",
        steps: [
          {
            instruction: "Proceed to H1-Maisonneuve-Entry",
            distance: "10 m",
            duration: "1 min",
            floor: "9",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [
          { x: 2, y: 2, label: "H9-937" },
          { x: 4, y: 4, label: "H1-Maisonneuve-Entry" },
        ],
      },
      nextShuttleTime: null,
      totalDuration: "12 min",
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getUniversalDirections).toHaveBeenCalledWith(
        "MB",
        "MB1-Main-Entrance",
        "1",
        "H",
        "H9-937",
        "9",
        false,
      );
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByText("Continue Outside")).toBeTruthy();
    });

    fireEvent.press(getByTestId("next-action-button"));

    await waitFor(() => {
      expect(useIndoorHandoffStore.getState().pendingIndoorTarget).toEqual(
        expect.objectContaining({
          buildingId: "H",
          floor: "9",
          startFloor: "1",
          floorSupported: true,
          destinationRoom: "H9-937",
          startRoom: "H1-Maisonneuve-Entry",
        }),
      );
    });
  });

  it("switches the displayed indoor map to the route origin building for manual cross-building routes", async () => {
    mockParams = {
      buildingId: "VL",
      floor: "1",
    };

    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        startFloor: "8",
        endFloor: "1",
        buildingName: "Hall Building",
        steps: [
          {
            instruction: "Head to the exit",
            distance: "10 m",
            duration: "1 min",
            floor: "8",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [{ x: 1, y: 1, label: "H8-801" }],
      },
      outdoorRoute: {
        distance: "500 m",
        duration: "7 min",
        polyline: "abc",
        transportMode: "walking",
        steps: [],
      },
      endIndoorRoute: {
        startFloor: "1",
        endFloor: "1",
        buildingName: "Vanier Library Building",
        steps: [
          {
            instruction: "Proceed to VL-101",
            distance: "10 m",
            duration: "1 min",
            floor: "1",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [
          { x: 2, y: 2, label: "VL-Entrance-Exit" },
          { x: 4, y: 4, label: "VL-101" },
        ],
      },
      nextShuttleTime: null,
      totalDuration: "12 min",
    });

    const { getByTestId } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-universal"));

    await waitFor(() => {
      expect(getUniversalDirections).toHaveBeenCalledWith(
        "H",
        "H-801",
        "8",
        "VL",
        "VL-101",
        "1",
        false,
      );
      expect(getByTestId("floor-plan-building").props.children).toBe("H");
      expect(getByTestId("floor-plan-floor").props.children).toBe("8");
    });
  });

  it("does not reuse the previous building route when a param-driven continue-inside handoff opens a new target building", async () => {
    mockParams = {
      buildingId: "H",
      floor: "1",
      startRoom: "H1-Maisonneuve-Entry",
      endRoom: "H9-937",
      forceBuildingId: "1",
    };

    (getIndoorDirections as jest.Mock).mockImplementation(
      (building: string, origin: string, destination: string) => {
        if (
          building === "H" &&
          origin === "H1-Maisonneuve-Entry" &&
          destination === "H9-937"
        ) {
          return Promise.resolve({
            distance: "100 m",
            duration: "5 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "1",
            endFloor: "9",
            steps: [
              {
                instruction: "Walk to H9-937",
                distance: "100 m",
                duration: "5 min",
                floor: "1",
                maneuverType: "STRAIGHT",
              },
            ],
            polyline: "",
            routePoints: [
              { x: 1, y: 1, label: "H1-Maisonneuve-Entry" },
              { x: 2, y: 2, label: "H9-937" },
            ],
            stairMessage: null,
          });
        }

        if (
          building === "MB" &&
          origin === "MB1-Main-Entrance" &&
          destination === "MB-S2-330"
        ) {
          return Promise.resolve({
            distance: "120 m",
            duration: "6 min",
            buildingName: "John Molson Building",
            buildingId: "MB",
            startFloor: "1",
            endFloor: "S2",
            steps: [
              {
                instruction: "Walk to MB-S2-330",
                distance: "120 m",
                duration: "6 min",
                floor: "1",
                maneuverType: "STRAIGHT",
              },
            ],
            polyline: "",
            routePoints: [
              { x: 3, y: 3, label: "MB1-Main-Entrance" },
              { x: 4, y: 4, label: "MB-S2-330" },
            ],
            stairMessage: null,
          });
        }

        return Promise.reject(
          new Error(
            `Unexpected path request: ${building} ${origin} -> ${destination}`,
          ),
        );
      },
    );

    const screen = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H1-Maisonneuve-Entry",
        "H9-937",
        "1",
        "9",
        false,
      );
      expect(screen.getByTestId("floor-plan-building").props.children).toBe(
        "H",
      );
    });

    mockParams = {
      buildingId: "MB",
      floor: "1",
      startRoom: "MB1-Main-Entrance",
      endRoom: "MB-S2-330",
      forceBuildingId: "1",
    };
    screen.rerender(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "MB",
        "MB1-Main-Entrance",
        "MB-S2-330",
        "1",
        "S2",
        false,
      );
      expect(screen.getByTestId("floor-plan-building").props.children).toBe(
        "MB",
      );
      expect(screen.getByTestId("floor-plan-floor").props.children).toBe("1");
    });
  });

  it("loads indoor data and draws a route after selecting start and end rooms", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "25m",
      duration: "2 min",
      buildingName: "Hall Building",
      buildingId: "Hall-8",
      startFloor: "8",
      endFloor: "8",
      steps: [{ instruction: "Go straight", distance: "10m", duration: "30s" }],
      polyline: "",
      routePoints: [{ x: 10, y: 20 }],
      stairMessage: "Use stairs between sections",
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getAvailableRooms).toHaveBeenCalledWith("H", "8");
    });

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H-801",
        "H-820",
        "8",
        "8",
        false,
      );
    });

    await waitFor(() => {
      expect(getByTestId("route-point-count").props.children).toBe("1");
    });
    expect(getByText(/Use stairs between sections/)).toBeTruthy();
  });

  it("handles multi-floor step navigation and changes floors after the elevator step", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildCrossFloorRoute(),
    );

    const { getByTestId } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(
      () => {
        expect(getByTestId("route-point-count").props.children).toBe("2");
      },
      { timeout: 15_000 },
    );

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByTestId("next-step-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("next-step-button"));

    expect(mockSetParams).not.toHaveBeenCalledWith({ floor: "9" });

    fireEvent.press(getByTestId("next-step-button"));

    await waitFor(
      () => {
        expect(mockSetParams).toHaveBeenCalledWith({ floor: "9" });
        expect(getByTestId("route-point-count").props.children).toBe("2");
      },
      { timeout: 15_000 },
    );
  }, 20_000);

  it("handles universal cross-building routing", async () => {
    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        startFloor: "8",
        endFloor: "1",
        steps: [
          {
            instruction: "Head to the exit",
            distance: "10 m",
            duration: "1 min",
            floor: "8",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [{ x: 1, y: 1, label: "H8-801" }],
      },
      endIndoorRoute: {
        startFloor: "1",
        endFloor: "1",
        steps: [
          {
            instruction: "Proceed to VL-101",
            distance: "10 m",
            duration: "1 min",
            floor: "1",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [{ x: 2, y: 2, label: "VL-101" }],
      },
      nextShuttleTime: "14:30",
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));

    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-universal"));

    await waitFor(() => {
      expect(getUniversalDirections).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    expect(getByText("Continue Outside")).toBeTruthy();

    fireEvent.press(getByTestId("next-action-button"));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "1" });
    });
  });

  it("handles clearing and swapping locations", async () => {
    const { getByTestId } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getByTestId("start-room-value").props.children).toBe("H-801");
      expect(getByTestId("end-room-value").props.children).toBe("H-820");
    });

    fireEvent.press(getByTestId("swap-locations"));
    await waitFor(() => {
      expect(getByTestId("start-room-value").props.children).toBe("H-820");
      expect(getByTestId("end-room-value").props.children).toBe("H-801");
    });

    fireEvent.press(getByTestId("clear-start"));
    fireEvent.press(getByTestId("clear-end"));
    await waitFor(() => {
      expect(getByTestId("start-room-value").props.children).toBe("");
      expect(getByTestId("end-room-value").props.children).toBe("");
    });
  });

  it("handles API errors gracefully", async () => {
    (getIndoorDirections as jest.Mock).mockRejectedValue(
      new Error("Network Error"),
    );

    const { getByTestId } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(mockClearRoute).toHaveBeenCalled();
    });
  });

  it("changes floor, clears route, and updates route params", async () => {
    const { getByTestId } = render(<IndoorNavigation />);
    fireEvent.press(getByTestId("change-floor"));
    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "9" });
      expect(mockClearRoute).toHaveBeenCalled();
    });
  });

  it("keeps a cross-floor route when manually changing floors", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildCrossFloorRoute(),
    );

    const { getByTestId } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getByTestId("route-point-count").props.children).toBe("2");
    });

    fireEvent.press(getByTestId("change-floor"));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "9" });
      expect(getByTestId("route-point-count").props.children).toBe("2");
    });
  });

  it("refetches the route once with the latest avoid-stairs value", async () => {
    const { getByTestId, UNSAFE_getByType } = render(<IndoorNavigation />);
    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledTimes(1);
    });

    fireEvent(UNSAFE_getByType(Switch), "valueChange", true);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledTimes(2);
      expect(getIndoorDirections).toHaveBeenLastCalledWith(
        "H",
        "H-801",
        "H-820",
        "8",
        "8",
        true,
      );
    });
  });

  it("calls getUniversalDirections when start and end are in different buildings", async () => {
    (getAvailableRooms as jest.Mock).mockImplementation((bId: string) => {
      if (bId === "CC" || String(bId).startsWith("CC"))
        return Promise.resolve(["CC-101"]);
      return Promise.resolve(["H8-801", "H8-820", "VL-101"]);
    });

    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        routePoints: [{ x: 1, y: 1 }],
        startFloor: "2",
        endFloor: "2",
      },
      endIndoorRoute: {
        routePoints: [{ x: 2, y: 2 }],
        startFloor: "2",
        endFloor: "2",
      },
      nextShuttleTime: null,
      totalDuration: "5 min",
    });

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));

    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-universal"));

    await waitFor(() => {
      expect(getUniversalDirections).toHaveBeenCalled();
    });
  });

  it("swap locations exchanges start and end rooms", async () => {
    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => expect(getIndoorDirections).toHaveBeenCalled());

    expect(getByTestId("start-room-value").props.children).toBe("H-801");
    expect(getByTestId("end-room-value").props.children).toBe("H-820");

    fireEvent.press(getByTestId("swap-locations"));

    await waitFor(() => {
      expect(getByTestId("start-room-value").props.children).toBe("H-820");
      expect(getByTestId("end-room-value").props.children).toBe("H-801");
    });
  });

  it("restarts the full room-to-room flow from the beginning with swapped endpoints when swap is pressed in a forced target-building flow", async () => {
    mockParams = {
      buildingId: "H",
      floor: "1",
      startRoom: "H1-Maisonneuve-Entry",
      endRoom: "H9-937",
      forceBuildingId: "1",
      globalOriginRoom: "MB-S2-330",
      globalOriginBuildingId: "MB",
      globalDestinationRoom: "H9-937",
      globalDestinationBuildingId: "H",
    };

    (getIndoorDirections as jest.Mock).mockImplementation(
      (building: string, origin: string, destination: string) => {
        if (
          building === "H" &&
          origin === "H1-Maisonneuve-Entry" &&
          destination === "H9-937"
        ) {
          return Promise.resolve({
            distance: "100 m",
            duration: "5 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "1",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 1, y: 1, label: "H1-Maisonneuve-Entry" },
              { x: 2, y: 2, label: "H9-937" },
            ],
            stairMessage: null,
          });
        }
        return Promise.reject(
          new Error(
            `Unexpected path request: ${building} ${origin} -> ${destination}`,
          ),
        );
      },
    );

    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        startFloor: "9",
        endFloor: "1",
        buildingName: "Hall Building",
        steps: [],
        routePoints: [{ x: 1, y: 1, label: "H9-937" }],
      },
      outdoorRoute: {
        distance: "500 m",
        duration: "7 min",
        polyline: "abc",
        transportMode: "walking",
        steps: [],
      },
      endIndoorRoute: {
        startFloor: "1",
        endFloor: "S2",
        buildingName: "John Molson Building",
        steps: [],
        routePoints: [
          { x: 2, y: 2, label: "MB1-Main-Entrance" },
          { x: 4, y: 4, label: "MB-S2-330" },
        ],
      },
      nextShuttleTime: null,
      totalDuration: "12 min",
    });

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H1-Maisonneuve-Entry",
        "H9-937",
        "1",
        "9",
        false,
      );
    });

    fireEvent.press(getByTestId("swap-locations"));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({
        buildingId: "H",
        floor: "9",
        startRoom: "H9-937",
        endRoom: "MB-S2-330",
        forceBuildingId: "0",
        resumeOutdoorNavigation: "0",
        resumeOutdoorNavigationToken: "",
        returnOutdoorOriginLat: "",
        returnOutdoorOriginLng: "",
        returnOutdoorOriginLabel: "",
        returnOutdoorOriginBuildingId: "",
        returnOutdoorDestinationLat: "",
        returnOutdoorDestinationLng: "",
        returnOutdoorDestinationLabel: "",
        returnOutdoorDestinationBuildingId: "",
        returnOutdoorMode: "",
        globalOriginRoom: "H9-937",
        globalOriginBuildingId: "H",
        globalDestinationRoom: "MB-S2-330",
        globalDestinationBuildingId: "MB",
      });
      expect(getUniversalDirections).toHaveBeenCalledWith(
        "H",
        "H9-937",
        "9",
        "MB",
        "MB-S2-330",
        "S2",
        false,
      );
      expect(getByTestId("start-room-value").props.children).toBe("H9-937");
      expect(getByTestId("end-room-value").props.children).toBe("MB-S2-330");
    });
  });

  it("fetches the indoor exit route after selecting a start room in resume-outdoor mode", async () => {
    const hallExitRoom = BUILDING_EXIT_ROOMS.H?.room;
    expect(hallExitRoom).toBeTruthy();

    mockParams = {
      buildingId: "H",
      floor: "1",
      endRoom: hallExitRoom,
      resumeOutdoorNavigation: "1",
      resumeOutdoorNavigationToken: "resume-token",
    };

    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "100 m",
      duration: "5 min",
      buildingName: "Hall Building",
      buildingId: "H",
      startFloor: "8",
      endFloor: "1",
      steps: [],
      polyline: "",
      routePoints: [
        { x: 1, y: 1, label: "H-820" },
        { x: 2, y: 2, label: hallExitRoom },
      ],
      stairMessage: null,
    });

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getByTestId("selecting-for").props.children).toBe("start");
    });

    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H-820",
        hallExitRoom,
        "8",
        "1",
        false,
      );
    });
  });

  it("clear start and clear end reset the room fields", async () => {
    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("clear-start"));

    expect(getByTestId("start-room-value").props.children).toBe("");

    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));
    fireEvent.press(getByTestId("clear-end"));

    expect(getByTestId("end-room-value").props.children).toBe("");
  });

  it("shows previous and next step buttons when route spans multiple floors", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildCrossFloorRoute(),
    );

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByTestId("previous-step-button")).toBeTruthy();
      expect(getByTestId("next-step-button")).toBeTruthy();
    });
  });

  it("shows the step buttons while the directions panel is open", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildCrossFloorRoute(),
    );

    const { getByTestId, queryByTestId } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(queryByTestId("next-step-button")).toBeNull();
    });

    fireEvent.press(getByTestId("toggle-directions"));

    await waitFor(() => {
      expect(getByTestId("next-step-button")).toBeTruthy();
      expect(getByTestId("previous-step-button")).toBeTruthy();
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
  });

  it("keeps the step buttons rendered when the directions panel is expanded and collapsed", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildCrossFloorRoute(),
    );

    const { getByTestId, queryByTestId } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(queryByTestId("next-step-button")).toBeNull();
    });

    fireEvent.press(getByTestId("toggle-directions"));

    await waitFor(() => {
      expect(getByTestId("next-step-button")).toBeTruthy();
      expect(getByTestId("previous-step-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByTestId("previous-step-button")).toBeTruthy();
      expect(getByTestId("next-step-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("expand-directions"));

    await waitFor(() => {
      expect(getByTestId("next-step-button")).toBeTruthy();
      expect(getByTestId("previous-step-button")).toBeTruthy();
    });
  });

  it("handles routing error without crashing", async () => {
    (getIndoorDirections as jest.Mock).mockRejectedValue(
      new Error("Network error"),
    );

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => expect(getIndoorDirections).toHaveBeenCalled());
  });

  it("displays building name for VL when no route data", async () => {
    mockParams = { buildingId: "VL", floor: "1" };
    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());
    expect(getByTestId("building-name").props.children).toBe(
      "Vanier Library Building",
    );
  });

  it("clears route when indoor response has empty routePoints", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "0m",
      duration: "0 sec",
      buildingName: "Hall Building",
      buildingId: "Hall-8",
      startFloor: "8",
      endFloor: "8",
      steps: [],
      polyline: "",
      routePoints: [],
      stairMessage: null,
    });

    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => expect(getIndoorDirections).toHaveBeenCalled());
    expect(getByTestId("route-point-count").props.children).toBe("0");
  });

  it("updates the visible segment when advancing and retracing steps", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildCrossFloorRoute(),
    );

    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getByTestId("route-point-count").props.children).toBe("2");
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    fireEvent.press(getByTestId("next-step-button"));
    fireEvent.press(getByTestId("next-step-button"));
    fireEvent.press(getByTestId("next-step-button"));

    await waitFor(() => {
      expect(getByTestId("route-point-count").props.children).toBe("1");
    });

    fireEvent.press(getByTestId("previous-step-button"));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "9" });
      expect(getByTestId("route-point-count").props.children).toBe("2");
    });
  });

  it("shortens same-floor displayed routes at each decision point", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildDecisionHeavySameFloorRoute(),
    );

    const { getByTestId } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getByTestId("route-point-count").props.children).toBe("4");
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    fireEvent.press(getByTestId("next-step-button"));

    await waitFor(() => {
      expect(getByTestId("route-point-count").props.children).toBe("3");
    });

    fireEvent.press(getByTestId("next-step-button"));

    await waitFor(() => {
      expect(getByTestId("route-point-count").props.children).toBe("2");
    });
  });

  it("displays Hall Building when buildingId is H and no route", async () => {
    mockParams = { buildingId: "H", floor: "8" };
    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());
    expect(getByTestId("building-name").props.children).toBe("Hall Building");
  });

  it("handles universal route with nextShuttleTime without crashing", async () => {
    (getAvailableRooms as jest.Mock).mockImplementation((bId: string) => {
      if (bId === "CC" || String(bId).startsWith("CC"))
        return Promise.resolve(["CC-101"]);
      return Promise.resolve(["H8-801", "H8-820"]);
    });

    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        routePoints: [{ x: 1, y: 1 }],
        startFloor: "1",
        endFloor: "1",
      },
      endIndoorRoute: {
        routePoints: [{ x: 2, y: 2 }],
        startFloor: "1",
        endFloor: "1",
      },
      nextShuttleTime: "14:30",
      totalDuration: "15 min",
    });

    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => expect(getUniversalDirections).toHaveBeenCalled());
  });

  it("resets state when building changes via params", async () => {
    const { rerender, getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));

    mockParams = { buildingId: "VL", floor: "1" };
    rerender(<IndoorNavigation />);

    await waitFor(() => {
      expect(getAvailableRooms).toHaveBeenCalledWith("VL", "1");
    });
  });

  it("selects LB building room and triggers indoor directions", async () => {
    (getAvailableRooms as jest.Mock).mockImplementation((bId: string) => {
      if (bId === "LB" || String(bId).startsWith("LB"))
        return Promise.resolve(["LB-204", "LB-259"]);
      return Promise.resolve(["H-801", "H-820"]);
    });
    mockParams = { buildingId: "LB", floor: "2" };
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      routePoints: [{ x: 1, y: 1 }],
      steps: [],
    });

    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalled();
    });
  });

  it("selects CC building room for cross-building routing", async () => {
    (getAvailableRooms as jest.Mock).mockImplementation((bId: string) => {
      if (bId === "CC" || String(bId).startsWith("CC"))
        return Promise.resolve(["CC-101"]);
      return Promise.resolve(["H-801", "H-820"]);
    });
    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: { routePoints: [], startFloor: "8", endFloor: "8" },
      endIndoorRoute: { routePoints: [], startFloor: "1", endFloor: "1" },
      nextShuttleTime: null,
      totalDuration: "5 min",
    });

    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getUniversalDirections).toHaveBeenCalled();
    });
  });

  it("handles getRoomPoints error without crashing", async () => {
    (getRoomPoints as jest.Mock).mockRejectedValue(
      new Error("Room points error"),
    );
    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());
    expect(getByTestId("floor-plan-webview")).toBeTruthy();
  });

  it("handles getPointsOfInterest error without crashing", async () => {
    (getPointsOfInterest as jest.Mock).mockRejectedValue(
      new Error("POI fetch error"),
    );
    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());
    expect(getByTestId("floor-plan-webview")).toBeTruthy();
  });

  it("room tap sets end room and opens start picker when no start", async () => {
    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("sim-room-tap"));

    await waitFor(() => {
      expect(getByTestId("selecting-for").props.children).toBe("start");
    });
  });

  it("poi tap sets destination and opens start picker when no start room exists", async () => {
    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("sim-poi-tap"));

    await waitFor(() => {
      expect(getByTestId("end-room-value").props.children).toBe("VL-101");
      expect(getByTestId("selecting-for").props.children).toBe("start");
    });
  });

  it("falls back to split cross-floor routing when direct cross-floor response is incomplete", async () => {
    mockParams = {
      buildingId: "H",
      floor: "8",
      startRoom: "H8-801",
      endRoom: "H9-937",
    };

    (getAvailableRooms as jest.Mock).mockImplementation(
      (_building: string, floor: string) => {
        if (floor === "8")
          return Promise.resolve(["H8-801", "H8-Main-Elevator"]);
        if (floor === "9")
          return Promise.resolve(["H9-937", "H9-Main-Elevator"]);
        return Promise.resolve(["H8-801", "H9-937"]);
      },
    );
    (getRoomPoints as jest.Mock).mockResolvedValue([
      { id: "H9-Main-Elevator", x: 10, y: 10 },
      { id: "H9-937", x: 25, y: 10 },
    ]);
    (getPointsOfInterest as jest.Mock).mockResolvedValue([]);
    (getIndoorDirections as jest.Mock).mockImplementation(
      (
        _building: string,
        origin: string,
        destination: string,
        startFloor: string,
        endFloor: string,
      ) => {
        if (origin === "H8-801" && destination === "H9-937") {
          return Promise.resolve({
            distance: "15 m",
            duration: "2 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 0, y: 0, label: "H8-801" },
              { x: 3, y: 3, label: "H8-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (
          origin === "H8-801" &&
          destination === "H8-Main-Elevator" &&
          startFloor === "8" &&
          endFloor === "8"
        ) {
          return Promise.resolve({
            distance: "20 m",
            duration: "3 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "8",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 0, y: 0, label: "H8-801" },
              { x: 3, y: 3, label: "H8-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (
          origin === "H9-Main-Elevator" &&
          destination === "H9-937" &&
          startFloor === "9" &&
          endFloor === "9"
        ) {
          return Promise.resolve({
            distance: "40 m",
            duration: "5 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "9",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 3, y: 3, label: "H9-Main-Elevator" },
              { x: 20, y: 20, label: "H9-937" },
            ],
            stairMessage: null,
          });
        }
        return Promise.reject(
          new Error(`Unexpected path request: ${origin} -> ${destination}`),
        );
      },
    );

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H8-801",
        "H9-937",
        "8",
        "9",
        false,
      );
    });
    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H8-801",
        "H8-Main-Elevator",
        "8",
        "8",
        false,
      );
    });
    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H9-Main-Elevator",
        "H9-937",
        "9",
        "9",
        false,
      );
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByTestId("next-action-button")).toBeTruthy();
    });
  });

  it("retries split routing without avoid-stairs when avoid-stairs split cannot find a path", async () => {
    mockParams = {
      buildingId: "H",
      floor: "8",
      startRoom: "H8-801",
      endRoom: "H9-937",
    };

    (getAvailableRooms as jest.Mock).mockImplementation(
      (_building: string, floor: string) => {
        if (floor === "8")
          return Promise.resolve(["H8-801", "H8-Main-Elevator"]);
        if (floor === "9")
          return Promise.resolve(["H9-937", "H9-Main-Elevator"]);
        return Promise.resolve(["H8-801", "H9-937"]);
      },
    );
    (getRoomPoints as jest.Mock).mockResolvedValue([
      { id: "H9-Main-Elevator", x: 10, y: 10 },
      { id: "H9-937", x: 25, y: 10 },
    ]);
    (getPointsOfInterest as jest.Mock).mockResolvedValue([]);
    (getIndoorDirections as jest.Mock).mockImplementation(
      (
        _building: string,
        origin: string,
        destination: string,
        _startFloor: string,
        _endFloor: string,
        avoidStairs: boolean,
      ) => {
        if (origin === "H8-801" && destination === "H9-937") {
          return Promise.resolve({
            distance: "15 m",
            duration: "2 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 0, y: 0, label: "H8-801" },
              { x: 3, y: 3, label: "H8-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (origin === "H8-801" && destination === "H8-Main-Elevator") {
          if (avoidStairs)
            return Promise.reject(new Error("No elevator route"));
          return Promise.resolve({
            distance: "20 m",
            duration: "3 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "8",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 0, y: 0, label: "H8-801" },
              { x: 3, y: 3, label: "H8-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (origin === "H9-Main-Elevator" && destination === "H9-937") {
          if (avoidStairs)
            return Promise.reject(new Error("No elevator route"));
          return Promise.resolve({
            distance: "40 m",
            duration: "5 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "9",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 3, y: 3, label: "H9-Main-Elevator" },
              { x: 20, y: 20, label: "H9-937" },
            ],
            stairMessage: null,
          });
        }
        return Promise.reject(
          new Error(`Unexpected path request: ${origin} -> ${destination}`),
        );
      },
    );

    const { UNSAFE_getByType } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H8-801",
        "H9-937",
        "8",
        "9",
        false,
      );
    });

    (getIndoorDirections as jest.Mock).mockClear();

    fireEvent(UNSAFE_getByType(Switch), "valueChange", true);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H8-801",
        "H8-Main-Elevator",
        "8",
        "8",
        true,
      );
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H8-801",
        "H8-Main-Elevator",
        "8",
        "8",
        false,
      );
    });
  });

  it("builds a descending elevator transition when avoid-stairs split routing succeeds", async () => {
    mockParams = {
      buildingId: "H",
      floor: "9",
      startRoom: "H9-937",
      endRoom: "H8-801",
    };

    (getAvailableRooms as jest.Mock).mockImplementation(
      (_building: string, floor: string) => {
        if (floor === "9")
          return Promise.resolve(["H9-937", "H9-Main-Elevator"]);
        if (floor === "8")
          return Promise.resolve(["H8-801", "H8-Main-Elevator"]);
        return Promise.resolve(["H8-801", "H9-937"]);
      },
    );
    (getRoomPoints as jest.Mock).mockResolvedValue([
      { id: "H8-Main-Elevator", x: 10, y: 10 },
      { id: "H8-801", x: 25, y: 10 },
    ]);
    (getPointsOfInterest as jest.Mock).mockResolvedValue([]);
    (getIndoorDirections as jest.Mock).mockImplementation(
      (
        _building: string,
        origin: string,
        destination: string,
        startFloor: string,
        endFloor: string,
        avoidStairs: boolean,
      ) => {
        if (origin === "H9-937" && destination === "H8-801") {
          return Promise.resolve({
            distance: "15 m",
            duration: "2 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "9",
            endFloor: "8",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 20, y: 20, label: "H9-937" },
              { x: 3, y: 3, label: "H9-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (
          origin === "H9-937" &&
          destination === "H9-Main-Elevator" &&
          startFloor === "9" &&
          endFloor === "9" &&
          avoidStairs
        ) {
          return Promise.resolve({
            distance: "20 m",
            duration: "3 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "9",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 20, y: 20, label: "H9-937" },
              { x: 3, y: 3, label: "H9-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (
          origin === "H8-Main-Elevator" &&
          destination === "H8-801" &&
          startFloor === "8" &&
          endFloor === "8" &&
          avoidStairs
        ) {
          return Promise.resolve({
            distance: "40 m",
            duration: "5 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "8",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 3, y: 3, label: "H8-Main-Elevator" },
              { x: 0, y: 0, label: "H8-801" },
            ],
            stairMessage: null,
          });
        }
        return Promise.reject(
          new Error(`Unexpected path request: ${origin} -> ${destination}`),
        );
      },
    );

    const { getByTestId, UNSAFE_getByType } = render(<IndoorNavigation />);

    fireEvent(UNSAFE_getByType(Switch), "valueChange", true);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H9-937",
        "H9-Main-Elevator",
        "9",
        "9",
        true,
      );
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H8-Main-Elevator",
        "H8-801",
        "8",
        "8",
        true,
      );
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByTestId("next-action-button")).toBeTruthy();
    });
  });

  it("parses basement floor from room id and falls back to current floor for unknown room ids", async () => {
    (getAvailableRooms as jest.Mock).mockResolvedValue(["UNKNOWN", "ZZ-S2"]);
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "12 m",
      duration: "1 min",
      buildingName: "Hall Building",
      buildingId: "H",
      startFloor: "S2",
      endFloor: "8",
      steps: [],
      polyline: "",
      routePoints: [
        { x: 0, y: 0, label: "ZZ-S2" },
        { x: 1, y: 1, label: "TRANSITION_S2_TO_8" },
        { x: 2, y: 2, label: "UNKNOWN" },
      ],
      stairMessage: null,
    });

    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-second"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-unknown"));

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "ZZ-S2",
        "UNKNOWN",
        "S2",
        "8",
        false,
      );
    });
  });

  it("parses MB building floor from MB-floor-room ids such as MB-S2-330", async () => {
    mockParams = {
      buildingId: "MB",
      floor: "S2",
      startRoom: "MB-Elevator-Main",
      endRoom: "MB-S2-330",
    };

    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "20 m",
      duration: "2 min",
      buildingName: "John Molson Building",
      buildingId: "MB",
      startFloor: "S2",
      endFloor: "S2",
      steps: [],
      polyline: "",
      routePoints: [
        { x: 0, y: 0, label: "MB-Elevator-Main" },
        { x: 1, y: 1, label: "MB-S2-330" },
      ],
      stairMessage: null,
    });

    render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "MB",
        "MB-Elevator-Main",
        "MB-S2-330",
        "S2",
        "S2",
        false,
      );
    });
  });

  it("parses compact MB basement room ids such as MBS2-Entrance-Exit", async () => {
    mockParams = {
      buildingId: "MB",
      floor: "S2",
      startRoom: "MBS2-Entrance-Exit",
      endRoom: "MB-S2-330",
    };

    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "20 m",
      duration: "2 min",
      buildingName: "John Molson Building",
      buildingId: "MB",
      startFloor: "S2",
      endFloor: "S2",
      steps: [],
      polyline: "",
      routePoints: [
        { x: 0, y: 0, label: "MBS2-Entrance-Exit" },
        { x: 1, y: 1, label: "MB-S2-330" },
      ],
      stairMessage: null,
    });

    render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "MB",
        "MBS2-Entrance-Exit",
        "MB-S2-330",
        "S2",
        "S2",
        false,
      );
    });
  });

  it("uses reverse same-floor leg when direct destination leg is missing", async () => {
    mockParams = {
      buildingId: "H",
      floor: "8",
      startRoom: "H8-801",
      endRoom: "H9-937",
    };

    (getAvailableRooms as jest.Mock).mockImplementation(
      (_building: string, floor: string) => {
        if (floor === "8")
          return Promise.resolve(["H8-801", "H8-Main-Elevator"]);
        if (floor === "9")
          return Promise.resolve(["H9-937", "H9-Main-Elevator"]);
        return Promise.resolve(["H8-801", "H9-937"]);
      },
    );
    (getPointsOfInterest as jest.Mock).mockResolvedValue([]);
    (getRoomPoints as jest.Mock).mockResolvedValue([]);
    (getIndoorDirections as jest.Mock).mockImplementation(
      (_building: string, origin: string, destination: string) => {
        if (origin === "H8-801" && destination === "H9-937") {
          return Promise.resolve({
            distance: "15 m",
            duration: "2 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 0, y: 0, label: "H8-801" },
              { x: 3, y: 3, label: "H8-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (origin === "H8-801" && destination === "H8-Main-Elevator") {
          return Promise.resolve({
            distance: "20 m",
            duration: "3 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "8",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 0, y: 0, label: "H8-801" },
              { x: 3, y: 3, label: "H8-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (origin === "H9-Main-Elevator" && destination === "H9-937") {
          return Promise.resolve({
            distance: "0 m",
            duration: "0 sec",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "9",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [],
            stairMessage: null,
          });
        }
        if (origin === "H9-937" && destination === "H9-Main-Elevator") {
          return Promise.resolve({
            distance: "30 m",
            duration: "4 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "9",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 20, y: 20, label: "H9-937" },
              { x: 3, y: 3, label: "H9-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        return Promise.reject(
          new Error(`Unexpected path request: ${origin} -> ${destination}`),
        );
      },
    );

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H9-937",
        "H9-Main-Elevator",
        "9",
        "9",
        false,
      );
    });
  });

  it("builds a synthetic destination leg when direct and reverse destination legs are unavailable", async () => {
    mockParams = {
      buildingId: "H",
      floor: "8",
      startRoom: "H8-801",
      endRoom: "H9-937",
    };

    (getAvailableRooms as jest.Mock).mockImplementation(
      (_building: string, floor: string) => {
        if (floor === "8")
          return Promise.resolve(["H8-801", "H8-Main-Elevator"]);
        if (floor === "9")
          return Promise.resolve(["H9-937", "H9-Main-Elevator"]);
        return Promise.resolve(["H8-801", "H9-937"]);
      },
    );
    (getPointsOfInterest as jest.Mock).mockResolvedValue([]);
    (getRoomPoints as jest.Mock).mockResolvedValue([
      { id: "H9-Main-Elevator", x: 0, y: 0 },
      { id: "H9-937", x: 1700, y: 0 },
    ]);
    (getIndoorDirections as jest.Mock).mockImplementation(
      (_building: string, origin: string, destination: string) => {
        if (origin === "H8-801" && destination === "H9-937") {
          return Promise.resolve({
            distance: "15 m",
            duration: "2 min",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 0, y: 0, label: "H8-801" },
              { x: 3, y: 3, label: "H8-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (origin === "H8-801" && destination === "H8-Main-Elevator") {
          return Promise.resolve({
            distance: "1.2 km",
            duration: "1 hour 5 mins",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "8",
            endFloor: "8",
            steps: [],
            polyline: "",
            routePoints: [
              { x: 0, y: 0, label: "H8-801" },
              { x: 3, y: 3, label: "H8-Main-Elevator" },
            ],
            stairMessage: null,
          });
        }
        if (origin === "H9-Main-Elevator" && destination === "H9-937") {
          return Promise.resolve({
            distance: "0 m",
            duration: "0 sec",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "9",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [],
            stairMessage: null,
          });
        }
        if (origin === "H9-937" && destination === "H9-Main-Elevator") {
          return Promise.resolve({
            distance: "0 m",
            duration: "0 sec",
            buildingName: "Hall Building",
            buildingId: "H",
            startFloor: "9",
            endFloor: "9",
            steps: [],
            polyline: "",
            routePoints: [],
            stairMessage: null,
          });
        }
        return Promise.reject(
          new Error(`Unexpected path request: ${origin} -> ${destination}`),
        );
      },
    );

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        "H",
        "H9-Main-Elevator",
        "H9-937",
        "9",
        "9",
        false,
      );
    });

    fireEvent.press(getByTestId("toggle-directions"));

    await waitFor(() => {
      expect(getByTestId("directions-panel").props.children).toContain(3);
    });
  });

  it("returns to the origin floor when moving back before the elevator step", async () => {
    mockParams = {
      buildingId: "H",
      floor: "9",
      startRoom: "H8-801",
      endRoom: "H9-937",
    };

    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildCrossFloorRoute(),
    );

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "8" });
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByTestId("next-step-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("next-step-button"));
    fireEvent.press(getByTestId("next-step-button"));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "9" });
      expect(getByTestId("route-point-count").props.children).toBe("2");
    });

    fireEvent.press(getByTestId("previous-step-button"));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "8" });
      expect(getByTestId("route-point-count").props.children).toBe("1");
    });
  });

  it("syncs the displayed floor to the route start floor when a new route loads", async () => {
    mockParams = {
      buildingId: "H",
      floor: "2",
      startRoom: "H8-801",
      endRoom: "H9-937",
    };

    (getIndoorDirections as jest.Mock).mockResolvedValue(
      buildCrossFloorRoute(),
    );

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "8" });
      expect(getByTestId("route-point-count").props.children).toBe("2");
    });
  });

  it("closes room modal and directions panel from their onClose handlers", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "25m",
      duration: "2 min",
      buildingName: "Hall Building",
      buildingId: "Hall-8",
      startFloor: "8",
      endFloor: "8",
      steps: [{ instruction: "Go straight", distance: "10m", duration: "30s" }],
      polyline: "",
      routePoints: [{ x: 10, y: 20 }],
      stairMessage: null,
    });

    const { getByTestId, queryByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("close-room-modal"));
    expect(queryByTestId("selecting-for")).toBeNull();

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => expect(getIndoorDirections).toHaveBeenCalled());

    fireEvent.press(getByTestId("toggle-directions"));
    expect(getByTestId("directions-panel")).toBeTruthy();

    fireEvent.press(getByTestId("close-directions"));
    await waitFor(() => {
      expect(queryByTestId("directions-panel")).toBeNull();
    });
  });

  it("shows continue outside in the step row for the universal origin leg", async () => {
    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: {
        startFloor: "8",
        endFloor: "8",
        steps: [
          {
            instruction: "Head to the building exit",
            distance: "10 m",
            duration: "1 min",
            floor: "8",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [{ x: 1, y: 1, label: "H8-801" }],
      },
      endIndoorRoute: {
        startFloor: "1",
        endFloor: "1",
        steps: [
          {
            instruction: "Proceed to VL-101",
            distance: "10 m",
            duration: "1 min",
            floor: "1",
            maneuverType: "STRAIGHT",
          },
        ],
        routePoints: [{ x: 2, y: 2, label: "VL-101" }],
      },
      nextShuttleTime: null,
      totalDuration: "10 min",
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-universal"));

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByText("Continue Outside")).toBeTruthy();
      expect(getByTestId("next-action-button")).toBeTruthy();
    });
  });

  it("shows continue outside instead of arrived for forced target-building exit routes", async () => {
    mockParams = {
      buildingId: "H",
      floor: "1",
      startRoom: "H9-937",
      endRoom: "H1-Maisonneuve-Entry",
      forceBuildingId: "1",
      returnOutdoorOriginLat: "45.497122",
      returnOutdoorOriginLng: "-73.578471",
      returnOutdoorOriginLabel: "Building MB",
      returnOutdoorOriginBuildingId: "MB",
      returnOutdoorDestinationLat: "45.497339",
      returnOutdoorDestinationLng: "-73.57903",
      returnOutdoorDestinationLabel: "Hall Building",
      returnOutdoorDestinationBuildingId: "H",
      returnOutdoorMode: "WALK",
    };

    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "100 m",
      duration: "5 min",
      buildingName: "Hall Building",
      buildingId: "H",
      startFloor: "9",
      endFloor: "1",
      steps: [
        {
          instruction: "Walk to the exit",
          distance: "100 m",
          duration: "5 min",
          floor: "1",
          maneuverType: "STRAIGHT",
        },
      ],
      polyline: "",
      routePoints: [
        { x: 1, y: 1, label: "H9-937" },
        { x: 2, y: 2, label: "H1-Maisonneuve-Entry" },
      ],
      stairMessage: null,
    });

    const { getByTestId, getByText, queryByText } = render(
      <IndoorNavigation />,
    );

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByText("Continue Outside")).toBeTruthy();
      expect(queryByText("Arrived")).toBeNull();
    });
  });

  it("rebuilds the outdoor route in reverse when forced target-building exit routes continue outside", async () => {
    mockParams = {
      buildingId: "H",
      floor: "1",
      startRoom: "H9-937",
      endRoom: "H1-Maisonneuve-Entry",
      forceBuildingId: "1",
      returnOutdoorOriginLat: "45.497122",
      returnOutdoorOriginLng: "-73.578471",
      returnOutdoorOriginLabel: "Building MB",
      returnOutdoorOriginBuildingId: "MB",
      returnOutdoorDestinationLat: "45.497339",
      returnOutdoorDestinationLng: "-73.57903",
      returnOutdoorDestinationLabel: "Hall Building",
      returnOutdoorDestinationBuildingId: "H",
      returnOutdoorMode: "WALK",
    };

    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "100 m",
      duration: "5 min",
      buildingName: "Hall Building",
      buildingId: "H",
      startFloor: "9",
      endFloor: "1",
      steps: [
        {
          instruction: "Walk to the exit",
          distance: "100 m",
          duration: "5 min",
          floor: "1",
          maneuverType: "STRAIGHT",
        },
      ],
      polyline: "",
      routePoints: [
        { x: 1, y: 1, label: "H9-937" },
        { x: 2, y: 2, label: "H1-Maisonneuve-Entry" },
      ],
      stairMessage: null,
    });

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId("toggle-directions"));
    await waitFor(() => {
      expect(getByTestId("directions-panel")).toBeTruthy();
    });
    fireEvent.press(getByTestId("collapse-directions"));

    await waitFor(() => {
      expect(getByTestId("next-action-button")).toBeTruthy();
    });

    fireEvent.press(getByTestId("next-action-button"));

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledWith(
        {
          latitude: 45.497339,
          longitude: -73.57903,
          buildingId: "H",
        },
        {
          latitude: 45.497122,
          longitude: -73.578471,
          buildingId: "MB",
        },
      );
      expect(useNavigationEndpointsStore.getState().origin).toEqual({
        latitude: 45.497339,
        longitude: -73.57903,
        label: "Hall Building",
        buildingId: "H",
      });
      expect(useNavigationEndpointsStore.getState().destination).toEqual({
        latitude: 45.497122,
        longitude: -73.578471,
        label: "Building MB",
        buildingId: "MB",
      });
      expect(useNavigationStore.getState().navigationState).toBe("NAVIGATING");
      expect(mockReplace).toHaveBeenCalledWith("/(home-page)");
    });
  });

  it("handles university room aggregation failure by logging and clearing available rooms", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (getAvailableRooms as jest.Mock).mockRejectedValue(
      new Error("aggregate fetch failed"),
    );

    render(<IndoorNavigation />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to load university rooms:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });
});
