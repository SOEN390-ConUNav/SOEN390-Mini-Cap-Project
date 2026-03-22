import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CampusSwitcher from "../components/CampusSwitcher";

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      primary: "#800020",
      surface: "#eee",
      textMuted: "#666",
    },
  }),
}));

describe("CampusSwitcher", () => {
  it("renders both campus labels", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <CampusSwitcher value="SGW" onChange={onChange} />,
    );
    expect(getByText("SGW Campus")).toBeTruthy();
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("calls onChange with LOYOLA when Loyola pressed", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <CampusSwitcher value="SGW" onChange={onChange} />,
    );
    fireEvent.press(getByText("Loyola Campus"));
    expect(onChange).toHaveBeenCalledWith("LOYOLA");
  });

  it("calls onChange with SGW when SGW pressed", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <CampusSwitcher value="LOYOLA" onChange={onChange} />,
    );
    fireEvent.press(getByText("SGW Campus"));
    expect(onChange).toHaveBeenCalledWith("SGW");
  });
});
