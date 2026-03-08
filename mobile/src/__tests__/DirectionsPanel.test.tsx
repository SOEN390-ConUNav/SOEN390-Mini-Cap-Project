import React from "react";
import { render } from "@testing-library/react-native";
import DirectionsPanel from "../components/DirectionsPanel";
import { IndoorDirectionResponse } from "../types/indoorDirections";

jest.mock("../components/BottomDrawer", () => {
  const { View } = require("react-native");
  return (props: any) => {
    if (!props.visible) return null;
    return <View testID="mock-drawer">{props.children}</View>;
  };
});

describe("DirectionsPanel", () => {
  const mockOnClose = jest.fn();

  const routeData: IndoorDirectionResponse = {
    distance: "120m",
    duration: "2 min",
    buildingName: "Hall Building",
    buildingId: "Hall-8",
    startFloor: "8",
    endFloor: "8",
    steps: [
      {
        instruction: "Leave H8-843 and continue straight",
        distance: "30m",
        duration: "30s",
        floor: "8",
        maneuverType: "STRAIGHT",
      },
      {
        instruction: "Turn left",
        distance: "20m",
        duration: "20s",
        floor: "8",
        maneuverType: "TURN_LEFT",
      },
      {
        instruction: "Arrive at H8-807",
        distance: "",
        duration: "",
        floor: "8",
        maneuverType: "ENTER_ROOM",
        roomNumber: "H8-807",
      },
    ],
    polyline: "",
    routePoints: [],
  };

  beforeEach(() => jest.clearAllMocks());

  it("returns null when routeData is null", () => {
    const { toJSON } = render(
      <DirectionsPanel routeData={null} visible={true} onClose={mockOnClose} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("returns null when steps array is empty", () => {
    const empty = { ...routeData, steps: [] };
    const { toJSON } = render(
      <DirectionsPanel
        routeData={empty}
        visible={true}
        onClose={mockOnClose}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("returns null when not visible", () => {
    const { toJSON } = render(
      <DirectionsPanel
        routeData={routeData}
        visible={false}
        onClose={mockOnClose}
      />,
    );
    expect(toJSON()).toBeNull();
  });

  it("renders the first step as the primary highlighted card with distance only", () => {
    const { getByText, queryByText } = render(
      <DirectionsPanel
        routeData={routeData}
        visible={true}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Leave H8-843 and continue straight")).toBeTruthy();
    expect(getByText("30m")).toBeTruthy();
    expect(queryByText("30s")).toBeNull();
  });

  it("renders remaining steps below the primary card", () => {
    const { getByText } = render(
      <DirectionsPanel
        routeData={routeData}
        visible={true}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Turn left")).toBeTruthy();
    expect(getByText("20m")).toBeTruthy();
    expect(getByText("Arrive at H8-807")).toBeTruthy();
  });

  it("renders a single-step route with only the primary card", () => {
    const singleStep = {
      ...routeData,
      steps: [routeData.steps[0]],
    };
    const { getByText, queryByText } = render(
      <DirectionsPanel
        routeData={singleStep}
        visible={true}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Leave H8-843 and continue straight")).toBeTruthy();
    expect(queryByText("Turn left")).toBeNull();
  });
});
