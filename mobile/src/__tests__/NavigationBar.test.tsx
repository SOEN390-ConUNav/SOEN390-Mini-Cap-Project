import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import NavigationBar from "../components/navigation-bar/NavigationBar";

jest.mock("../components/CircleIconButton", () => {
  const { Text } = require("react-native");
  return ({ onPress }: { onPress?: () => void }) => (
    <Text testID="back-button" onPress={onPress}>
      Back
    </Text>
  );
});

jest.mock("../components/navigation-info/NavigationInfoTopCombined", () => {
  const { Text } = require("react-native");
  return ({
    destination,
    showInfoExtended,
    showHudExtended,
    hudStep,
  }: {
    destination: string;
    showInfoExtended: boolean;
    showHudExtended: boolean;
    hudStep?: { instruction?: string };
  }) => (
    <Text testID="navigation-info-top-combined">
      {destination}:{showInfoExtended ? "expanded" : "collapsed"}:
      {showHudExtended ? (hudStep?.instruction ?? "hud-empty") : "no-hud"}
    </Text>
  );
});

describe("NavigationBar", () => {
  const baseProps = {
    destination: "Loyola Campus",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { root } = render(<NavigationBar {...baseProps} />);
    expect(root).toBeTruthy();
  });

  it("renders back button", () => {
    const { getByTestId } = render(<NavigationBar {...baseProps} />);
    expect(getByTestId("back-button")).toBeTruthy();
  });

  it("calls onPress when back button is pressed", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <NavigationBar {...baseProps} onPress={onPress} />,
    );

    fireEvent.press(getByTestId("back-button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders combined info in collapsed mode", () => {
    const { getByTestId, getByText } = render(
      <NavigationBar {...baseProps} navigationInfoToggleState="minimize" />,
    );

    expect(getByTestId("navigation-info-top-combined")).toBeTruthy();
    expect(getByText("Loyola Campus:collapsed:no-hud")).toBeTruthy();
  });

  it("renders combined info in expanded mode", () => {
    const { getByText } = render(
      <NavigationBar {...baseProps} navigationInfoToggleState="maximize" />,
    );

    expect(getByText("Loyola Campus:expanded:no-hud")).toBeTruthy();
  });

  it("hides back button while cancelling navigation", () => {
    const { queryByTestId } = render(
      <NavigationBar {...baseProps} isCancellingNavigation />,
    );
    expect(queryByTestId("back-button")).toBeNull();
  });

  it("passes HUD step into combined card when HUD should be shown", () => {
    const { getByText } = render(
      <NavigationBar
        {...baseProps}
        navigationInfoToggleState="minimize"
        navigationHUDToggleState="maximize"
        navigationHUDStep={
          { instruction: "Turn left onto Maisonneuve Street" } as any
        }
      />,
    );

    expect(
      getByText("Loyola Campus:collapsed:Turn left onto Maisonneuve Street"),
    ).toBeTruthy();
  });

  it("does not pass HUD step when info sheet is expanded", () => {
    const { getByText } = render(
      <NavigationBar
        {...baseProps}
        navigationInfoToggleState="maximize"
        navigationHUDToggleState="maximize"
        navigationHUDStep={
          { instruction: "Turn left onto Maisonneuve Street" } as any
        }
      />,
    );

    expect(getByText("Loyola Campus:expanded:no-hud")).toBeTruthy();
  });

  it("shows info ext and hud ext together while cancelling", () => {
    const { getByText } = render(
      <NavigationBar
        {...baseProps}
        isCancellingNavigation
        navigationInfoToggleState="minimize"
        navigationHUDToggleState="minimize"
        navigationHUDStep={
          { instruction: "Turn left onto Maisonneuve Street" } as any
        }
      />,
    );

    expect(
      getByText("Loyola Campus:expanded:Turn left onto Maisonneuve Street"),
    ).toBeTruthy();
  });
});
