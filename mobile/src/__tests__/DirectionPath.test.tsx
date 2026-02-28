import React from "react";
import { render } from "@testing-library/react-native";
import DirectionPath from "../components/DirectionPath";
import useNavigationConfig from "../hooks/useNavigationConfig";
import polyline from "@mapbox/polyline";

// Mock hooks
jest.mock("../hooks/useNavigationConfig", () => ({
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
const mockDestination = { latitude: 45.4584, longitude: -73.6404 };

describe("DirectionPath", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (polyline.decode as jest.Mock).mockImplementation((encoded: string) => {
      if (encoded === "step1") return [[45.497, -73.579]];
      if (encoded === "step2") return [[45.498, -73.58]];
      if (encoded === "overview") return [[45.499, -73.581]];
      return [];
    });
  });

  it("renders no polylines when allOutdoorRoutes is empty", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });

    const { queryAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(queryAllByTestId("Polyline")).toHaveLength(0);
  });

  it("renders no polylines when no route matches the navigation mode", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "BUS",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [{ polyline: "step1", instruction: "Walk to stop" }],
        },
      ],
    });

    const { queryAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(queryAllByTestId("Polyline")).toHaveLength(0);
  });

  it("renders one Polyline per step when steps are available", () => {
    mockUseNavigationConfig.mockReturnValue({
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
    });

    const { queryAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(queryAllByTestId("Polyline")).toHaveLength(2);
  });

  it("decodes polylines from each step correctly", () => {
    mockUseNavigationConfig.mockReturnValue({
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
    });

    render(<DirectionPath destination={mockDestination} />);

    expect(polyline.decode).toHaveBeenCalledWith("step1");
    expect(polyline.decode).toHaveBeenCalledWith("step2");
  });

  it("applies WALK style (burgundy dotted) for walk mode steps", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [{ polyline: "step1", instruction: "Head north" }],
        },
      ],
    });

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.strokeColor).toBe("#800020");
    expect(polylines[0].props.lineDashPattern).toEqual([2, 5]);
  });

  it("applies BUS style (solid blue, no dash) for transit mode steps", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "BUS",
      allOutdoorRoutes: [
        {
          transportMode: "transit",
          steps: [{ polyline: "step1", instruction: "Take the 105 bus" }],
        },
      ],
    });

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.strokeColor).toBe("#0085CA");
    expect(polylines[0].props.lineDashPattern).toBeUndefined();
  });

  it("applies BIKE style (green dashed) for bike mode steps", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "BIKE",
      allOutdoorRoutes: [
        {
          transportMode: "bicycling",
          steps: [{ polyline: "step1", instruction: "Ride along path" }],
        },
      ],
    });

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.strokeColor).toBe("#228B22");
    expect(polylines[0].props.lineDashPattern).toEqual([10, 5]);
  });

  it("applies SHUTTLE style (solid burgundy) when instruction mentions shuttle", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "SHUTTLE",
      allOutdoorRoutes: [
        {
          transportMode: "transit",
          steps: [{ polyline: "step1", instruction: "Take the shuttle to EV" }],
        },
      ],
    });

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines[0].props.strokeColor).toBe("#800020");
    expect(polylines[0].props.lineDashPattern).toBeUndefined();
  });

  it("infers WALK style when transit step instruction mentions walking", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "BUS",
      allOutdoorRoutes: [
        {
          transportMode: "transit",
          steps: [{ polyline: "step1", instruction: "Walk to the bus stop" }],
        },
      ],
    });

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    // "walk" in instruction → WALK style
    expect(polylines[0].props.strokeColor).toBe("#800020");
    expect(polylines[0].props.lineDashPattern).toEqual([2, 5]);
  });

  it("falls back to overview polyline when steps are missing", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "BUS",
      allOutdoorRoutes: [
        {
          transportMode: "transit",
          polyline: "overview",
        },
      ],
    });

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
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          polyline: "overview",
        },
      ],
    });

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylines = getAllByTestId("Polyline");
    expect(polylines).toHaveLength(1);
    expect(polylines[0].props.strokeColor).toBe("#800020");
    expect(polylines[0].props.lineDashPattern).toEqual([2, 5]);
  });

  it("renders no polylines when route has neither steps nor overview polyline", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "BIKE",
      allOutdoorRoutes: [
        {
          transportMode: "bicycling",
          // no steps, no polyline
        },
      ],
    });

    const { queryAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(queryAllByTestId("Polyline")).toHaveLength(0);
  });

  it("renders a Marker at the destination coordinate", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const marker = getByTestId("Marker");
    expect(marker.props.coordinate).toEqual(mockDestination);
  });

  it("renders Marker with correct anchor prop", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(getByTestId("Marker").props.anchor).toEqual({ x: 0.5, y: 1 });
  });

  it("does not render a Marker when destination is null", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });

    const { queryByTestId } = render(<DirectionPath destination={null} />);

    expect(queryByTestId("Marker")).toBeNull();
  });

  it("applies strokeWidth of 3 to all polyline segments", () => {
    mockUseNavigationConfig.mockReturnValue({
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
    });

    const { getAllByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    getAllByTestId("Polyline").forEach((p) => {
      expect(p.props.strokeWidth).toBe(3);
    });
  });

  it("renders EndPin icon inside the Marker", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    expect(getByTestId("Ionicons")).toBeTruthy();
  });
});
