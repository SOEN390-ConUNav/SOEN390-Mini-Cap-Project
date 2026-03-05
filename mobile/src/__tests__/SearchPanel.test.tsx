import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import SearchPanel from "../components/SearchPanel";
import * as Location from "expo-location";
import { getNearbyPlaces, searchLocations } from "../api";
import { addSearchHistory, getSearchHistory } from "../utils/searchHistory";
import { calculateDistance, getOpenStatusText } from "../utils/location";

// Mock all dependencies
jest.mock("expo-location");
jest.mock("../api");
jest.mock("../utils/searchHistory");
jest.mock("../utils/location");

const mockLocation = Location as jest.Mocked<typeof Location>;
const mockGetNearbyPlaces = getNearbyPlaces as jest.MockedFunction<typeof getNearbyPlaces>;
const mockSearchLocations = searchLocations as jest.MockedFunction<typeof searchLocations>;
const mockAddSearchHistory = addSearchHistory as jest.MockedFunction<typeof addSearchHistory>;
const mockGetSearchHistory = getSearchHistory as jest.MockedFunction<typeof getSearchHistory>;
const mockCalculateDistance = calculateDistance as jest.MockedFunction<typeof calculateDistance>;
const mockGetOpenStatusText = getOpenStatusText as jest.MockedFunction<typeof getOpenStatusText>;

describe("SearchPanel", () => {
  const mockOnClose = jest.fn();
  const mockOnSelectLocation = jest.fn();

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    onSelectLocation: mockOnSelectLocation,
  };

  const mockUserLocation = {
    latitude: 45.5017,
    longitude: -73.5673,
  };

  const mockNearbyPlaces = [
    {
      id: "1",
      name: "Test Restaurant",
      address: "123 Test St",
      location: { latitude: 45.502, longitude: -73.568 },
      rating: 4.5,
      openingHours: {
        openNow: true,
        weekdayDescriptions: [
          "Monday: 9:00 AM – 10:00 PM",
          "Tuesday: 9:00 AM – 10:00 PM",
        ],
        periods: [
          {
            open: { day: 0, hour: 9, minute: 0 },
            close: { day: 0, hour: 22, minute: 0 },
          },
          {
            open: { day: 1, hour: 9, minute: 0 },
            close: { day: 1, hour: 22, minute: 0 },
          },
        ],
      },
      phoneNumber: "+1234567890",
    },
    {
      id: "2",
      name: "Test Park",
      address: "456 Park Ave",
      location: { latitude: 45.503, longitude: -73.569 },
      rating: 4.0,
    },
  ];

  const mockSearchResults = [
    {
      id: "3",
      name: "Search Result 1",
      address: "789 Search St",
      location: { latitude: 45.504, longitude: -73.570 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: mockUserLocation,
    } as any);
    mockGetNearbyPlaces.mockResolvedValue(mockNearbyPlaces);
    mockSearchLocations.mockResolvedValue(mockSearchResults);
    mockAddSearchHistory.mockResolvedValue();
    mockGetSearchHistory.mockResolvedValue([
      { query: "recent search 1" },
      { query: "recent search 2" },
    ]);
    mockCalculateDistance.mockImplementation((lat1, lon1, lat2, lon2) => {
      // Simple distance calculation for testing
      return Math.abs(lat1 - lat2) * 111000 + Math.abs(lon1 - lon2) * 111000; // rough km to meters
    });
    mockGetOpenStatusText.mockReturnValue("Closes at 10:00 PM");
  });

  it("renders correctly when visible", () => {
    const { getByText, getByPlaceholderText } = render(<SearchPanel {...defaultProps} />);

    expect(getByText("Search")).toBeTruthy();
    expect(getByPlaceholderText("Search")).toBeTruthy();
    expect(getByText("Close")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(<SearchPanel {...defaultProps} visible={false} />);

    expect(queryByText("Search")).toBeFalsy();
  });

  it("loads search history on mount when visible", async () => {
    render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetSearchHistory).toHaveBeenCalled();
    });
  });

  it("fetches nearby places on mount", async () => {
    render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetNearbyPlaces).toHaveBeenCalledWith(
        mockUserLocation.latitude,
        mockUserLocation.longitude,
        "restaurant"
      );
    });
  });

  it("displays filter chips", () => {
    const { getByText } = render(<SearchPanel {...defaultProps} />);

    expect(getByText("Restaurants")).toBeTruthy();
    expect(getByText("Parking")).toBeTruthy();
    expect(getByText("Libraries")).toBeTruthy();
  });

  it("changes active filter when chip is pressed", async () => {
    const { getByText } = render(<SearchPanel {...defaultProps} />);

    fireEvent.press(getByText("Parking"));

    await waitFor(() => {
      expect(mockGetNearbyPlaces).toHaveBeenCalledWith(
        mockUserLocation.latitude,
        mockUserLocation.longitude,
        "parking"
      );
    });
  });

  it("displays recent searches when no query", async () => {
    const { getByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(getByText("Recent Searches")).toBeTruthy();
      expect(getByText("recent search 1")).toBeTruthy();
      expect(getByText("recent search 2")).toBeTruthy();
    });
  });

  it("performs search when query is submitted", async () => {
    const { getByPlaceholderText } = render(<SearchPanel {...defaultProps} />);

    const searchInput = getByPlaceholderText("Search");
    fireEvent.changeText(searchInput, "test query");
    fireEvent(searchInput, "onSubmitEditing");

    await waitFor(() => {
      expect(mockAddSearchHistory).toHaveBeenCalledWith("test query");
      expect(mockSearchLocations).toHaveBeenCalledWith("test query");
    });
  });

  it("displays search results when query exists", async () => {
    const { getByPlaceholderText, getByText } = render(<SearchPanel {...defaultProps} />);

    const searchInput = getByPlaceholderText("Search");
    fireEvent.changeText(searchInput, "test query");
    fireEvent(searchInput, "onSubmitEditing");

    await waitFor(() => {
      expect(getByText("Search results")).toBeTruthy();
      expect(getByText("Search Result 1")).toBeTruthy();
      expect(getByText("789 Search St")).toBeTruthy();
    });
  });

  it("selects location from search results", async () => {
    const { getByPlaceholderText, getByText } = render(<SearchPanel {...defaultProps} />);

    const searchInput = getByPlaceholderText("Search");
    fireEvent.changeText(searchInput, "test query");
    fireEvent(searchInput, "onSubmitEditing");

    await waitFor(() => {
      fireEvent.press(getByText("Search Result 1"));
    });

    expect(mockOnSelectLocation).toHaveBeenCalledWith({
      latitude: 45.504,
      longitude: -73.570,
      name: "Search Result 1",
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("displays nearby places with distance", async () => {
    const { getByText, getAllByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(getByText("Test Restaurant")).toBeTruthy();
    });

    expect(getByText(/Nearby/)).toBeTruthy();
    expect(getByText(/Restaurants/)).toBeTruthy();
    expect(getByText("123 Test St")).toBeTruthy();
    expect(getAllByText(/km away/).length).toBeGreaterThan(0);
  });

  it("opens distance filter modal", async () => {
    const { getByTestId, getByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      fireEvent.press(getByTestId("distance-filter-button"));
    });

    expect(getByText("Filter by Distance")).toBeTruthy();
    expect(getByText("100m")).toBeTruthy();
    expect(getByText("5 km")).toBeTruthy();
  });

  it("applies preset distance filter", async () => {
    const { getByTestId, getByText, queryByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      fireEvent.press(getByTestId("distance-filter-button"));
    });

    fireEvent.press(getByText("1 km"));

    // Distance filter should be applied (no additional API call needed since we filter existing results)
    await waitFor(() => {
      expect(queryByText("Filter by Distance")).toBeFalsy(); // Modal should close
    });
  });

  it("applies custom distance filter", async () => {
    const { getByTestId, getByText, getByPlaceholderText, queryByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      fireEvent.press(getByTestId("distance-filter-button"));
    });

    const customInput = getByPlaceholderText("Enter distance");
    fireEvent.changeText(customInput, "3");
    fireEvent.press(getByText("Apply Custom Distance"));

    // Should close modal
    await waitFor(() => {
      expect(queryByText("Filter by Distance")).toBeFalsy();
    });
  });

  it("filters nearby places by distance", async () => {
    // Mock calculateDistance to return 6000 meters for second place (beyond 5km default)
    mockCalculateDistance.mockImplementation((lat1, lon1, lat2, lon2) => {
      if (lat2 === 45.503) return 6000; // Second place is 6km away
      return 1000; // First place is 1km away
    });

    const { queryByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(queryByText("Test Restaurant")).toBeTruthy();
      expect(queryByText("Test Park")).toBeFalsy(); // Should be filtered out
    });
  });

  it("opens location details modal when nearby place is pressed", async () => {
    const { getByText, getAllByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(getByText("Test Restaurant")).toBeTruthy();
    });

    fireEvent.press(getAllByText("Test Restaurant")[0]); // Press the one in the list

    await waitFor(() => {
      expect(getAllByText("Test Restaurant").length).toBe(2); // One in list, one in modal
    });

    expect(getAllByText("123 Test St").length).toBe(2); // Address appears in both list and modal
    expect(getByText("4.5 / 5.0")).toBeTruthy(); // Rating only in modal
    expect(getByText("+1234567890")).toBeTruthy(); // Phone only in modal
  });

  it("displays opening hours in details modal", async () => {
    const { getByText, getAllByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(getByText("Test Restaurant")).toBeTruthy();
    });

    fireEvent.press(getAllByText("Test Restaurant")[0]);

    await waitFor(() => {
      expect(getAllByText("Test Restaurant").length).toBe(2);
    });

    expect(getByText("Opening Hours")).toBeTruthy();
    expect(getAllByText(/Open/).length).toBeGreaterThan(0);
    expect(getByText(/Closes at 10:00 PM/)).toBeTruthy();
  });

  it("toggles opening hours display", async () => {
    const { getByTestId, queryByText, getAllByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      fireEvent.press(getAllByText("Test Restaurant")[0]);
    });

    // Initially hours should not be shown
    expect(queryByText("Monday: 9:00 AM – 10:00 PM")).toBeFalsy();

    // Press the hours header to expand
    fireEvent.press(getByTestId("opening-hours-toggle"));

    await waitFor(() => {
      expect(queryByText("Monday: 9:00 AM – 10:00 PM")).toBeTruthy();
    });
  });

  it("navigates from details modal", async () => {
    const { getByText, getAllByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      fireEvent.press(getAllByText("Test Restaurant")[0]);
    });

    fireEvent.press(getByText("Get Directions"));

    expect(mockOnSelectLocation).toHaveBeenCalledWith({
      latitude: 45.502,
      longitude: -73.568,
      name: "Test Restaurant",
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("closes distance filter modal with close button", async () => {
    const { getByTestId, queryByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      fireEvent.press(getByTestId("distance-filter-button"));
    });

    expect(queryByText("Filter by Distance")).toBeTruthy();

    // Press the close button
    fireEvent.press(getByTestId("close-filter-button"));

    // Modal should close
    await waitFor(() => {
      expect(queryByText("Filter by Distance")).toBeFalsy();
    });
  });

  it("closes details modal with close button", async () => {
    const { getAllByText, queryByText, getByTestId } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      fireEvent.press(getAllByText("Test Restaurant")[0]);
    });

    expect(queryByText("Get Directions")).toBeTruthy();

    // Press the close button
    fireEvent.press(getByTestId("close-details-button"));

    // Modal should close
    await waitFor(() => {
      expect(queryByText("Get Directions")).toBeFalsy();
    });
  });

  it("handles location permission denied", async () => {
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: "denied" });

    render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetNearbyPlaces).not.toHaveBeenCalled();
    });
  });

  it("handles search API error gracefully", async () => {
    mockSearchLocations.mockRejectedValue(new Error("API error"));

    const { getByPlaceholderText } = render(<SearchPanel {...defaultProps} />);

    const searchInput = getByPlaceholderText("Search");
    fireEvent.changeText(searchInput, "test query");
    fireEvent(searchInput, "onSubmitEditing");

    await waitFor(() => {
      // Should not crash
      expect(mockSearchLocations).toHaveBeenCalled();
    });
  });

  it("handles nearby places API error gracefully", async () => {
    mockGetNearbyPlaces.mockRejectedValue(new Error("API error"));

    render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      // Should not crash
      expect(mockGetNearbyPlaces).toHaveBeenCalled();
    });
  });

  it("shows loading indicator when fetching nearby places", async () => {
    // Delay the mock to show loading
    mockGetNearbyPlaces.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve(mockNearbyPlaces), 100);
    }));

    const { queryByText } = render(<SearchPanel {...defaultProps} />);

    // Initially, nearby places should not be shown
    expect(queryByText("Test Restaurant")).toBeFalsy();

    await waitFor(() => {
      expect(queryByText("Test Restaurant")).toBeTruthy();
    });
  });

  it("caches nearby places results", async () => {
    const { getByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetNearbyPlaces).toHaveBeenCalledTimes(1);
    });

    // Change filter and back
    fireEvent.press(getByText("Parking"));
    await waitFor(() => {
      expect(mockGetNearbyPlaces).toHaveBeenCalledTimes(2);
    });

    fireEvent.press(getByText("Restaurants"));
    // Should use cache, not call API again for restaurant
    expect(mockGetNearbyPlaces).toHaveBeenCalledTimes(2);
  });

  it("calculates distance correctly for display", async () => {
    mockCalculateDistance.mockReturnValue(2500); // 2.5 km

    const { getAllByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(getAllByText("2.5 km away").length).toBeGreaterThan(0);
    });
  });

  it("handles empty search history", async () => {
    mockGetSearchHistory.mockResolvedValue([]);

    const { queryByText } = render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(queryByText("Recent Searches")).toBeFalsy();
    });
  });

  it("does not search when query is empty", () => {
    const { getByPlaceholderText } = render(<SearchPanel {...defaultProps} />);

    const searchInput = getByPlaceholderText("Search");
    fireEvent(searchInput, "onSubmitEditing");

    expect(mockSearchLocations).not.toHaveBeenCalled();
  });

  it("updates query state correctly", () => {
    const { getByPlaceholderText } = render(<SearchPanel {...defaultProps} />);

    const searchInput = getByPlaceholderText("Search");
    fireEvent.changeText(searchInput, "new query");

    expect(searchInput.props.value).toBe("new query");
  });

  it("closes main modal when close button is pressed", () => {
    const { getByText } = render(<SearchPanel {...defaultProps} />);

    fireEvent.press(getByText("Close"));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("selects a search result and calls onSelectLocation and onClose", async () => {
    (mockGetSearchHistory as jest.Mock).mockResolvedValue([]);
    (mockSearchLocations as jest.Mock).mockResolvedValue([
      {
        id: "1",
        name: "Place A",
        address: "Addr",
        location: { latitude: 1, longitude: 2 },
      },
    ]);

    const onSelectLocation = jest.fn();
    const onClose = jest.fn();

    const { getByPlaceholderText, findByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    const input = getByPlaceholderText("Search");
    fireEvent.changeText(input, "Place A");
    fireEvent(input, "submitEditing", { nativeEvent: { text: "Place A" } });

    const item = await findByText("Place A");
    fireEvent.press(item);

    await waitFor(() => {
      expect(onSelectLocation).toHaveBeenCalledWith({
        latitude: 1,
        longitude: 2,
        name: "Place A",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("Close button triggers onClose", () => {
    const onSelectLocation = jest.fn();
    const onClose = jest.fn();

    const { getByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    fireEvent.press(getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
