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

  it("renders steps without distance (omits meta text)", () => {
    // Covers step.distance falsy branch
    const noDistance = {
      ...routeData,
      steps: [{ ...routeData.steps[0], distance: "", duration: "" }],
    };
    const { getByText, queryByText } = render(
      <DirectionsPanel
        routeData={noDistance}
        visible={true}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Leave H8-843 and continue straight")).toBeTruthy();
    expect(queryByText("30m")).toBeNull();
  });

  it("renders elevator, stairs, and turn maneuver icons", () => {
    // Covers getIndoorManeuverIcon for ELEVATOR_UP, TURN_RIGHT
    const mixedManeuvers = {
      ...routeData,
      steps: [
        {
          instruction: "Take elevator up",
          distance: "0m",
          duration: "30s",
          floor: "8",
          maneuverType: "ELEVATOR_UP" as const,
        },
        {
          instruction: "Turn right",
          distance: "10m",
          duration: "10s",
          floor: "8",
          maneuverType: "TURN_RIGHT" as const,
        },
      ],
    };
    const { getByText } = render(
      <DirectionsPanel
        routeData={mixedManeuvers}
        visible={true}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Take elevator up")).toBeTruthy();
    expect(getByText("Turn right")).toBeTruthy();
  });

  it("renders TURN_AROUND, ESCALATOR, ENTER/EXIT maneuver icons", () => {
    const steps = [
      {
        instruction: "Turn around",
        distance: "0m",
        duration: "0s",
        floor: "8",
        maneuverType: "TURN_AROUND" as const,
      },
      {
        instruction: "Escalator up",
        distance: "0m",
        duration: "0s",
        floor: "8",
        maneuverType: "ESCALATOR_UP" as const,
      },
      {
        instruction: "Enter building",
        distance: "0m",
        duration: "0s",
        floor: "8",
        maneuverType: "ENTER_BUILDING" as const,
      },
      {
        instruction: "Exit building",
        distance: "0m",
        duration: "0s",
        floor: "8",
        maneuverType: "EXIT_BUILDING" as const,
      },
    ];
    const { getByText } = render(
      <DirectionsPanel
        routeData={{ ...routeData, steps }}
        visible={true}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Turn around")).toBeTruthy();
    expect(getByText("Escalator up")).toBeTruthy();
    expect(getByText("Enter building")).toBeTruthy();
    expect(getByText("Exit building")).toBeTruthy();
  });

  it("renders default icon for unknown maneuver type", () => {
    const steps = [
      {
        instruction: "Walk",
        distance: "10m",
        duration: "10s",
        floor: "8",
        maneuverType: "STRAIGHT" as const,
      },
    ];
    const { getByText } = render(
      <DirectionsPanel
        routeData={{ ...routeData, steps }}
        visible={true}
        onClose={mockOnClose}
      />,
    );
    expect(getByText("Walk")).toBeTruthy();
  });
});
