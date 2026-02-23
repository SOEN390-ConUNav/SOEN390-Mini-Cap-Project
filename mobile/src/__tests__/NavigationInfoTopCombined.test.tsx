import React from "react";
import { render } from "@testing-library/react-native";
import NavigationInfoTopCombined from "../components/navigation-info/NavigationInfoTopCombined";
import useNavigationInfo from "../hooks/useNavigationInfo";

jest.mock("../hooks/useNavigationInfo", () => jest.fn());

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text testID="material-icon">{name}</Text>;
  },
  Ionicons: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text testID="ion-icon">{name}</Text>;
  },
}));

describe("NavigationInfoTopCombined", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigationInfo as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        pathDistance: "0.92km",
        pathDuration: "10 min",
      }),
    );
  });

  it("renders destination and collapsed state content", () => {
    const { getByText, queryByText } = render(
      <NavigationInfoTopCombined
        destination="Station Guy-Concordia"
        showInfoExtended={false}
        showHudExtended={false}
      />,
    );

    expect(getByText("Station Guy-Concordia")).toBeTruthy();
    expect(queryByText("Arriving at")).toBeNull();
    expect(queryByText("Distance")).toBeNull();
  });

  it("renders extended info when enabled", () => {
    const { getByText } = render(
      <NavigationInfoTopCombined
        destination="Station Guy-Concordia"
        showInfoExtended
        showHudExtended={false}
      />,
    );

    expect(getByText("Arriving at")).toBeTruthy();
    expect(getByText("Distance")).toBeTruthy();
    expect(getByText("0.92km")).toBeTruthy();
  });

  it("renders hud strip with shortened street label when enabled", () => {
    const { getByText, getByTestId } = render(
      <NavigationInfoTopCombined
        destination="Station Guy-Concordia"
        showInfoExtended={false}
        showHudExtended
        hudStep={{
          instruction: "Turn left onto Maisonneuve Street",
          distance: "20 m",
          duration: "1 min",
          maneuverType: "TURN_LEFT",
          polyline: "",
        }}
      />,
    );

    expect(getByText("Maisonneuve Street")).toBeTruthy();
    expect(getByTestId("ion-icon").props.children).toBe("arrow-back");
  });
});
