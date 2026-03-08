import React, { createRef } from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import FloorPlanWebView, {
  FloorPlanWebViewRef,
} from "../components/FloorPlanWebView";

jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return {
    WebView: jest.fn((props) => <View testID="mock-webview" {...props} />),
  };
});

jest.mock("expo-asset", () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest
        .fn()
        .mockResolvedValue({ localUri: "file://dummy/path.svg" }),
    })),
  },
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve('<svg viewBox="0 0 100 100"><g></g></svg>'),
  }),
) as jest.Mock;

describe("FloorPlanWebView Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the loading state initially", () => {
    const { getByText } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );

    expect(getByText("Loading floor plan...")).toBeTruthy();
  });

  it("loads the SVG and renders the WebView successfully", async () => {
    const { getByTestId, queryByText } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );

    await waitFor(() => {
      expect(queryByText("Loading floor plan...")).toBeNull();
      expect(getByTestId("mock-webview")).toBeTruthy();
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it("exposes imperative handle methods via ref", async () => {
    const ref = createRef<FloorPlanWebViewRef>();
    render(<FloorPlanWebView ref={ref} buildingId="H" floorNumber="8" />);

    await waitFor(() => {
      expect(ref.current).toBeTruthy();
    });

    expect(typeof ref.current?.drawRoute).toBe("function");
    expect(typeof ref.current?.clearRoute).toBe("function");
    expect(typeof ref.current?.showWaypoints).toBe("function");
    expect(typeof ref.current?.hideWaypoints).toBe("function");
    expect(typeof ref.current?.showRoomMarkers).toBe("function");
    expect(typeof ref.current?.hideRoomMarkers).toBe("function");
    expect(typeof ref.current?.showPois).toBe("function");
    expect(typeof ref.current?.hidePois).toBe("function");
  });

  it("handles WebView onMessage events without crashing", async () => {
    const mockOnPoiTap = jest.fn();
    const mockOnRoomTap = jest.fn();

    const { getByTestId } = render(
      <FloorPlanWebView
        buildingId="H"
        floorNumber="8"
        onPoiTap={mockOnPoiTap}
        onRoomTap={mockOnRoomTap}
      />,
    );

    await waitFor(() => {
      expect(getByTestId("mock-webview")).toBeTruthy();
    });

    const webView = getByTestId("mock-webview");

    act(() => {
      webView.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: "poiTap",
            poi: { id: "bath-1", type: "bathroom-men" },
          }),
        },
      });
    });

    expect(mockOnPoiTap).toHaveBeenCalledWith({
      id: "bath-1",
      type: "bathroom-men",
    });

    act(() => {
      webView.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: "roomTap", room: { id: "H8-843" } }),
        },
      });
    });

    expect(mockOnRoomTap).toHaveBeenCalledWith({ id: "H8-843" });
  });
});
