import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SearchPanel from "../components/SearchPanel";
import cacheService from "../services/cacheService";
import { searchLocations, getNearbyPlaces } from "../api";
import { addSearchHistory, getSearchHistory } from "../utils/searchHistory";
import { calculateDistance, getOpenStatusText } from "../utils/location";
import useLocationStore from "../hooks/useLocationStore";
import useLocationService from "../hooks/useLocationService";

jest.mock("../api", () => ({
  searchLocations: jest.fn(),
  getNearbyPlaces: jest.fn(),
  getAllOutdoorDirectionsInfo: jest.fn(),
}));

jest.mock("../utils/searchHistory", () => ({
  addSearchHistory: jest.fn(),
  getSearchHistory: jest.fn(),
}));

jest.mock("../hooks/useLocationStore", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../hooks/useLocationService", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../utils/location", () => ({
  calculateDistance: jest.fn(),
  getOpenStatusText: jest.fn(),
}));

const mockUseLocationStore = useLocationStore as jest.MockedFunction<
  typeof useLocationStore
>;
const mockUseLocationService = useLocationService as jest.MockedFunction<
  typeof useLocationService
>;

const mockGetNearbyPlaces = getNearbyPlaces as jest.MockedFunction<
  typeof getNearbyPlaces
>;
const mockSearchLocations = searchLocations as jest.MockedFunction<
  typeof searchLocations
>;
const mockGetSearchHistory = getSearchHistory as jest.MockedFunction<
  typeof getSearchHistory
>;
const mockAddSearchHistory = addSearchHistory as jest.MockedFunction<
  typeof addSearchHistory
>;
const mockCalculateDistance = calculateDistance as jest.MockedFunction<
  typeof calculateDistance
>;
const mockGetOpenStatusText = getOpenStatusText as jest.MockedFunction<
  typeof getOpenStatusText
>;

describe("SearchPanel", () => {
  const onSelectLocation = jest.fn();
  const onClose = jest.fn();
  const getCurrentPosition = jest.fn();
  const openSettings = jest.fn();
  const requestPermission = jest.fn();

  let storeState: {
    permissionStatus: "granted" | "denied" | "undetermined";
    canAskAgain: boolean;
    userSkippedPermission: boolean;
    currentLocation: { latitude: number; longitude: number } | null;
  };

  beforeEach(() => {
    // Prevent fake timers leaked from other suites from breaking waitFor/findBy in CI.
    jest.useRealTimers();
    jest.clearAllMocks();
    cacheService.clearMemoryNamespace("nearby_places");

    storeState = {
      permissionStatus: "granted",
      canAskAgain: true,
      userSkippedPermission: false,
      currentLocation: { latitude: 45.5, longitude: -73.6 },
    };

    mockUseLocationStore.mockImplementation((selector) =>
      selector(storeState as any),
    );

    mockUseLocationService.mockReturnValue({
      getCurrentPosition,
      openSettings,
      requestPermission,
      isInitialized: true,
      permissionStatus: "granted",
      hasSeenPermissionScreen: true,
      userSkippedPermission: false,
      checkLocationServices: jest.fn(),
      checkPermission: jest.fn(),
      markPermissionScreenSeen: jest.fn(),
      markUserSkipped: jest.fn(),
      startWatching: jest.fn(),
      stopWatching: jest.fn(),
    } as any);

    mockGetSearchHistory.mockResolvedValue([]);
    mockGetNearbyPlaces.mockResolvedValue([
      {
        id: "n1",
        name: "Cafe Nearby",
        address: "123 Main St",
        location: { latitude: 45.5001, longitude: -73.6001 },
      },
    ]);
    mockSearchLocations.mockResolvedValue([
      {
        id: "1",
        name: "Place A",
        address: "Addr",
        location: { latitude: 1, longitude: 2 },
      },
    ]);

    // Ensure nearby items aren't filtered out during tests by returning a valid distance
    mockCalculateDistance.mockReturnValue(0);
  });

  it("renders recent searches when visible", async () => {
    mockGetSearchHistory.mockResolvedValue([
      { query: "Library", timestamp: 1_700_000_000_000 },
    ]);
    storeState.permissionStatus = "denied";
    storeState.currentLocation = null;

    const { findByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(mockGetSearchHistory).toHaveBeenCalledTimes(1);
    });
    expect(
      await findByText("Recent Searches", {}, { timeout: 10_000 }),
    ).toBeTruthy();
    expect(await findByText("Library", {}, { timeout: 10_000 })).toBeTruthy();
  });

  it("does not search when query is blank", async () => {
    const { getByPlaceholderText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    const input = getByPlaceholderText("Search");
    fireEvent.changeText(input, "   ");
    fireEvent(input, "submitEditing", { nativeEvent: { text: "   " } });

    await waitFor(() => {
      expect(searchLocations).not.toHaveBeenCalled();
      expect(addSearchHistory).not.toHaveBeenCalled();
    });
  });

  it("runs search and selects a result", async () => {
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
      expect(addSearchHistory).toHaveBeenCalledWith("Place A");
      expect(searchLocations).toHaveBeenCalledWith("Place A", 45.5, -73.6);
      expect(onSelectLocation).toHaveBeenCalledWith({
        latitude: 1,
        longitude: 2,
        name: "Place A",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("fetches nearby places with current location and caches by filter", async () => {
    const { getByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    expect(mockGetNearbyPlaces).toHaveBeenCalledWith(45.5, -73.6, "restaurant");
    expect(getNearbyPlaces).toHaveBeenCalledWith(45.5, -73.6, "restaurant");

    fireEvent.press(getByText("Parking"));
    await waitFor(() => {
      expect(getNearbyPlaces).toHaveBeenCalledWith(45.5, -73.6, "parking");
    });

    fireEvent.press(getByText("Restaurants"));

    await waitFor(() => {
      expect(mockGetNearbyPlaces.mock.calls.length).toBe(2);
    });
  });

  it("uses getCurrentPosition when location is not already in store", async () => {
    storeState.currentLocation = null;
    getCurrentPosition.mockResolvedValue({
      latitude: 45.61,
      longitude: -73.71,
    });

    render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
      expect(getNearbyPlaces).toHaveBeenCalledWith(45.61, -73.71, "restaurant");
    });
  });

  it("logs errors when fetching nearby places fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockGetNearbyPlaces.mockRejectedValue(new Error("fetch failed"));

    render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });

    errorSpy.mockRestore();
  });

  it("close button triggers onClose", () => {
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

  it("selects recent search item and updates query", async () => {
    mockGetSearchHistory.mockResolvedValue([
      { query: "coffee", timestamp: 1_700_000_000_000 },
    ]);

    const { getByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    // Wait for recent searches to load
    await waitFor(() => {
      expect(getByText("coffee")).toBeTruthy();
    });

    // Click on recent search - this will trigger setQuery and handleSearch
    fireEvent.press(getByText("coffee"));

    // After clicking, the query should be updated and search should be run
    await waitFor(() => {
      expect(mockSearchLocations).toHaveBeenCalled();
    });
  });

  it("closes distance filter modal by pressing backdrop", async () => {
    const { getByTestId, queryByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      fireEvent.press(getByTestId("distance-filter-button"));
    });

    expect(queryByText("Filter by Distance")).toBeTruthy();

    // Press backdrop to close
    fireEvent.press(getByTestId("distance-filter-backdrop"));

    // Modal should close
    await waitFor(() => {
      expect(queryByText("Filter by Distance")).toBeFalsy();
    });
  });

  it("closes details modal by pressing backdrop", async () => {
    const { findByText, queryByText, getByTestId } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    const item = await findByText("Cafe Nearby");
    fireEvent.press(item);

    expect(queryByText("Get Directions")).toBeTruthy();

    // Press backdrop to close
    fireEvent.press(getByTestId("details-modal-backdrop"));

    // Modal should close
    await waitFor(() => {
      expect(queryByText("Get Directions")).toBeFalsy();
    });
  });

  it("selects Get Directions and closes modal", async () => {
    const { findByText, queryByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    const item = await findByText("Cafe Nearby");
    fireEvent.press(item);

    const directionsButton = await findByText("Get Directions");
    fireEvent.press(directionsButton);

    await waitFor(() => {
      expect(onSelectLocation).toHaveBeenCalledWith({
        latitude: 45.5001,
        longitude: -73.6001,
        name: "Cafe Nearby",
      });
      expect(onClose).toHaveBeenCalled();
      expect(queryByText("Get Directions")).toBeFalsy();
    });
  });

  it("toggles opening hours in the details modal", async () => {
    // Provide opening hours data so the toggle is visible
    mockGetNearbyPlaces.mockResolvedValueOnce([
      {
        id: "n1",
        name: "Cafe Nearby",
        address: "123 Main St",
        location: { latitude: 45.5001, longitude: -73.6001 },
        openingHours: {
          openNow: true,
          weekdayDescriptions: ["Mon: 9am - 5pm"],
        },
      },
    ] as any);

    const { findByText, queryByText, getByTestId } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    const item = await findByText("Cafe Nearby");
    fireEvent.press(item);

    // The toggle should appear and show opening hours when pressed
    fireEvent.press(getByTestId("opening-hours-toggle"));

    await waitFor(() => {
      expect(queryByText("Mon: 9am - 5pm")).toBeTruthy();
    });
  });

  it("does not call getCurrentPosition when store has location", async () => {
    render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(getCurrentPosition).not.toHaveBeenCalled();
    });
  });

  it("does not fetch nearby places when location permission is denied", async () => {
    storeState.permissionStatus = "denied";
    storeState.canAskAgain = false;

    render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(getNearbyPlaces).not.toHaveBeenCalled();
    });
  });

  it("does not refetch nearby places when selecting the same filter twice", async () => {
    const { getByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    // Initial render triggers one fetch
    expect(mockGetNearbyPlaces).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("Parking"));
    await waitFor(() => {
      expect(mockGetNearbyPlaces).toHaveBeenCalledTimes(2);
    });

    // Selecting the same filter again should not trigger another fetch
    fireEvent.press(getByText("Parking"));
    await waitFor(() => {
      expect(mockGetNearbyPlaces).toHaveBeenCalledTimes(2);
    });

    // Switching back to restaurants should use cached results and not trigger a network call
    fireEvent.press(getByText("Restaurants"));
    await waitFor(() => {
      expect(mockGetNearbyPlaces).toHaveBeenCalledTimes(2);
    });
  });

  it("filters nearby items when applying a custom distance", async () => {
    mockCalculateDistance.mockReturnValue(1000); // far away so it will be filtered out

    const { getByTestId, getByPlaceholderText, getByText, queryByText } =
      render(
        <SearchPanel
          visible
          onSelectLocation={onSelectLocation}
          onClose={onClose}
        />,
      );

    // Open the distance filter modal
    fireEvent.press(getByTestId("distance-filter-button"));
    expect(queryByText("Filter by Distance")).toBeTruthy();

    // Enter an invalid value - modal should remain open
    fireEvent.changeText(getByPlaceholderText("Enter distance"), "abc");
    fireEvent.press(getByText("Apply Custom Distance"));
    expect(queryByText("Filter by Distance")).toBeTruthy();

    // Enter a valid value and apply - should close and filter out the nearby item
    fireEvent.changeText(getByPlaceholderText("Enter distance"), "0.1");
    fireEvent.press(getByText("Apply Custom Distance"));

    await waitFor(() => {
      expect(queryByText("Filter by Distance")).toBeFalsy();
      expect(queryByText("Cafe Nearby")).toBeNull();
    });
  });

  it("shows rating and phone number in the details modal", async () => {
    mockGetNearbyPlaces.mockResolvedValueOnce([
      {
        id: "n1",
        name: "Cafe Nearby",
        address: "123 Main St",
        location: { latitude: 45.5001, longitude: -73.6001 },
        rating: 4.5,
        phoneNumber: "555-1234",
      },
    ]);

    const { findByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    const item = await findByText("Cafe Nearby");
    fireEvent.press(item);

    await waitFor(() => {
      expect(findByText("4.5 / 5.0")).resolves.toBeTruthy();
      expect(findByText("555-1234")).resolves.toBeTruthy();
    });
  });
});
