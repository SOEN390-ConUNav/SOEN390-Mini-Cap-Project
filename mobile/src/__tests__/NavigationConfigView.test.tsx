import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// Mock the hooks before imports
jest.mock("../hooks/useNavigationConfig", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../hooks/useNavigationInfo", () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Mock child components
jest.mock("../components/BottomDrawer", () => {
    return function MockBottomDrawer({ children, visible }: any) {
        return visible ? <>{children}</> : null;
    };
});

jest.mock("../components/navigation-config/NavigationTransportCard", () => {
    return function MockNavigationTransportCard({
                                                    mode,
                                                    isSelected,
                                                    onSelect,
                                                }: any) {
        const { Text, TouchableOpacity } = require("react-native");
        return (
            <TouchableOpacity
                testID={`transport-card-${mode}`}
                onPress={onSelect}
            >
                <Text>{mode}</Text>
                <Text>{isSelected ? "Selected" : "Not Selected"}</Text>
            </TouchableOpacity>
        );
    };
});

jest.mock("../components/navigation-config/NavigationPathRow", () => {
    return function MockNavigationPathRow({ handleGo }: any) {
        const { TouchableOpacity, Text } = require("react-native");
        return (
            <TouchableOpacity testID="go-button" onPress={handleGo}>
                <Text>Go</Text>
            </TouchableOpacity>
        );
    };
});

import NavigationConfigView from "../components/navigation-config/NavigationConfigView";
import useNavigationConfig from "../hooks/useNavigationConfig";
import useNavigationInfo from "../hooks/useNavigationInfo";

const mockUseNavigationConfig = useNavigationConfig as unknown as jest.Mock;
const mockUseNavigationInfo = useNavigationInfo as unknown as jest.Mock;

const mockSetNavigationMode = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();

    mockUseNavigationConfig.mockReturnValue({
        navigationMode: "WALK",
        setNavigationMode: mockSetNavigationMode,
    });

    mockUseNavigationInfo.mockReturnValue({
        isLoading: false,
    });
});

describe("NavigationConfigView", () => {
    it("renders when visible", () => {
        const { getByText } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        expect(getByText("WALK")).toBeTruthy();
        expect(getByText("BIKE")).toBeTruthy();
        expect(getByText("BUS")).toBeTruthy();
        expect(getByText("SHUTTLE")).toBeTruthy();
    });

    it("does not render when not visible", () => {
        const { queryByText } = render(
            <NavigationConfigView visible={false} onClose={jest.fn()} />
        );

        expect(queryByText("WALK")).toBeNull();
    });

    it("shows loading state when isLoading is true", () => {
        mockUseNavigationInfo.mockReturnValue({
            isLoading: true,
        });

        const { getByText, queryByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        expect(getByText("Calculating Route...")).toBeTruthy();
        expect(queryByTestId("transport-card-WALK")).toBeNull();
        expect(queryByTestId("go-button")).toBeNull();
    });

    it("shows transport modes when not loading", () => {
        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        expect(getByTestId("transport-card-WALK")).toBeTruthy();
        expect(getByTestId("transport-card-BIKE")).toBeTruthy();
        expect(getByTestId("transport-card-BUS")).toBeTruthy();
        expect(getByTestId("transport-card-SHUTTLE")).toBeTruthy();
        expect(getByTestId("go-button")).toBeTruthy();
    });

    it("displays WALK mode as selected by default", () => {
        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const walkCard = getByTestId("transport-card-WALK");
        expect(walkCard).toBeTruthy();
        expect(walkCard.children[1].props.children).toBe("Selected");
    });

    it("calls setNavigationMode when BIKE card is pressed", () => {
        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const bikeCard = getByTestId("transport-card-BIKE");
        fireEvent.press(bikeCard);

        expect(mockSetNavigationMode).toHaveBeenCalledWith("BIKE");
    });

    it("calls setNavigationMode when BUS card is pressed", () => {
        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const busCard = getByTestId("transport-card-BUS");
        fireEvent.press(busCard);

        expect(mockSetNavigationMode).toHaveBeenCalledWith("BUS");
    });

    it("calls setNavigationMode when SHUTTLE card is pressed", () => {
        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const shuttleCard = getByTestId("transport-card-SHUTTLE");
        fireEvent.press(shuttleCard);

        expect(mockSetNavigationMode).toHaveBeenCalledWith("SHUTTLE");
    });

    it("displays correct selected state for BIKE mode", () => {
        mockUseNavigationConfig.mockReturnValue({
            navigationMode: "BIKE",
            setNavigationMode: mockSetNavigationMode,
        });

        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const bikeCard = getByTestId("transport-card-BIKE");
        const walkCard = getByTestId("transport-card-WALK");

        expect(bikeCard.children[1].props.children).toBe("Selected");
        expect(walkCard.children[1].props.children).toBe("Not Selected");
    });

    it("displays correct selected state for BUS mode", () => {
        mockUseNavigationConfig.mockReturnValue({
            navigationMode: "BUS",
            setNavigationMode: mockSetNavigationMode,
        });

        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const busCard = getByTestId("transport-card-BUS");
        const walkCard = getByTestId("transport-card-WALK");

        expect(busCard.children[1].props.children).toBe("Selected");
        expect(walkCard.children[1].props.children).toBe("Not Selected");
    });

    it("displays correct selected state for SHUTTLE mode", () => {
        mockUseNavigationConfig.mockReturnValue({
            navigationMode: "SHUTTLE",
            setNavigationMode: mockSetNavigationMode,
        });

        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const shuttleCard = getByTestId("transport-card-SHUTTLE");
        const walkCard = getByTestId("transport-card-WALK");

        expect(shuttleCard.children[1].props.children).toBe("Selected");
        expect(walkCard.children[1].props.children).toBe("Not Selected");
    });

    it("logs navigation start when Go button is pressed", () => {
        const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const goButton = getByTestId("go-button");
        fireEvent.press(goButton);

        expect(consoleLogSpy).toHaveBeenCalledWith(
            "Start navigation with mode:",
            "WALK"
        );

        consoleLogSpy.mockRestore();
    });

    it("transitions from loading to loaded state", () => {
        const { rerender, getByText, queryByText, getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        mockUseNavigationInfo.mockReturnValue({
            isLoading: true,
        });

        rerender(<NavigationConfigView visible={true} onClose={jest.fn()} />);

        expect(getByText("Calculating Route...")).toBeTruthy();
        expect(queryByText("WALK")).toBeNull();

        mockUseNavigationInfo.mockReturnValue({
            isLoading: false,
        });

        rerender(<NavigationConfigView visible={true} onClose={jest.fn()} />);

        expect(queryByText("Calculating Route...")).toBeNull();
        expect(getByTestId("transport-card-WALK")).toBeTruthy();
    });

    it("allows switching between different transport modes", () => {
        const { getByTestId } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        fireEvent.press(getByTestId("transport-card-BIKE"));
        expect(mockSetNavigationMode).toHaveBeenCalledWith("BIKE");

        fireEvent.press(getByTestId("transport-card-BUS"));
        expect(mockSetNavigationMode).toHaveBeenCalledWith("BUS");

        fireEvent.press(getByTestId("transport-card-SHUTTLE"));
        expect(mockSetNavigationMode).toHaveBeenCalledWith("SHUTTLE");

        fireEvent.press(getByTestId("transport-card-WALK"));
        expect(mockSetNavigationMode).toHaveBeenCalledWith("WALK");

        expect(mockSetNavigationMode).toHaveBeenCalledTimes(4);
    });

    it("renders ActivityIndicator in loading state", () => {
        mockUseNavigationInfo.mockReturnValue({
            isLoading: true,
        });

        const { UNSAFE_getByType } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const ActivityIndicator = require("react-native").ActivityIndicator;
        expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it("does not render ActivityIndicator when not loading", () => {
        const { UNSAFE_queryByType } = render(
            <NavigationConfigView visible={true} onClose={jest.fn()} />
        );

        const ActivityIndicator = require("react-native").ActivityIndicator;
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
});