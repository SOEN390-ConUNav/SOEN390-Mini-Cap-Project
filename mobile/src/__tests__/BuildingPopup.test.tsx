import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BuildingPopup from "../components/BuildingPopup";

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      background: "#fff",
      card: "#fff",
      text: "#111",
      textMuted: "#666",
      primary: "#800020",
      border: "#ccc",
    },
  }),
}));

jest.mock("../hooks/useAccessibilitySettings", () => ({
  useAccessibilitySettings: () => ({
    fontSize: "medium" as const,
    fontWeight: "regular" as const,
  }),
  getFontScale: () => 1,
  getFontWeightValue: () => "500" as const,
  useAccessibleTypography: () => ({
    fontScale: 1,
    weightValue: "500" as const,
    textStyle: (base: number) => ({
      fontSize: Math.round(base),
      fontWeight: "500" as const,
    }),
  }),
}));

jest.mock("../utils/buildingIndoorMaps", () => ({
  hasIndoorMaps: () => true,
}));

jest.mock("../components/PopupTemplate", () => {
  const { View, Text, Pressable } = require("react-native");
  return ({
    title,
    onClose,
    renderBody,
    renderButtons,
  }: {
    title: string;
    onClose: () => void;
    renderBody: () => React.ReactNode;
    renderButtons: () => React.ReactNode;
  }) => (
    <View>
      <Text testID="popup-title">{title}</Text>
      <Pressable testID="popup-close" onPress={onClose}>
        <Text>Close</Text>
      </Pressable>
      {renderBody()}
      {renderButtons()}
    </View>
  );
});

describe("BuildingPopup", () => {
  const base = {
    id: "b1",
    name: "Hall Building",
    buildingId: "H" as const,
    image: null as null,
    onClose: jest.fn(),
    onDirections: jest.fn(),
    onIndoorMaps: jest.fn(),
  };

  it("renders title and address lines with stable keys", () => {
    const { getByTestId, getByText } = render(
      <BuildingPopup
        {...base}
        addressLines={["1455 De Maisonneuve", "Montreal"]}
        openingHours="8am–10pm"
      />,
    );
    expect(getByTestId("popup-title").props.children).toBe("Hall Building");
    expect(getByText("1455 De Maisonneuve")).toBeTruthy();
    expect(getByText("Montreal")).toBeTruthy();
  });

  it("calls onDirections and onIndoorMaps", () => {
    const { getByText } = render(
      <BuildingPopup {...base} addressLines={[]} openingHours="" />,
    );
    fireEvent.press(getByText("Directions"));
    expect(base.onDirections).toHaveBeenCalled();
    fireEvent.press(getByText("Indoor Maps"));
    expect(base.onIndoorMaps).toHaveBeenCalled();
  });
});
