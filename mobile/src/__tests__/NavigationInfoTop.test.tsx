import React from "react";
import { render } from "@testing-library/react-native";
import NavigationInfoTop from "../components/navigation-info/NavigationInfoTop";

jest.mock("@expo/vector-icons", () => {
  return {
    MaterialIcons: ({ name, size, color }: any) => {
      const { Text } = require("react-native");
      return <Text testID="icon">{name}</Text>;
    },
  };
});

describe("NavigationInfoTop", () => {
  const baseProps = {
    destination: "Loyola Campus",
  };

  it("renders without crashing", () => {
    const { root } = render(<NavigationInfoTop {...baseProps} />);
    expect(root).toBeTruthy();
  });

  it("renders the destination text", () => {
    const { getByText } = render(<NavigationInfoTop {...baseProps} />);
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("renders the place icon", () => {
    const { getByTestId } = render(<NavigationInfoTop {...baseProps} />);
    expect(getByTestId("icon")).toBeTruthy();
    expect(getByTestId("icon").props.children).toBe("place");
  });
});
