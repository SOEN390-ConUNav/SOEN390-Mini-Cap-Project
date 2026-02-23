import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import NavigationCancelButton from "../components/navigation-cancel/NavigationCancelButton";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text testID="icon">{name}</Text>;
  },
}));

describe("NavigationCancelButton", () => {
  it("renders and handles press", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <NavigationCancelButton icon="close" onPress={onPress} />,
    );

    fireEvent.press(getByTestId("icon").parent as any);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders the provided icon", () => {
    const { getByTestId } = render(
      <NavigationCancelButton icon="settings-outline" onPress={() => {}} />,
    );

    expect(getByTestId("icon").props.children).toBe("settings-outline");
  });
});
