import React from "react";
import { fireEvent, render, waitFor, act } from "@testing-library/react-native";
import { Switch } from "react-native";
import IndoorNavigation from "../app/indoor-navigation";
import {
  getAvailableRooms,
  getIndoorDirections,
  getPointsOfInterest,
  getRoomPoints,
  getUniversalDirections,
} from "../api/indoorDirectionsApi";

const mockSetParams = jest.fn();
const mockDrawRoute = jest.fn();
const mockClearRoute = jest.fn();

let mockParams: { buildingId?: string; floor?: string } = {
  buildingId: "H",
  floor: "8",
};

jest.mock("expo-router", () => ({
  useRouter: () => ({
    setParams: mockSetParams,
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

jest.mock("../components/FloorPlanWebView", () => {
  const ReactLocal = require("react");
  const { View, Text } = require("react-native");

  const MockFloorPlan = ReactLocal.forwardRef((props: any, ref: any) => {
    ReactLocal.useImperativeHandle(ref, () => ({
      drawRoute: mockDrawRoute,
      clearRoute: mockClearRoute,
    }));

    return (
      <View testID="floor-plan-webview">
        <Text testID="route-point-count">
          {String(props.routePoints?.length ?? 0)}
        </Text>
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
  const { Text } = require("react-native");
  return (props: any) => {
    if (!props.visible) return null;
    return (
      <Text testID="directions-panel">
        Steps: {props.routeData?.steps?.length ?? 0}
      </Text>
    );
  };
});

describe("IndoorNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { buildingId: "H", floor: "8" };

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
      expect(getRoomPoints).toHaveBeenCalledWith("H", "8");
      expect(getPointsOfInterest).toHaveBeenCalledWith("H", "8");
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

    expect(getByTestId("route-point-count").props.children).toBe("1");
    expect(getByText("🚶 Use stairs between sections")).toBeTruthy();
  });

  it("changes floor, clears route, and updates route params", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "10m",
      duration: "1 min",
      buildingName: "Hall Building",
      buildingId: "Hall-9",
      startFloor: "9",
      endFloor: "9",
      steps: [],
      polyline: "",
      routePoints: [],
      stairMessage: null,
    });

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getAvailableRooms).toHaveBeenCalledWith("H", "8");
    });

    fireEvent.press(getByTestId("change-floor"));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "9" });
      expect(mockClearRoute).toHaveBeenCalled();
    });
  });

  it("refetches the route once with the latest avoid-stairs value", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "25m",
      duration: "2 min",
      buildingName: "Hall Building",
      buildingId: "Hall-8",
      startFloor: "8",
      endFloor: "8",
      steps: [],
      polyline: "",
      routePoints: [
        { x: 10, y: 20 },
        { x: 20, y: 30 },
      ],
      stairMessage: null,
    });

    const { getByTestId, UNSAFE_getByType } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledTimes(1);
      expect(getIndoorDirections).toHaveBeenLastCalledWith(
        "H",
        "H-801",
        "H-820",
        "8",
        "8",
        false,
      );
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

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
    });

    expect(getIndoorDirections).toHaveBeenCalledTimes(2);
  });

  it("ignores older route responses after avoid-stairs is toggled", async () => {
    let resolveInitialRoute!: (value: any) => void;
    let resolveAccessibleRoute!: (value: any) => void;

    const initialRoutePromise = new Promise((resolve) => {
      resolveInitialRoute = resolve;
    });
    const accessibleRoutePromise = new Promise((resolve) => {
      resolveAccessibleRoute = resolve;
    });

    (getIndoorDirections as jest.Mock)
      .mockImplementationOnce(() => initialRoutePromise)
      .mockImplementationOnce(() => accessibleRoutePromise);

    const { getByTestId, getByText, queryByText, UNSAFE_getByType } = render(
      <IndoorNavigation />,
    );

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

    await act(async () => {
      resolveAccessibleRoute({
        distance: "20m",
        duration: "2 min",
        buildingName: "Hall Building",
        buildingId: "Hall-8",
        startFloor: "8",
        endFloor: "8",
        steps: [],
        polyline: "",
        routePoints: [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ],
        stairMessage: "Accessible route",
      });
    });

    await waitFor(() => {
      expect(getByText("🚶 Accessible route")).toBeTruthy();
    });

    await act(async () => {
      resolveInitialRoute({
        distance: "25m",
        duration: "2 min",
        buildingName: "Hall Building",
        buildingId: "Hall-8",
        startFloor: "8",
        endFloor: "8",
        steps: [],
        polyline: "",
        routePoints: [
          { x: 10, y: 20 },
          { x: 20, y: 30 },
        ],
        stairMessage: "Use stairs between sections",
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(getByText("🚶 Accessible route")).toBeTruthy();
    expect(queryByText("🚶 Use stairs between sections")).toBeNull();
  });

  it("calls getUniversalDirections when start and end are in different buildings", async () => {
    (getAvailableRooms as jest.Mock).mockImplementation((bId: string) => {
      if (bId === "CC" || String(bId).startsWith("CC"))
        return Promise.resolve(["CC-101"]);
      return Promise.resolve(["H8-801", "H8-820"]);
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
    fireEvent.press(getByTestId("pick-room-second"));

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

  it("shows floor transition button when route spans multiple floors", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "50m",
      duration: "3 min",
      buildingName: "Hall Building",
      buildingId: "Hall-8",
      startFloor: "8",
      endFloor: "9",
      steps: [],
      polyline: "",
      routePoints: [
        { x: 10, y: 20, label: "H8-801" },
        { x: 15, y: 25, label: "TRANSITION_STAIRS_TO_9" },
        { x: 20, y: 30, label: "H9-903" },
      ],
      stairMessage: null,
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getByText("Go to Floor 9")).toBeTruthy();
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

  it("shows floor transition buttons for multi-floor route", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: "50m",
      duration: "3 min",
      buildingName: "Hall Building",
      buildingId: "Hall-8",
      startFloor: "8",
      endFloor: "9",
      steps: [],
      polyline: "",
      routePoints: [
        { x: 10, y: 20, label: "H8-801" },
        { x: 15, y: 25, label: "TRANSITION_STAIRS_TO_9" },
        { x: 20, y: 30, label: "H9-903" },
      ],
      stairMessage: null,
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => expect(getByText("Go to Floor 9")).toBeTruthy());
    fireEvent.press(getByText("Go to Floor 9"));
  });

  it("displays Hall Building when buildingId is H and no route", async () => {
    mockParams = { buildingId: "H", floor: "8" };
    const { getByTestId } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());
    expect(getByTestId("building-name").props.children).toBe("Hall Building");
  });

  it("shows shuttle banner when universal route has nextShuttleTime", async () => {
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

    const { getByTestId, getByText } = render(<IndoorNavigation />);
    await waitFor(() => expect(getAvailableRooms).toHaveBeenCalled());

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() =>
      expect(getByText("Next Shuttle Bus: 14:30")).toBeTruthy(),
    );
  });
});
