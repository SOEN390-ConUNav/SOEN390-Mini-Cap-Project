import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { API_BASE_URL } from "../const";

// Mock the hooks before imports
jest.mock("../hooks/useNavigationConfig", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../hooks/useNavigationInfo", () => ({
    __esModule: true,
    default: jest.fn(),
}));

// Mock react-native-maps
jest.mock("react-native-maps", () => ({
    Polyline: "Polyline",
    Marker: "Marker",
}));

// Mock @mapbox/polyline
jest.mock("@mapbox/polyline", () => ({
    decode: jest.fn(),
}));

import DirectionPath from "../components/DirectionPath";
import useNavigationConfig from "../hooks/useNavigationConfig";
import useNavigationInfo from "../hooks/useNavigationInfo";

const polyline = require("@mapbox/polyline");

global.fetch = jest.fn();

const mockUseNavigationConfig = useNavigationConfig as unknown as jest.Mock;
const mockUseNavigationInfo = useNavigationInfo as unknown as jest.Mock;

const mockSetPathDistance = jest.fn();
const mockSetPathDuration = jest.fn();
const mockSetIsLoading = jest.fn();

const mockOrigin = { latitude: 45.4972, longitude: -73.5794 };
const mockDestination = { latitude: 45.4584, longitude: -73.6404 };

const mockOutdoorDirectionResponse = {
    polyline: "encodedPolylineString",
    distance: 5000,
    duration: 600,
    steps: [
        { polyline: "step1Polyline" },
        { polyline: "step2Polyline" },
    ],
};

beforeEach(() => {
    jest.clearAllMocks();

    mockUseNavigationConfig.mockReturnValue({
        navigationMode: "WALK",
    });

    mockUseNavigationInfo.mockReturnValue({
        setPathDistance: mockSetPathDistance,
        setPathDuration: mockSetPathDuration,
        setIsLoading: mockSetIsLoading,
    });

    (polyline.decode as jest.Mock).mockImplementation((encoded: string) => {
        if (encoded === "step1Polyline") {
            return [[45.497, -73.579], [45.498, -73.580]];
        }
        if (encoded === "step2Polyline") {
            return [[45.499, -73.581], [45.500, -73.582]];
        }
        return [[45.497, -73.579], [45.500, -73.582]];
    });

    (global.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockOutdoorDirectionResponse),
    });
});

describe("DirectionPath", () => {
    it("fetches route and decodes polyline on mount", async () => {
        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(mockSetIsLoading).toHaveBeenCalledWith(true);
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${API_BASE_URL}/api/directions/outdoor` +
                `?origin=${encodeURIComponent(`${mockOrigin.latitude},${mockOrigin.longitude}`)}` +
                `&destination=${encodeURIComponent(`${mockDestination.latitude},${mockDestination.longitude}`)}` +
                `&transportMode=walking`
            );
        });

        await waitFor(() => {
            expect(polyline.decode).toHaveBeenCalledWith("step1Polyline");
            expect(polyline.decode).toHaveBeenCalledWith("step2Polyline");
            expect(mockSetPathDistance).toHaveBeenCalledWith(5000);
            expect(mockSetPathDuration).toHaveBeenCalledWith(600);
            expect(mockSetIsLoading).toHaveBeenCalledWith(false);
        });
    });

    it("uses correct transport mode for BUS navigation", async () => {
        mockUseNavigationConfig.mockReturnValue({
            navigationMode: "BUS",
        });

        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("&transportMode=transit")
            );
        });
    });

    it("uses correct transport mode for BIKE navigation", async () => {
        mockUseNavigationConfig.mockReturnValue({
            navigationMode: "BIKE",
        });

        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("&transportMode=bicycling")
            );
        });
    });

    it("uses correct transport mode for SHUTTLE navigation", async () => {
        mockUseNavigationConfig.mockReturnValue({
            navigationMode: "SHUTTLE",
        });

        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("&transportMode=transit")
            );
        });
    });

    it("falls back to overview polyline when steps are missing", async () => {
        const responseWithoutSteps = {
            polyline: "overviewPolyline",
            distance: 5000,
            duration: 600,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(responseWithoutSteps),
        });

        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(polyline.decode).toHaveBeenCalledWith("overviewPolyline");
            expect(mockSetPathDistance).toHaveBeenCalledWith(5000);
            expect(mockSetPathDuration).toHaveBeenCalledWith(600);
        });
    });

    it("handles missing polyline in response", async () => {
        const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue({ error: "No route found" }),
        });

        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(consoleLogSpy).toHaveBeenCalledWith("No polyline returned");
            expect(mockSetIsLoading).toHaveBeenCalledWith(false);
        });

        consoleLogSpy.mockRestore();
    });

    it("handles API errors gracefully", async () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

        (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error fetching route:",
                expect.any(Error)
            );
            expect(mockSetIsLoading).toHaveBeenCalledWith(false);
        });

        consoleErrorSpy.mockRestore();
    });

    it("refetches route when origin changes", async () => {
        const { rerender } = render(
            <DirectionPath origin={mockOrigin} destination={mockDestination} />
    );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        const newOrigin = { latitude: 45.5, longitude: -73.6 };
        rerender(<DirectionPath origin={newOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenLastCalledWith(
                expect.stringContaining(
                    encodeURIComponent(`${newOrigin.latitude},${newOrigin.longitude}`)
                )
            );
        });
    });

    it("refetches route when destination changes", async () => {
        const { rerender } = render(
            <DirectionPath origin={mockOrigin} destination={mockDestination} />
    );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        const newDestination = { latitude: 45.46, longitude: -73.65 };
        rerender(<DirectionPath origin={mockOrigin} destination={newDestination} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenLastCalledWith(
                expect.stringContaining(
                    encodeURIComponent(`${newDestination.latitude},${newDestination.longitude}`)
                )
            );
        });
    });

    it("refetches route when navigation mode changes", async () => {
        const { rerender } = render(
            <DirectionPath origin={mockOrigin} destination={mockDestination} />
    );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining("&transportMode=walking")
            );
        });

        mockUseNavigationConfig.mockReturnValue({
            navigationMode: "BIKE",
        });

        rerender(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenLastCalledWith(
                expect.stringContaining("&transportMode=bicycling")
            );
        });
    });

    it("does not set distance when not provided in response", async () => {
        const responseWithoutDistance = {
            polyline: "overviewPolyline",
            duration: 600,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(responseWithoutDistance),
        });

        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(mockSetPathDistance).not.toHaveBeenCalled();
            expect(mockSetPathDuration).toHaveBeenCalledWith(600);
        });
    });

    it("does not set duration when not provided in response", async () => {
        const responseWithoutDuration = {
            polyline: "overviewPolyline",
            distance: 5000,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue(responseWithoutDuration),
        });

        render(<DirectionPath origin={mockOrigin} destination={mockDestination} />);

        await waitFor(() => {
            expect(mockSetPathDistance).toHaveBeenCalledWith(5000);
            expect(mockSetPathDuration).not.toHaveBeenCalled();
        });
    });
});