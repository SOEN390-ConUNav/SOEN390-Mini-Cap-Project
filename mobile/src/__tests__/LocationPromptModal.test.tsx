import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { BUILDINGS } from "../data/buildings";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text>{name}</Text>;
  },
}));

import LocationPromptModal from "../components/LocationPromptModal";

describe("LocationPromptModal", () => {
  const building = BUILDINGS[0];

  it("renders building prompt when visible", () => {
    const { getByText } = render(
      <LocationPromptModal
        visible={true}
        building={building}
        onSelectInside={jest.fn()}
        onSelectOutside={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(getByText("Where are you?")).toBeTruthy();
    expect(getByText(building.name)).toBeTruthy();
    expect(getByText("Inside Building")).toBeTruthy();
    expect(getByText("Outside")).toBeTruthy();
  });

  it("calls callbacks for actions", () => {
    const onSelectInside = jest.fn();
    const onSelectOutside = jest.fn();
    const onClose = jest.fn();

    const { getByText } = render(
      <LocationPromptModal
        visible={true}
        building={building}
        onSelectInside={onSelectInside}
        onSelectOutside={onSelectOutside}
        onClose={onClose}
      />,
    );

    fireEvent.press(getByText("Inside Building"));
    fireEvent.press(getByText("Outside"));
    fireEvent.press(getByText("close"));

    expect(onSelectInside).toHaveBeenCalledTimes(1);
    expect(onSelectOutside).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
