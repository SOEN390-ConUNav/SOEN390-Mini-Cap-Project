import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import RouteCard from "../components/search-bar/RouteCard";

jest.mock("react-native-reanimated", () => ({
  useSharedValue: (init: number) => ({ value: init }),
}));

jest.mock("../hooks/useNavigationInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../components/search-bar/RouteRow", () => {
  const { View, Text } = require("react-native");
  return ({ label, value }: { label: string; value: string }) => (
    <View>
      <Text>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
});

jest.mock("../components/SwapButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity testID="swap-button" onPress={onPress}>
      <Text>Swap</Text>
    </TouchableOpacity>
  );
});

jest.mock("../components/CircleIconButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({ icon, onPress }: { icon: string; onPress: () => void }) => (
    <TouchableOpacity testID={`icon-button-${icon}`} onPress={onPress}>
      <Text>{icon}</Text>
    </TouchableOpacity>
  );
});

import useNavigationInfo from "../hooks/useNavigationInfo";

const mockUseNavigationInfo = useNavigationInfo as jest.MockedFunction<
  typeof useNavigationInfo
>;

describe("RouteCard", () => {
  const onBack = jest.fn();
  const onSwap = jest.fn();
  const setIsLoading = jest.fn();
  let navigationInfoState: {
    isLoading: boolean;
    setIsLoading: jest.Mock;
    pathDistance: string;
    pathDuration: string;
    setPathDistance: jest.Mock;
    setPathDuration: jest.Mock;
  };

  const baseProps = {
    originLabel: "Hall Building",
    destinationLabel: "Loyola Campus",
    onBack,
    onSwap,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    navigationInfoState = {
      isLoading: false,
      setIsLoading,
      pathDistance: "",
      pathDuration: "",
      setPathDistance: jest.fn(),
      setPathDuration: jest.fn(),
    };

    mockUseNavigationInfo.mockImplementation((selector) =>
      selector(navigationInfoState),
    );
  });

  it("renders without crashing", () => {
    const { root } = render(<RouteCard {...baseProps} />);
    expect(root).toBeTruthy();
  });

  it("renders the back button", () => {
    const { getByTestId } = render(<RouteCard {...baseProps} />);
    expect(getByTestId("icon-button-arrow-back")).toBeTruthy();
  });

  it("renders origin and destination labels when not loading", () => {
    const { getByText } = render(<RouteCard {...baseProps} />);
    expect(getByText("Hall Building")).toBeTruthy();
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("renders From and To route rows when not loading", () => {
    const { getByText } = render(<RouteCard {...baseProps} />);
    expect(getByText("From")).toBeTruthy();
    expect(getByText("To")).toBeTruthy();
  });

  it("renders the swap button when not loading", () => {
    const { getByTestId } = render(<RouteCard {...baseProps} />);
    expect(getByTestId("swap-button")).toBeTruthy();
  });

  it("shows loading indicator and hides route rows when isLoading is true", () => {
    navigationInfoState.isLoading = true;
    const { getByText, queryByText } = render(<RouteCard {...baseProps} />);
    expect(getByText(/Calculating route/i)).toBeTruthy();
    expect(queryByText("From")).toBeNull();
    expect(queryByText("To")).toBeNull();
  });

  it("hides swap button when loading", () => {
    navigationInfoState.isLoading = true;
    const { queryByTestId } = render(<RouteCard {...baseProps} />);
    expect(queryByTestId("swap-button")).toBeNull();
  });

  it("calls onBack and setIsLoading(false) when back button is pressed", () => {
    const { getByTestId } = render(<RouteCard {...baseProps} />);
    fireEvent.press(getByTestId("icon-button-arrow-back"));
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onSwap when swap button is pressed", () => {
    const { getByTestId } = render(<RouteCard {...baseProps} />);
    fireEvent.press(getByTestId("swap-button"));
    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it("back button is still rendered while loading", () => {
    navigationInfoState.isLoading = true;
    const { getByTestId } = render(<RouteCard {...baseProps} />);
    expect(getByTestId("icon-button-arrow-back")).toBeTruthy();
  });

  it("pressing back while loading still calls setIsLoading(false) and onBack", () => {
    navigationInfoState.isLoading = true;
    const { getByTestId } = render(<RouteCard {...baseProps} />);
    fireEvent.press(getByTestId("icon-button-arrow-back"));
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
