import React from "react";
import { act, render } from "@testing-library/react-native";
import DirectionPath from "../components/DirectionPath";
import {
  inferStyleFromInstruction,
  BURGUNDY,
  POLYLINE_STYLES,
} from "../utils/polylineStyles";
import useNavigationConfig from "../hooks/useNavigationConfig";
import polyline from "@mapbox/polyline";
import useNavigationState from "../hooks/useNavigationState";
import useLocationStore from "../hooks/useLocationStore";
import useNavigationProgress from "../hooks/useNavigationProgress";
import useNavigationInfo from "../hooks/useNavigationInfo";

// Mock hooks
jest.mock("../hooks/useNavigationConfig", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../hooks/useNavigationState", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../hooks/useLocationStore", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../hooks/useNavigationProgress", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../hooks/useNavigationInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock react-native-maps using standard Views to capture props easily
jest.mock("react-native-maps", () => {
  const { View } = require("react-native");
  return {
    Polyline: (props: any) => <View testID="Polyline" {...props} />,
    Marker: (props: any) => <View testID="Marker" {...props} />,
  };
});

// Mock Icons
jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return {
    Ionicons: () => <View testID="Ionicons" />,
  };
});

// Mock polyline decoder
jest.mock("@mapbox/polyline", () => ({
  decode: jest.fn(),
}));

jest.mock("../type", () => ({
  TRANSPORT_MODE_API_MAP: {
    WALK: "walking",
    WALKING: "walking",
    BUS: "transit",
    TRANSIT: "transit",
    BIKE: "bicycling",
    BICYCLING: "bicycling",
    SHUTTLE: "transit",
    CAR: "driving",
    DRIVING: "driving",
  },
}));

const mockUseNavigationConfig = useNavigationConfig as unknown as jest.Mock;
const mockUseNavigationState = useNavigationState as unknown as jest.Mock;
const mockUseLocationStore = useLocationStore as unknown as jest.Mock;
const mockUseNavigationProgress = useNavigationProgress as unknown as jest.Mock;
const mockUseNavigationInfo = useNavigationInfo as unknown as jest.Mock;
const mockDestination = { latitude: 45.4584, longitude: -73.6404 };
let configState: any;
let navState: any;
let locationState: any;
let progressState: any;
let navInfoState: any;

describe("DirectionPath", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    };
    navState = { isNavigating: false };
    locationState = { currentLocation: null, currentSpeed: 0 };
    progressState = {
      setCurrentStepIndex: jest.fn(),
      setDistanceToNextStep: jest.fn(),
      resetProgress: jest.fn(),
    };
    navInfoState = {
      setPathDistance: jest.fn(),
      setPathDuration: jest.fn(),
    };

    mockUseNavigationConfig.mockImplementation((selector: any) =>
      selector ? selector(configState) : configState,
    );
    mockUseNavigationState.mockImplementation((selector: any) =>
      selector ? selector(navState) : navState,
    );
    mockUseLocationStore.mockImplementation((selector: any) =>
      selector ? selector(locationState) : locationState,
    );
    mockUseNavigationProgress.mockImplementation((selector: any) =>
      selector ? selector(progressState) : progressState,
    );
    mockUseNavigationInfo.mockImplementation((selector: any) =>
      selector ? selector(navInfoState) : navInfoState,
    );

    (polyline.decode as jest.Mock).mockImplementation((encoded: string) => {
      if (encoded === "step1") return [[45.497, -73.579]];
      if (encoded === "step2") return [[45.498, -73.58]];
      if (encoded === "overview") return [[45.499, -73.581]];
      return [];
    });
  });

  it("renders no polylines when allOutdoorRoutes is empty", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    };

    const { queryAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(queryAllByTestId("Polyline")).toHaveLength(0);
  });

  it("renders no polylines when no route matches the navigation mode", () => {
    configState = {
      navigationMode: "BUS",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [{ polyline: "step1", instruction: "Walk to stop" }],
        },
      ],
    };

    const { queryAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(queryAllByTestId("Polyline")).toHaveLength(0);
  });

  it("renders one Polyline per step when steps are available", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [
            { polyline: "step1", instruction: "Head north" },
            { polyline: "step2", instruction: "Continue walking" },
          ],
        },
      ],
    };

    const { queryAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(queryAllByTestId("Polyline")).toHaveLength(2);
  });

  it("decodes polylines from each step correctly", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [
            { polyline: "step1", instruction: "Head north" },
            { polyline: "step2", instruction: "Turn left" },
          ],
        },
      ],
    };

    render(<DirectionPath destination={mockDestination} />);

    expect(polyline.decode).toHaveBeenCalledWith("step1");
    expect(polyline.decode).toHaveBeenCalledWith("step2");
  });

  it("applies WALK style (burgundy dotted) for walk mode steps", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [{ polyline: "step1", instruction: "Head north" }],
        },
      ],
    };

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.strokeColor).toBe("#800020");
    expect(polylines[0].props.lineDashPattern).toEqual([2, 5]);
  });

  it("applies BUS style (solid blue, no dash) for transit mode steps", () => {
    configState = {
      navigationMode: "BUS",
      allOutdoorRoutes: [
        {
          transportMode: "transit",
          steps: [{ polyline: "step1", instruction: "Take the 105 bus" }],
        },
      ],
    };

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.strokeColor).toBe("#0085CA");
    expect(polylines[0].props.lineDashPattern).toBeUndefined();
  });

  it("applies BIKE style (green dashed) for bike mode steps", () => {
    configState = {
      navigationMode: "BIKE",
      allOutdoorRoutes: [
        {
          transportMode: "bicycling",
          steps: [{ polyline: "step1", instruction: "Ride along path" }],
        },
      ],
    };

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.strokeColor).toBe("#228B22");
    expect(polylines[0].props.lineDashPattern).toEqual([10, 5]);
  });

  it("applies SHUTTLE style (solid burgundy) when instruction mentions shuttle", () => {
    configState = {
      navigationMode: "SHUTTLE",
      allOutdoorRoutes: [
        {
          transportMode: "transit",
          steps: [{ polyline: "step1", instruction: "Take the shuttle to EV" }],
        },
      ],
    };

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.strokeColor).toBe("#800020");
    expect(polylines[0].props.lineDashPattern).toBeUndefined();
  });

  it("infers WALK style when transit step instruction mentions walking", () => {
    configState = {
      navigationMode: "BUS",
      allOutdoorRoutes: [
        {
          transportMode: "transit",
          steps: [{ polyline: "step1", instruction: "Walk to the bus stop" }],
        },
      ],
    };

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    // "walk" in instruction → WALK style
    expect(polylines[0].props.strokeColor).toBe("#800020");
    expect(polylines[0].props.lineDashPattern).toEqual([2, 5]);
  });

  it("falls back to overview polyline when steps are missing", () => {
    configState = {
      navigationMode: "BUS",
      allOutdoorRoutes: [
        {
          transportMode: "transit",
          polyline: "overview",
        },
      ],
    };

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines).toHaveLength(1);
    expect(polyline.decode).toHaveBeenCalledWith("overview");
    expect(polylines[0].props.coordinates).toEqual([
      { latitude: 45.499, longitude: -73.581 },
    ]);
    // BUS overview mode → solid blue, no dash
    expect(polylines[0].props.strokeColor).toBe("#0085CA");
    expect(polylines[0].props.lineDashPattern).toBeUndefined();
  });

  it("falls back to WALK style for overview polyline with unknown mode", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          polyline: "overview",
        },
      ],
    };

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines).toHaveLength(1);
    expect(polylines[0].props.strokeColor).toBe("#800020");
    expect(polylines[0].props.lineDashPattern).toEqual([2, 5]);
  });

  it("renders no polylines when route has neither steps nor overview polyline", () => {
    configState = {
      navigationMode: "BIKE",
      allOutdoorRoutes: [
        {
          transportMode: "bicycling",
          // no steps, no polyline
        },
      ],
    };

    const { queryAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(queryAllByTestId("Polyline")).toHaveLength(0);
  });

  it("renders a Marker at the destination coordinate", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    };

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const marker = getByTestId("Marker");
    expect(marker.props.coordinate).toEqual(mockDestination);
  });

  it("renders Marker with correct anchor prop", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    };

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(getByTestId("Marker").props.anchor).toEqual({ x: 0.5, y: 1 });
  });

  it("does not render a Marker when destination is null", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    };

    const { queryByTestId } = render(<DirectionPath destination={null} />);

    expect(queryByTestId("Marker")).toBeNull();
  });

  it("applies strokeWidth of 3 to all polyline segments", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [
            { polyline: "step1", instruction: "Head north" },
            { polyline: "step2", instruction: "Turn left" },
          ],
        },
      ],
    };

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    getAllByTestId("Polyline").forEach((p) => {
      expect(p.props.strokeWidth).toBe(3);
    });
  });

  it("renders EndPin icon inside the Marker", () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    };

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(getByTestId("Ionicons")).toBeTruthy();
  });

  it("updates progress/path metrics while navigating and trims rendered path", async () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [
            { polyline: "stepA", instruction: "Head north" },
            { polyline: "stepB", instruction: "Turn right" },
          ],
        },
      ],
    };
    navState = { isNavigating: true };
    locationState = {
      currentLocation: { latitude: 45.4971, longitude: -73.5791 },
      currentSpeed: 1.6,
    };

    (polyline.decode as jest.Mock).mockImplementation((encoded: string) => {
      if (encoded === "stepA") {
        return [
          [45.497, -73.579],
          [45.4972, -73.5792],
        ];
      }
      if (encoded === "stepB") {
        return [
          [45.4975, -73.5794],
          [45.498, -73.58],
        ];
      }
      return [];
    });

    const { getAllByTestId, rerender } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(getAllByTestId("Polyline")).toHaveLength(2);

    locationState = {
      currentLocation: { latitude: 45.4975, longitude: -73.5794 },
      currentSpeed: 1.8,
    };

    await act(async () => {
      rerender(<DirectionPath destination={mockDestination} />);
    });

    expect(progressState.setDistanceToNextStep).toHaveBeenCalled();
    expect(progressState.setCurrentStepIndex).toHaveBeenCalled();
    expect(navInfoState.setPathDistance).toHaveBeenCalled();
    expect(navInfoState.setPathDuration).toHaveBeenCalled();

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.coordinates).toEqual([
      { latitude: 45.4975, longitude: -73.5794 },
      { latitude: 45.498, longitude: -73.58 },
    ]);
  });

  it("formats long remaining duration in hours when distance is large", async () => {
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [{ polyline: "longStep", instruction: "Keep going" }],
        },
      ],
    };
    navState = { isNavigating: true };
    locationState = {
      currentLocation: { latitude: 45.0, longitude: -73.0 },
      currentSpeed: 1,
    };

    (polyline.decode as jest.Mock).mockImplementation((encoded: string) => {
      if (encoded === "longStep") {
        return [
          [45.0, -73.0],
          [46.0, -73.0],
        ];
      }
      return [];
    });

    const { rerender } = render(
      <DirectionPath destination={mockDestination} />,
    );

    locationState = {
      currentLocation: { latitude: 45.0001, longitude: -73.0 },
      currentSpeed: 1,
    };

    await act(async () => {
      rerender(<DirectionPath destination={mockDestination} />);
    });

    const lastCallArg =
      navInfoState.setPathDuration.mock.calls[
        navInfoState.setPathDuration.mock.calls.length - 1
      ][0];
    expect(lastCallArg).toContain("hour");
  });

  it("toggles marker tracksViewChanges off after timer", () => {
    jest.useFakeTimers();
    configState = {
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    };

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(getByTestId("Marker").props.tracksViewChanges).toBe(true);

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(getByTestId("Marker").props.tracksViewChanges).toBe(false);
  });
});

describe("inferStyleFromInstruction - fallback lines", () => {
  // These tests use a generic instruction that doesn't trigger walk/shuttle/bus keyword detection
  const neutralInstruction = "proceed to the next stop";

  describe("SHUTTLE mode fallback", () => {
    it("returns SHUTTLE style when mode is SHUTTLE and instruction has no keywords", () => {
      const result = inferStyleFromInstruction(neutralInstruction, "SHUTTLE");
      expect(result).toEqual(POLYLINE_STYLES.SHUTTLE);
    });

    it("returns SHUTTLE style when mode is shuttle (lowercase)", () => {
      const result = inferStyleFromInstruction(neutralInstruction, "shuttle");
      expect(result).toEqual(POLYLINE_STYLES.SHUTTLE);
    });
  });

  describe("BUS / TRANSIT mode fallback", () => {
    it("returns BUS style when mode is BUS and instruction has no keywords", () => {
      const result = inferStyleFromInstruction(neutralInstruction, "BUS");
      expect(result).toEqual(POLYLINE_STYLES.BUS);
    });

    it("returns BUS style when mode is TRANSIT and instruction has no keywords", () => {
      const result = inferStyleFromInstruction(neutralInstruction, "TRANSIT");
      expect(result).toEqual(POLYLINE_STYLES.BUS);
    });

    it("returns BUS style when mode is transit (lowercase)", () => {
      const result = inferStyleFromInstruction(neutralInstruction, "transit");
      expect(result).toEqual(POLYLINE_STYLES.BUS);
    });
  });

  describe("final WALK fallback", () => {
    it("returns WALK style for an unrecognized mode with no matching instruction keywords", () => {
      const result = inferStyleFromInstruction(neutralInstruction, "UNKNOWN");
      expect(result).toEqual(POLYLINE_STYLES.WALK);
    });

    it("returns WALK style for an empty mode string", () => {
      const result = inferStyleFromInstruction(neutralInstruction, "");
      expect(result).toEqual(POLYLINE_STYLES.WALK);
    });
  });
});
