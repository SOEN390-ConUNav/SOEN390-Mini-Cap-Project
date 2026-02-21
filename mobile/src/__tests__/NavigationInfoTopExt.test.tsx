import React from "react";
import { render } from "@testing-library/react-native";
import NavigationInfoTopExt from "../components/navigation-info/NavigationInfoTopExt";
import useNavigationInfo from "../hooks/useNavigationInfo";

jest.mock("../hooks/useNavigationInfo", () => jest.fn());

jest.mock("@expo/vector-icons", () => ({
  MaterialIcons: ({ name }: any) => {
    const { Text } = require("react-native");
    return <Text testID="icon">{name}</Text>;
  },
}));

describe("NavigationInfoTopExt", () => {
  const baseProps = { destination: "Loyola Campus" };

  beforeEach(() => {
    jest.clearAllMocks();

    (useNavigationInfo as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        pathDistance: "2.5 km",
        pathDuration: "1 hour 30 min",
      }),
    );
  });

  it("renders without crashing", () => {
    const { root } = render(<NavigationInfoTopExt {...baseProps} />);
    expect(root).toBeTruthy();
  });

  it("renders the destination text", () => {
    const { getByText } = render(<NavigationInfoTopExt {...baseProps} />);
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("renders the place icon", () => {
    const { getByTestId } = render(<NavigationInfoTopExt {...baseProps} />);
    expect(getByTestId("icon")).toBeTruthy();
    expect(getByTestId("icon").props.children).toBe("place");
  });

  it("renders distance correctly", () => {
    const { getByText } = render(<NavigationInfoTopExt {...baseProps} />);
    expect(getByText("2.5 km")).toBeTruthy();
  });

  it("calculates ETA correctly", () => {
    const { getByText } = render(<NavigationInfoTopExt {...baseProps} />);
    expect(getByText(/^\d{2}:\d{2}$/)).toBeTruthy();
  });

  it("renders --:-- if duration is N/A", () => {
    (useNavigationInfo as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        pathDistance: "2.5 km",
        pathDuration: "N/A",
      }),
    );

    const { getByText } = render(<NavigationInfoTopExt {...baseProps} />);
    expect(getByText("--:--")).toBeTruthy();
  });
});
