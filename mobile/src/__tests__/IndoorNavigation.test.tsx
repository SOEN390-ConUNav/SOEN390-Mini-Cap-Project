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

let mockParams: {
  buildingId?: string;
  floor?: string;
  startRoom?: string;
  endRoom?: string;
} = {
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
  const { View, Text, Pressable } = require("react-native");

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

  it("handles multi-floor routes and floor transition buttons", async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      startFloor: "8",
      endFloor: "9",
      routePoints: [
        { x: 10, y: 20, label: "TRANSITION_STAIRS" },
        { x: 30, y: 40 },
      ],
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    fireEvent.press(getByTestId("open-start"));
    fireEvent.press(getByTestId("pick-room-first"));
    fireEvent.press(getByTestId("open-end"));
    fireEvent.press(getByTestId("pick-room-second"));

    await waitFor(() => {
      expect(getByText("Go to Floor 9")).toBeTruthy();
    });

    fireEvent.press(getByText("Go to Floor 9"));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: "9" });
    });
  });

  it("handles universal cross-building routing", async () => {
    (getUniversalDirections as jest.Mock).mockResolvedValue({
      startIndoorRoute: { startFloor: "8", endFloor: "1", routePoints: [] },
      endIndoorRoute: { startFloor: "1", endFloor: "1", routePoints: [] },
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

    expect(getByText("Next Shuttle Bus: 14:30")).toBeTruthy();
    expect(getByText("Exit Building & Go to VL")).toBeTruthy();

    fireEvent.press(getByText("Exit Building & Go to VL"));

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

    const { getByText } = render(<IndoorNavigation />);

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
      expect(getByText("Go to Floor 9")).toBeTruthy();
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
});
