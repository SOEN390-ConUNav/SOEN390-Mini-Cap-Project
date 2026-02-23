import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import NavigationDirectionHUDBottom from "../components/navigation-direction/NavigationDirectionHUDBottom";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

jest.mock("../components/BottomDrawer", () => {
  const { View } = require("react-native");
  return ({ children }: any) => <View>{children}</View>;
});

describe("NavigationDirectionHUDBottom", () => {
  const steps = [
    {
      instruction: "Turn left onto Maisonneuve Street",
      distance: "20 m",
      duration: "1 min",
      maneuverType: "TURN_LEFT",
      polyline: "",
    },
    {
      instruction: "Continue on Guy Street",
      distance: "80 m",
      duration: "2 min",
      maneuverType: "KEEP_RIGHT",
      polyline: "",
    },
  ] as any;

  it("returns null when there are no steps", () => {
    const { queryByText } = render(
      <NavigationDirectionHUDBottom visible steps={[]} />,
    );
    expect(queryByText("Hide steps")).toBeNull();
  });

  it("renders primary step and expanded list by default", () => {
    const { getByText } = render(
      <NavigationDirectionHUDBottom visible steps={steps} />,
    );
    expect(getByText("Turn left onto Maisonneuve Street")).toBeTruthy();
    expect(getByText("Hide steps")).toBeTruthy();
    expect(getByText("Continue on Guy Street")).toBeTruthy();
  });

  it("toggles remaining steps visibility", () => {
    const { getByText, queryByText } = render(
      <NavigationDirectionHUDBottom visible steps={steps} />,
    );

    fireEvent.press(getByText("Hide steps"));
    expect(queryByText("Continue on Guy Street")).toBeNull();
    expect(getByText("1 more step")).toBeTruthy();
  });
});
