import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SearchBar from "../components/search-bar/SearchBar";

jest.mock("../components/search-bar/RouteCard", () => {
  const { View, Text } = require("react-native");
  return ({
    originLabel,
    destinationLabel,
    onBack,
    onSwap,
  }: {
    originLabel: string;
    destinationLabel: string;
    onBack: () => void;
    onSwap: () => void;
  }) => (
    <View testID="route-card">
      <Text>{originLabel}</Text>
      <Text>{destinationLabel}</Text>
      <Text testID="back-trigger" onPress={onBack}>
        Back
      </Text>
      <Text testID="swap-trigger" onPress={onSwap}>
        Swap
      </Text>
    </View>
  );
});

jest.mock("../components/navigation-bar/NavigationBar", () => {
  const { View, Text } = require("react-native");
  return ({
    destination,
    onPress,
    navigationInfoToggleState,
  }: {
    destination: string;
    onPress?: () => void;
    navigationInfoToggleState?: string;
  }) => {
    return (
      <View testID="navigation-bar-card">
        <Text>{destination}</Text>
      </View>
    );
  };
});

const baseProps = {
  placeholder: "Search here",
  onPress: jest.fn(),
};

describe("SearchBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Default search bar ───────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { root } = render(<SearchBar {...baseProps} />);
    expect(root).toBeTruthy();
  });

  it("renders the placeholder text", () => {
    const { getByText } = render(
      <SearchBar {...baseProps} placeholder="Where to?" />,
    );
    expect(getByText("Where to?")).toBeTruthy();
  });

  it("calls onPress when the search bar is pressed", () => {
    const { getByText } = render(<SearchBar {...baseProps} />);
    fireEvent.press(getByText("Search here"));
    expect(baseProps.onPress).toHaveBeenCalledTimes(1);
  });

  it("does not render RouteCard by default", () => {
    const { queryByTestId } = render(<SearchBar {...baseProps} />);
    expect(queryByTestId("route-card")).toBeNull();
  });

  // ─── isConfiguring ────────────────────────────────────────────────────────

  it("renders RouteCard when isConfiguring is true", () => {
    const { getByTestId } = render(<SearchBar {...baseProps} isConfiguring />);
    expect(getByTestId("route-card")).toBeTruthy();
  });

  it("does not render the search bar pressable when isConfiguring is true", () => {
    const { queryByText } = render(
      <SearchBar {...baseProps} isConfiguring placeholder="Search here" />,
    );
    expect(queryByText("Search here")).toBeNull();
  });

  // ─── isNavigating ─────────────────────────────────────────────────────────

  it("renders NavigationBar when isNavigating is true", () => {
    const { getByTestId } = render(<SearchBar {...baseProps} isNavigating />);
    expect(getByTestId("navigation-bar-card")).toBeTruthy();
  });

  it("does not render the search pressable when isNavigating is true", () => {
    const { queryByText } = render(
      <SearchBar {...baseProps} isNavigating placeholder="Search here" />,
    );
    expect(queryByText("Search here")).toBeNull();
  });

  // ─── RouteCard label forwarding ───────────────────────────────────────────

  it("passes originLabel to RouteCard", () => {
    const { getByText } = render(
      <SearchBar {...baseProps} isConfiguring originLabel="Hall Building" />,
    );
    expect(getByText("Hall Building")).toBeTruthy();
  });

  it("passes destinationLabel to RouteCard", () => {
    const { getByText } = render(
      <SearchBar
        {...baseProps}
        isConfiguring
        destinationLabel="Loyola Campus"
      />,
    );
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("uses default originLabel when not provided", () => {
    const { getByText } = render(<SearchBar {...baseProps} isConfiguring />);
    expect(getByText("Current Location")).toBeTruthy();
  });

  it("uses default destinationLabel when not provided", () => {
    const { getByText } = render(<SearchBar {...baseProps} isConfiguring />);
    expect(getByText("Select destination")).toBeTruthy();
  });

  // ─── Callback forwarding ──────────────────────────────────────────────────

  it("calls onBack when RouteCard triggers back", () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <SearchBar {...baseProps} isConfiguring onBack={onBack} />,
    );
    fireEvent.press(getByTestId("back-trigger"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onSwap when RouteCard triggers swap", () => {
    const onSwap = jest.fn();
    const { getByTestId } = render(
      <SearchBar {...baseProps} isConfiguring onSwap={onSwap} />,
    );
    fireEvent.press(getByTestId("swap-trigger"));
    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it("does not throw when onBack is undefined and back is triggered", () => {
    const { getByTestId } = render(<SearchBar {...baseProps} isConfiguring />);
    expect(() => fireEvent.press(getByTestId("back-trigger"))).not.toThrow();
  });

  it("does not throw when onSwap is undefined and swap is triggered", () => {
    const { getByTestId } = render(<SearchBar {...baseProps} isConfiguring />);
    expect(() => fireEvent.press(getByTestId("swap-trigger"))).not.toThrow();
  });
});
