import React from "react";
import { render } from "@testing-library/react-native";
import NavigationInfoTopCombined from "../components/navigation-info/NavigationInfoTopCombined";
import useNavigationInfo from "../hooks/useNavigationInfo";

jest.mock("../hooks/useNavigationInfo", () => jest.fn());

jest.mock("@expo/vector-icons", () => {
  return {
    MaterialIcons: ({ name }: any) => {
      const { Text } = require("react-native");
      return <Text testID="icon">{name}</Text>;
    },
    Ionicons: ({ name }: any) => {
      const { Text } = require("react-native");
      return <Text testID="ion-icon">{name}</Text>;
    },
  };
});

describe("NavigationInfoTop (collapsed)", () => {
  const baseProps = {
    destination: "Loyola Campus",
    showInfoExtended: false,
    showHudExtended: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigationInfo as unknown as jest.Mock).mockImplementation((selector) =>
      selector({ pathDistance: "2.5 km", pathDuration: "10 min" }),
    );
  });

  it("renders without crashing", () => {
    const { root } = render(<NavigationInfoTopCombined {...baseProps} />);
    expect(root).toBeTruthy();
  });

  it("renders the destination text", () => {
    const { getByText } = render(<NavigationInfoTopCombined {...baseProps} />);
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("renders the place icon", () => {
    const { getByTestId } = render(
      <NavigationInfoTopCombined {...baseProps} />,
    );
    expect(getByTestId("icon")).toBeTruthy();
    expect(getByTestId("icon").props.children).toBe("place");
  });
});
