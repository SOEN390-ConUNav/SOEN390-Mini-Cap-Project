import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import BottomPanel from "../components/BottomPanel";
import { OutdoorDirectionResponse } from "../api/outdoorDirectionsApi";
import { IndoorDirectionResponse } from "../types/indoorDirections";

jest.mock("../components/navigation-config/NavigationTransportCard", () => {
  const { Text, TouchableOpacity } = require("react-native");

  return ({ mode, duration, onSelect }: any) => (
    <TouchableOpacity onPress={onSelect} testID={`transport-${mode}`}>
      <Text>{`${mode}: ${duration === "" ? "[empty]" : duration}`}</Text>
    </TouchableOpacity>
  );
});

describe("BottomPanel", () => {
  const onToggleDirections = jest.fn();
  const onTransportModeChange = jest.fn();

  const routeData: IndoorDirectionResponse = {
    distance: "25m",
    duration: "2 min",
    buildingName: "Hall Building",
    buildingId: "Hall-8",
    startFloor: "8",
    endFloor: "8",
    steps: [
      {
        instruction: "Head straight",
        distance: "10m",
        duration: "1 min",
        maneuverType: "STRAIGHT" as const,
      },
    ],
    polyline: "",
    routePoints: [{ x: 10, y: 10 }],
    stairMessage: null,
  };

  const baseProps = {
    startRoom: "",
    endRoom: "",
    routeData: null as IndoorDirectionResponse | null,
    isLoadingRoute: false,
    showDirections: false,
    onToggleDirections,
    selectedTransportMode: "WALK" as const,
    onTransportModeChange,
    outdoorRoutes: [],
    nextShuttleTime: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows default guidance when no rooms are selected", () => {
    const { getByText } = render(<BottomPanel {...baseProps} />);
    expect(
      getByText("Select a starting point and destination above"),
    ).toBeTruthy();
  });

  it("shows destination prompt when only start room is set", () => {
    const { getByText } = render(
      <BottomPanel {...baseProps} startRoom="H-801" />,
    );
    expect(getByText("Select a destination")).toBeTruthy();
  });

  it("shows route loading prompt when waiting for route", () => {
    const { getByText } = render(
      <BottomPanel
        {...baseProps}
        startRoom="H-801"
        endRoom="H-820"
        isLoadingRoute={true}
      />,
    );
    expect(getByText("Finding route...")).toBeTruthy();
  });

  it("renders route summary and toggles directions", () => {
    const { getByText } = render(
      <BottomPanel
        {...baseProps}
        startRoom="H-801"
        endRoom="H-820"
        routeData={routeData}
      />,
    );

    expect(getByText("From")).toBeTruthy();
    expect(getByText("To")).toBeTruthy();
    fireEvent.press(getByText("Show Directions"));
    expect(onToggleDirections).toHaveBeenCalledTimes(1);
  });

  it("maps outdoor route durations for each transport card and uses N/A for shuttle", () => {
    const outdoorRoutes: OutdoorDirectionResponse[] = [
      {
        transportMode: "walking",
        duration: "10 mins",
        distance: "1km",
        polyline: "",
        steps: [],
      },
      {
        transportMode: "bicycling",
        duration: "5 mins",
        distance: "1km",
        polyline: "",
        steps: [],
      },
      {
        transportMode: "transit",
        duration: "15 mins",
        distance: "5km",
        polyline: "",
        steps: [],
      },
      {
        transportMode: "driving",
        duration: "7 mins",
        distance: "2km",
        polyline: "",
        steps: [],
      },
    ];

    const { getByText, getByTestId } = render(
      <BottomPanel
        {...baseProps}
        startRoom="H-801"
        endRoom="H-820"
        routeData={routeData}
        outdoorRoutes={outdoorRoutes}
      />,
    );

    expect(getByText("WALK: 10 mins")).toBeTruthy();
    expect(getByText("BIKE: 5 mins")).toBeTruthy();
    expect(getByText("BUS: 15 mins")).toBeTruthy();
    expect(getByText("CAR: 7 mins")).toBeTruthy();
    expect(getByText("SHUTTLE: N/A")).toBeTruthy();

    fireEvent.press(getByTestId("transport-BIKE"));
    expect(onTransportModeChange).toHaveBeenCalledWith("BIKE");
  });

  it("passes an empty duration when no outdoor route matches a non-shuttle mode", () => {
    const outdoorRoutes: OutdoorDirectionResponse[] = [
      {
        transportMode: "walking",
        duration: "10 mins",
        distance: "1km",
        polyline: "",
        steps: [],
      },
    ];

    const { getByText } = render(
      <BottomPanel
        {...baseProps}
        startRoom="H-801"
        endRoom="H-820"
        routeData={routeData}
        outdoorRoutes={outdoorRoutes}
        nextShuttleTime="09:45"
      />,
    );

    expect(getByText("WALK: 10 mins")).toBeTruthy();
    expect(getByText("BIKE: [empty]")).toBeTruthy();
    expect(getByText("BUS: [empty]")).toBeTruthy();
    expect(getByText("CAR: [empty]")).toBeTruthy();
    expect(getByText("SHUTTLE: N/A")).toBeTruthy();
  });
});
