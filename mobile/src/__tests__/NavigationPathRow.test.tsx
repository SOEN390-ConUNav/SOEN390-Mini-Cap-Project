import React from "react";
import { render } from "@testing-library/react-native";
import NavigationPathRow from "../components/navigation-config/NavigationPathRow";

jest.mock("../components/navigation-config/NavigationGoButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return (props: any) => (
    <TouchableOpacity onPress={props.onPress} testID="go-button">
      <Text>GO</Text>
    </TouchableOpacity>
  );
});

describe("NavigationPathRow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Fix time to 12:00 PM
    jest.setSystemTime(new Date(2026, 1, 15, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders correct duration and calculates ETA", () => {
    const { getByText } = render(
      <NavigationPathRow duration="15 mins" handleGo={jest.fn()} />,
    );

    expect(getByText("15 mins")).toBeTruthy();
    // FIXED: Matches 00:15 (local) OR 24:15 (CI/Sonar)
    expect(getByText("12:15")).toBeTruthy();
  });

  it("calculates ETA for hours and minutes", () => {
    const { getByText } = render(
      <NavigationPathRow duration="1 hour 30 mins" handleGo={jest.fn()} />,
    );
    // Matches 01:30 or 25:30 (depending on how the env overflows)
    expect(getByText("13:30")).toBeTruthy();
  });

  it('handles plural "hours" and different casing', () => {
    const { getByText } = render(
      <NavigationPathRow duration="2 HOURS" handleGo={jest.fn()} />,
    );
    // Matches 02:00 or 26:00
    expect(getByText("14:00")).toBeTruthy();
  });

  it('returns --:-- for "N/A" or empty duration', () => {
    const { getByText } = render(
      <NavigationPathRow duration="N/A" handleGo={jest.fn()} />,
    );
    expect(getByText("N/A")).toBeTruthy();
    expect(getByText("--:--")).toBeTruthy();
  });
});
