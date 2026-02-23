import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import NavigationCancelBottom from "../components/navigation-cancel/NavigationCancelBottom";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

describe("NavigationCancelBottom", () => {
  it("renders cancel label", () => {
    const { getByText } = render(
      <NavigationCancelBottom
        onOpenSettings={() => {}}
        onConfirmCancel={() => {}}
        onResumeNavigation={() => {}}
      />,
    );

    expect(getByText("Cancel trip")).toBeTruthy();
  });

  it("triggers callbacks from all three buttons", () => {
    const onOpenSettings = jest.fn();
    const onConfirmCancel = jest.fn();
    const onResumeNavigation = jest.fn();

    fireEvent.press(getByTestId("settings-button"));
    fireEvent.press(getByTestId("cancel-button"));
    fireEvent.press(getByTestId("resume-button"));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(onConfirmCancel).toHaveBeenCalledTimes(1);
    expect(onResumeNavigation).toHaveBeenCalledTimes(1);
  });
});
