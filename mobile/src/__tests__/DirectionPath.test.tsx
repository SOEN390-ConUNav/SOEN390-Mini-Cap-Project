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

// Mock TRANSPORT_MODE_API_MAP based on standard usage
// (Adjust these mappings if your ../type file defines them differently)
jest.mock("../type", () => ({
  TRANSPORT_MODE_API_MAP: {
    WALK: "walking",
    BUS: "transit",
    BIKE: "bicycling",
    SHUTTLE: "transit",
  },
}));

const mockUseNavigationConfig = useNavigationConfig as unknown as jest.Mock;
const mockDestination = { latitude: 45.4584, longitude: -73.6404 };

describe("DirectionPath", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup polyline mock returns
    (polyline.decode as jest.Mock).mockImplementation((encoded: string) => {
      if (encoded === "step1") return [[45.497, -73.579]];
      if (encoded === "step2") return [[45.498, -73.58]];
      if (encoded === "overview") return [[45.499, -73.581]];
      return [];
    });
  });

  it("renders empty polyline when no routes are available", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylineNode = getByTestId("Polyline");
    expect(polylineNode.props.coordinates).toEqual([]);
  });

  it("decodes and renders step-level polylines for the selected transport mode", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [
        {
          transportMode: "walking",
          steps: [{ polyline: "step1" }, { polyline: "step2" }],
        },
      ],
    });

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylineNode = getByTestId("Polyline");

    expect(polyline.decode).toHaveBeenCalledWith("step1");
    expect(polyline.decode).toHaveBeenCalledWith("step2");
    expect(polylineNode.props.coordinates).toEqual([
      { latitude: 45.497, longitude: -73.579 },
      { latitude: 45.498, longitude: -73.58 },
    ]);

    // Verify dashed line style for WALK mode
    expect(polylineNode.props.lineDashPattern).toEqual([5, 5]);
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

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylineNode = getByTestId("Polyline");

    expect(polyline.decode).toHaveBeenCalledWith("overview");
    expect(polylineNode.props.coordinates).toEqual([
      { latitude: 45.499, longitude: -73.581 },
    ]);

    // BUS mode should not have dashed lines
    expect(polylineNode.props.lineDashPattern).toBeUndefined();
  });

  it("renders a marker at the destination", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const markerNode = getByTestId("Marker");
    expect(markerNode.props.coordinate).toEqual(mockDestination);
  });

  it("does not render a marker if destination is not provided", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "WALK",
      allOutdoorRoutes: [],
    });

    const { queryByTestId } = render(<DirectionPath destination={null} />);

    expect(queryByTestId("Marker")).toBeNull();
  });

  it("handles a valid matching mode but missing polyline gracefully", () => {
    mockUseNavigationConfig.mockReturnValue({
      navigationMode: "BIKE",
      allOutdoorRoutes: [
        {
          transportMode: "bicycling",
          // Empty object without steps or polyline
        },
      ],
    });

    const { getByTestId } = render(
      <DirectionPath destination={mockDestination} />,
    );

    const polylineNode = getByTestId("Polyline");
    expect(polylineNode.props.coordinates).toEqual([]);
  });
});
