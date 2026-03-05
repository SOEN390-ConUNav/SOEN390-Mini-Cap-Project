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

jest.mock("../hooks/useNavigationProgress", () => {
  const store = { distanceToNextStep: "" };
  return {
    __esModule: true,
    default: (selector: (s: typeof store) => any) => selector(store),
  };
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
    {
      instruction: "Turn right onto Sherbrooke Street",
      distance: "150 m",
      duration: "3 min",
      maneuverType: "TURN_RIGHT",
      polyline: "",
    },
  ] as any;

  it("returns null when there are no steps", () => {
    const { queryByText } = render(
      <NavigationDirectionHUDBottom visible steps={[]} />,
    );
    expect(queryByText("Hide steps")).toBeNull();
  });

  it("shows upcoming maneuver as primary card with current step distance", () => {
    const { getByText } = render(
      <NavigationDirectionHUDBottom visible steps={steps} />,
    );
    expect(getByText("Continue on Guy Street")).toBeTruthy();
    expect(getByText("20 m")).toBeTruthy();
  });

  it("renders later steps in the expanded list", () => {
    const { getByText } = render(
      <NavigationDirectionHUDBottom visible steps={steps} />,
    );
    expect(getByText("Hide steps")).toBeTruthy();
    expect(getByText("Turn right onto Sherbrooke Street")).toBeTruthy();
  });

  it("toggles later steps visibility", () => {
    const { getByText, queryByText } = render(
      <NavigationDirectionHUDBottom visible steps={steps} />,
    );

    fireEvent.press(getByText("Hide steps"));
    expect(queryByText("Turn right onto Sherbrooke Street")).toBeNull();
    expect(getByText("1 more step")).toBeTruthy();
  });

  it("falls back to current step instruction on last step", () => {
    const lastStep = [steps[0]] as any;
    const { getByText } = render(
      <NavigationDirectionHUDBottom visible steps={lastStep} />,
    );
    expect(getByText("Turn left onto Maisonneuve Street")).toBeTruthy();
  });
});
