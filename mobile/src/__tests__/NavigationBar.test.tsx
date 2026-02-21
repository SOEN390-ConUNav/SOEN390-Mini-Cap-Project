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

jest.mock("../components/navigation-info/NavigationInfoTop", () => {
  const { Text } = require("react-native");
  return ({ destination }: { destination: string }) => (
    <Text testID="navigation-info-top">{destination}</Text>
  );
});

jest.mock("../components/navigation-info/NavigationInfoTopExt", () => {
  const { Text } = require("react-native");
  return ({ destination }: { destination: string }) => (
    <Text testID="navigation-info-top-ext">{destination}</Text>
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

  // ─── minimize state ──────────────────────────────

  it('renders NavigationInfoTopExt when state is "minimize"', () => {
    const { getByTestId, queryByTestId } = render(
      <NavigationBar {...baseProps} navigationInfoToggleState="minimize" />,
    );

    expect(getByTestId("navigation-info-top")).toBeTruthy();
    expect(queryByTestId("navigation-info-top-ext")).toBeNull();
  });

  // ─── maximize state ──────────────────────────────

  it('renders NavigationInfoTop when state is "maximize"', () => {
    const { getByTestId, queryByTestId } = render(
      <NavigationBar {...baseProps} navigationInfoToggleState="maximize" />,
    );

    expect(getByTestId("navigation-info-top-ext")).toBeTruthy();
    expect(queryByTestId("navigation-info-top")).toBeNull();
  });

  // ─── undefined state ─────────────────────────────

  it("renders neither component when toggleState is undefined", () => {
    const { queryByTestId } = render(<NavigationBar {...baseProps} />);

    expect(queryByTestId("navigation-info-top")).toBeNull();
    expect(queryByTestId("navigation-info-top-ext")).toBeNull();
  });
});
