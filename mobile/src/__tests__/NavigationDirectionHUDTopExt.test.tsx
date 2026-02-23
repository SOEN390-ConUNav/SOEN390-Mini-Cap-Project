import React from "react";
import { render } from "@testing-library/react-native";
import NavigationDirectionHUDTopExt from "../components/navigation-direction/NavigationDirectionHUDTopExt";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text testID="ion-icon">{name}</Text>;
  },
}));

describe("NavigationDirectionHUDTopExt", () => {
  it("returns null when no step is provided", () => {
    const { queryByTestId } = render(<NavigationDirectionHUDTopExt />);
    expect(queryByTestId("ion-icon")).toBeNull();
  });

  it("renders icon and street name from step instruction", () => {
    const { getByTestId, getByText } = render(
      <NavigationDirectionHUDTopExt
        step={{
          instruction: "Turn right onto Guy Street",
          distance: "50 m",
          duration: "1 min",
          maneuverType: "TURN_RIGHT",
          polyline: "",
        }}
      />,
    );

    expect(getByTestId("ion-icon").props.children).toBe("arrow-forward");
    expect(getByText("Guy Street")).toBeTruthy();
  });
});
