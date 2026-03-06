import { act, renderHook, waitFor } from "@testing-library/react-native";
import polyline from "@mapbox/polyline";
import { NAVIGATION_STATE } from "../const";
import useRerouting from "../hooks/useRerouting";
import { useNavigationStore } from "../hooks/useNavigationState";
import useNavigationConfig from "../hooks/useNavigationConfig";
import { useNavigationEndpointsStore } from "../hooks/useNavigationEndpoints";
import useNavigationInfo from "../hooks/useNavigationInfo";
import useNavigationProgress from "../hooks/useNavigationProgress";
import useLocationStore from "../hooks/useLocationStore";
import { OutdoorDirectionResponse } from "../api/outdoorDirectionsApi";

jest.mock("../api", () => ({
  getAllOutdoorDirectionsInfo: jest.fn(),
}));

import { getAllOutdoorDirectionsInfo } from "../api";

const createRoute = (
  points: Array<[number, number]>,
  distance = "1.2 km",
  duration = "14 mins",
): OutdoorDirectionResponse => ({
  distance,
  duration,
  polyline: polyline.encode(points),
  transportMode: "walking",
  steps: [
    {
      instruction: "Head straight",
      distance,
      duration,
      maneuverType: "STRAIGHT",
      polyline: polyline.encode(points),
    },
  ],
});

describe("useRerouting", () => {
  const baseRoute = createRoute([
    [45.4973, -73.579],
    [45.498, -73.5785],
  ]);
  const reroutedRoute = createRoute(
    [
      [45.5, -73.57],
      [45.501, -73.5695],
    ],
    "900 m",
    "10 mins",
  );

  const resetStores = () => {
    useNavigationStore.setState({ navigationState: NAVIGATION_STATE.IDLE });
    useNavigationConfig.setState({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });
    useNavigationEndpointsStore.setState({ origin: null, destination: null });
    useNavigationInfo.setState({
      pathDistance: "0",
      pathDuration: "0",
      isLoading: false,
    });
    useNavigationProgress.setState({
      currentStepIndex: 0,
      distanceToNextStep: "",
    });
    useLocationStore.setState({
      currentLocation: null,
      currentSpeed: 0,
      currentHeading: null,
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    act(() => {
      resetStores();
    });
  });

  afterEach(() => {
    act(() => {
      jest.clearAllTimers();
      resetStores();
    });
    jest.useRealTimers();
  });

  it("reroutes automatically while staying on navigation screen", async () => {
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([
      reroutedRoute,
    ]);

    act(() => {
      useNavigationConfig.setState({
        navigationMode: "WALK",
        allOutdoorRoutes: [baseRoute],
      });
      useNavigationEndpointsStore.setState({
        destination: {
          latitude: 45.503,
          longitude: -73.567,
          label: "Destination",
        },
      });
      useLocationStore.setState({
        currentLocation: { latitude: 45.52, longitude: -73.55 },
      });
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATING,
      });
    });

    renderHook(() => useRerouting());

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(1);
    });

    expect(useNavigationEndpointsStore.getState().origin?.label).toBe(
      "Current Location",
    );
    expect(useNavigationInfo.getState().pathDistance).toBe("900 m");
    expect(useNavigationInfo.getState().pathDuration).toBe("10 mins");
  });

  it("does not get stuck after cooldown; reroutes again once cooldown passes", async () => {
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([
      reroutedRoute,
    ]);

    act(() => {
      useNavigationConfig.setState({
        navigationMode: "WALK",
        allOutdoorRoutes: [baseRoute],
      });
      useNavigationEndpointsStore.setState({
        destination: {
          latitude: 45.503,
          longitude: -73.567,
          label: "Destination",
        },
      });
      useLocationStore.setState({
        currentLocation: { latitude: 45.52, longitude: -73.55 },
      });
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATING,
      });
    });

    renderHook(() => useRerouting());

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(1);
    });

    act(() => {
      jest.advanceTimersByTime(20000);
    });
    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(2);
    });
  });

  it("resets off-route confirmation when user is back on route", async () => {
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([
      reroutedRoute,
    ]);

    act(() => {
      useNavigationConfig.setState({
        navigationMode: "WALK",
        allOutdoorRoutes: [baseRoute],
      });
      useNavigationEndpointsStore.setState({
        destination: {
          latitude: 45.503,
          longitude: -73.567,
          label: "Destination",
        },
      });
      useLocationStore.setState({
        currentLocation: { latitude: 45.52, longitude: -73.55 },
      });
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATING,
      });
    });

    renderHook(() => useRerouting());

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      useLocationStore.setState({
        currentLocation: { latitude: 45.4973, longitude: -73.579 },
      });
      jest.advanceTimersByTime(6000);
    });

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(0);
    });
  });

  it("does not reroute if destination is missing", async () => {
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([
      reroutedRoute,
    ]);

    act(() => {
      useNavigationConfig.setState({
        navigationMode: "WALK",
        allOutdoorRoutes: [baseRoute],
      });
      useLocationStore.setState({
        currentLocation: { latitude: 45.52, longitude: -73.55 },
      });
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATING,
      });
    });

    renderHook(() => useRerouting());

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(0);
    });
  });

  it("does not reroute when active mode route is missing", async () => {
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([
      reroutedRoute,
    ]);

    act(() => {
      useNavigationConfig.setState({
        navigationMode: "BIKE",
        allOutdoorRoutes: [baseRoute],
      });
      useNavigationEndpointsStore.setState({
        destination: {
          latitude: 45.503,
          longitude: -73.567,
          label: "Destination",
        },
      });
      useLocationStore.setState({
        currentLocation: { latitude: 45.52, longitude: -73.55 },
      });
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATING,
      });
    });

    renderHook(() => useRerouting());

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(0);
    });
  });

  it("handles reroute API failure and resets loading", async () => {
    (getAllOutdoorDirectionsInfo as jest.Mock).mockRejectedValue(
      new Error("network fail"),
    );
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    act(() => {
      useNavigationConfig.setState({
        navigationMode: "WALK",
        allOutdoorRoutes: [baseRoute],
      });
      useNavigationEndpointsStore.setState({
        destination: {
          latitude: 45.503,
          longitude: -73.567,
          label: "Destination",
        },
      });
      useLocationStore.setState({
        currentLocation: { latitude: 45.52, longitude: -73.55 },
      });
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATING,
      });
    });

    renderHook(() => useRerouting());

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(1);
    });
    expect(useNavigationInfo.getState().isLoading).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("supports route polyline fallback when steps are empty", async () => {
    const fallbackRoute: OutdoorDirectionResponse = {
      distance: "1.0 km",
      duration: "12 mins",
      polyline: polyline.encode([
        [45.4973, -73.579],
        [45.4982, -73.5784],
      ]),
      transportMode: "walking",
      steps: [],
    };
    (getAllOutdoorDirectionsInfo as jest.Mock).mockResolvedValue([
      reroutedRoute,
    ]);

    act(() => {
      useNavigationConfig.setState({
        navigationMode: "WALK",
        allOutdoorRoutes: [fallbackRoute],
      });
      useNavigationEndpointsStore.setState({
        destination: {
          latitude: 45.503,
          longitude: -73.567,
          label: "Destination",
        },
      });
      useLocationStore.setState({
        currentLocation: { latitude: 45.52, longitude: -73.55 },
      });
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATING,
      });
    });

    renderHook(() => useRerouting());

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(getAllOutdoorDirectionsInfo).toHaveBeenCalledTimes(1);
    });
  });
});
