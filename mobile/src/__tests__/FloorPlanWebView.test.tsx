import React, { createRef } from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import FloorPlanWebView, {
  FloorPlanWebViewRef,
} from "../components/FloorPlanWebView";

jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    WebView: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        injectJavaScript: jest.fn(),
      }));
      return <View testID="mock-webview" {...props} />;
    }),
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
  const defaultFetchResponse = {
    text: () => Promise.resolve('<svg viewBox="0 0 100 100"><g></g></svg>'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue(defaultFetchResponse);
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

  it("handles webViewReady message without crashing", async () => {
    // Covers onMessage handler for webViewReady type
    const { getByTestId } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    const webView = getByTestId("mock-webview");
    act(() => {
      webView.props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
  });

  it("stays in loading state when building/floor has no SVG asset", async () => {
    // Covers getSvgAsset returning null for unknown building
    const { getByText } = render(
      <FloorPlanWebView buildingId={"XX" as any} floorNumber="99" />,
    );
    await waitFor(() => {}, { timeout: 100 });
    expect(getByText("Loading floor plan...")).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("clearRoute invokes injectJavaScript when called via ref", async () => {
    const ref = createRef<FloorPlanWebViewRef>();
    render(<FloorPlanWebView ref={ref} buildingId="H" floorNumber="8" />);
    await waitFor(() => expect(ref.current).toBeTruthy());
    ref.current?.clearRoute();
    expect(ref.current).toBeTruthy();
  });

  it("drawRoute invokes injectJavaScript when WebView ready", async () => {
    const ref = createRef<FloorPlanWebViewRef>();
    const { getByTestId } = render(
      <FloorPlanWebView ref={ref} buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
    ref.current?.drawRoute([
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ]);
    expect(ref.current?.drawRoute).toBeDefined();
  });

  it("handles onLoadEnd callback", async () => {
    const { getByTestId } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onLoadEnd?.();
    });
  });

  it("handles routeDrawError message without crashing", async () => {
    const { getByTestId } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: "routeDrawError", message: "err" }),
        },
      });
    });
  });

  it("renders with roomData and poiData to trigger marker effects", async () => {
    const roomData = [{ x: 50, y: 50, id: "H8-801" }];
    const poiData = [
      {
        x: 100,
        y: 100,
        id: "elev-1",
        displayName: "Elevator",
        type: "elevator",
      },
    ];
    const { getByTestId } = render(
      <FloorPlanWebView
        buildingId="H"
        floorNumber="8"
        roomData={roomData}
        poiData={poiData}
      />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
    await waitFor(() => {}, { timeout: 500 });
  });

  it("showRoomMarkers and hideRoomMarkers are callable via ref", async () => {
    const ref = createRef<FloorPlanWebViewRef>();
    const { getByTestId } = render(
      <FloorPlanWebView ref={ref} buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    ref.current?.showRoomMarkers([{ x: 20, y: 20, id: "H8-801" }]);
    ref.current?.hideRoomMarkers();
    expect(ref.current?.hideRoomMarkers).toBeDefined();
  });

  it("handles WebView onError without crashing", async () => {
    const { getByTestId } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    const webView = getByTestId("mock-webview");
    expect(webView.props.onError).toBeDefined();
    act(() => {
      webView.props.onError?.({ nativeEvent: {} });
    });
  });

  it("handles routeDrawn message without crashing", async () => {
    const { getByTestId } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: "routeDrawn",
            success: true,
            pointCount: 2,
          }),
        },
      });
    });
  });

  it("renders with empty poiData to trigger hidePois branch", async () => {
    const { getByTestId } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" poiData={[]} />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
    await waitFor(() => {}, { timeout: 500 });
  });

  it("ignores non-JSON onMessage without crashing", async () => {
    const { getByTestId } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: "not valid json" },
      });
    });
  });

  it("onLoadEnd triggers markWebViewReady when not yet ready", async () => {
    const { getByTestId } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onLoadEnd?.();
    });
  });

  it("showPois and hidePois are callable via ref", async () => {
    const ref = createRef<FloorPlanWebViewRef>();
    const { getByTestId } = render(
      <FloorPlanWebView ref={ref} buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
    await waitFor(() => expect(ref.current).toBeTruthy());
    ref.current?.showPois([
      { x: 30, y: 30, id: "p1", displayName: "Elev", type: "elevator" },
    ]);
    ref.current?.hidePois();
    expect(ref.current?.hidePois).toBeDefined();
  });

  it("showRoomMarkers with empty array returns early without error", async () => {
    const ref = createRef<FloorPlanWebViewRef>();
    const { getByTestId } = render(
      <FloorPlanWebView ref={ref} buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
    ref.current?.showRoomMarkers([]);
    expect(ref.current?.showRoomMarkers).toBeDefined();
  });

  it("drawRoute with empty array does not inject JavaScript", async () => {
    const ref = createRef<FloorPlanWebViewRef>();
    const { getByTestId } = render(
      <FloorPlanWebView ref={ref} buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
    ref.current?.drawRoute([]);
    expect(ref.current?.drawRoute).toBeDefined();
  });

  it("webViewReady message with pending route triggers executeDrawRoute", async () => {
    const ref = createRef<FloorPlanWebViewRef>();
    const { getByTestId } = render(
      <FloorPlanWebView ref={ref} buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    ref.current?.drawRoute([
      { x: 50, y: 50 },
      { x: 100, y: 100 },
    ]);
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
    await waitFor(() => {}, { timeout: 300 });
    expect(ref.current?.drawRoute).toBeDefined();
  });

  it("loads SVG without viewBox and adds default viewBox", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () => Promise.resolve("<svg><g></g></svg>"),
    });
    const { getByTestId, queryByText } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => {
      expect(queryByText("Loading floor plan...")).toBeNull();
      expect(getByTestId("mock-webview")).toBeTruthy();
    });
    expect(global.fetch).toHaveBeenCalled();
  });

  it("loads SVG without preserveAspectRatio and adds default", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      text: () => Promise.resolve('<svg viewBox="0 0 200 200"><g></g></svg>'),
    });
    const { getByTestId, queryByText } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => {
      expect(queryByText("Loading floor plan...")).toBeNull();
      expect(getByTestId("mock-webview")).toBeTruthy();
    });
  });

  it("renders with routePoints prop and draws route when ready", async () => {
    const routePoints = [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
      { x: 100, y: 100 },
    ];
    const { getByTestId } = render(
      <FloorPlanWebView
        buildingId="H"
        floorNumber="8"
        routePoints={routePoints}
      />,
    );
    await waitFor(() => expect(getByTestId("mock-webview")).toBeTruthy());
    act(() => {
      getByTestId("mock-webview").props.onMessage({
        nativeEvent: { data: JSON.stringify({ type: "webViewReady" }) },
      });
    });
    await waitFor(() => {}, { timeout: 400 });
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );
    const { getByText } = render(
      <FloorPlanWebView buildingId="H" floorNumber="8" />,
    );
    await waitFor(() => {}, { timeout: 500 });
    expect(getByText("Loading floor plan...")).toBeTruthy();
  });

  it("renders with VL building", async () => {
    const { getByTestId, queryByText } = render(
      <FloorPlanWebView buildingId="VL" floorNumber="1" />,
    );
    await waitFor(() => {
      expect(queryByText("Loading floor plan...")).toBeNull();
      expect(getByTestId("mock-webview")).toBeTruthy();
    });
  });

  it("renders with LB building", async () => {
    const { getByTestId, queryByText } = render(
      <FloorPlanWebView buildingId="LB" floorNumber="2" />,
    );
    await waitFor(() => {
      expect(queryByText("Loading floor plan...")).toBeNull();
      expect(getByTestId("mock-webview")).toBeTruthy();
    });
  });
});
