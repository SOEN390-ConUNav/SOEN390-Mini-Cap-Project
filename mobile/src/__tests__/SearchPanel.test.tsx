import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SearchPanel from "../components/SearchPanel";
import cacheService from "../services/cacheService";

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

import { searchLocations, getNearbyPlaces } from "../api";
import { addSearchHistory, getSearchHistory } from "../utils/searchHistory";
import useLocationStore from "../hooks/useLocationStore";
import useLocationService from "../hooks/useLocationService";

const mockUseLocationStore = useLocationStore as jest.MockedFunction<
  typeof useLocationStore
>;
const mockUseLocationService = useLocationService as jest.MockedFunction<
  typeof useLocationService
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

    (getSearchHistory as jest.Mock).mockResolvedValue([]);
    (getNearbyPlaces as jest.Mock).mockResolvedValue([
      {
        id: "n1",
        name: "Cafe Nearby",
        address: "123 Main St",
        location: { latitude: 45.5001, longitude: -73.6001 },
      },
    ]);
    (searchLocations as jest.Mock).mockResolvedValue([
      {
        id: "1",
        name: "Place A",
        address: "Addr",
        location: { latitude: 1, longitude: 2 },
      },
    ]);
  });

  it("renders recent searches when visible", async () => {
    (getSearchHistory as jest.Mock).mockResolvedValue([{ query: "Library" }]);

    const { queryByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(getSearchHistory).toHaveBeenCalled();
      expect(queryByText("Recent Searches")).toBeTruthy();
      expect(queryByText("Library")).toBeTruthy();
    });
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
      expect(searchLocations).toHaveBeenCalledWith("Place A");
      expect(onSelectLocation).toHaveBeenCalledWith({
        latitude: 1,
        longitude: 2,
        name: "Place A",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("fetches nearby places with current location and caches by filter", async () => {
    const { findByText, getByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    expect(await findByText("Cafe Nearby")).toBeTruthy();
    expect(getNearbyPlaces).toHaveBeenCalledWith(45.5, -73.6, "restaurant");

    fireEvent.press(getByText("Parking"));
    await waitFor(() => {
      expect(getNearbyPlaces).toHaveBeenCalledWith(45.5, -73.6, "parking");
    });

    fireEvent.press(getByText("Restaurants"));

    await waitFor(() => {
      expect((getNearbyPlaces as jest.Mock).mock.calls.length).toBe(2);
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

  it("shows location permission UI and calls requestPermission when prompt is allowed", async () => {
    storeState.permissionStatus = "denied";
    storeState.canAskAgain = true;
    storeState.userSkippedPermission = false;

    const { findByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    const button = await findByText("Enable Location");
    fireEvent.press(button);

    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it("shows settings button and calls openSettings when OS prompt should not be shown", async () => {
    storeState.permissionStatus = "denied";
    storeState.canAskAgain = false;
    storeState.userSkippedPermission = true;

    const { findByText } = render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    const button = await findByText("Open Settings");
    fireEvent.press(button);

    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it("shows location alert when nearby fetch fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    storeState.currentLocation = null;
    getCurrentPosition.mockRejectedValue(new Error("gps failed"));

    render(
      <SearchPanel
        visible
        onSelectLocation={onSelectLocation}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Location Required",
        "Enable location to see nearby places.",
        expect.any(Array),
      );
    });

    alertSpy.mockRestore();
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
});
