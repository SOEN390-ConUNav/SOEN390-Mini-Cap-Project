import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SearchPanel from "../components/SearchPanel";

import { searchLocations, getNearbyPlaces } from "../api";
import { addSearchHistory, getSearchHistory } from "../utils/searchHistory";
import useLocationStore from "../hooks/useLocationStore";
import useLocationService from "../hooks/useLocationService";

// Mock dependencies
jest.mock("../api");
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

  const defaultProps = {
    visible: true,
    onSelectLocation,
    onClose,
  };

  let storeState: any;

  beforeEach(() => {
    jest.clearAllMocks();

    storeState = {
      permissionStatus: "granted",
      canAskAgain: true,
      userSkippedPermission: false,
      currentLocation: { latitude: 45.5, longitude: -73.6 },
    };

    mockUseLocationStore.mockImplementation((selector) => selector(storeState));

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

  it("renders recent searches", async () => {
    (getSearchHistory as jest.Mock).mockResolvedValue([{ query: "Library" }]);

    const { findByText } = render(<SearchPanel {...defaultProps} />);

    expect(await findByText("Library")).toBeTruthy();
  });

  it("ignores blank search queries", async () => {
    const { getByPlaceholderText } = render(<SearchPanel {...defaultProps} />);

    const input = getByPlaceholderText("Search");

    fireEvent.changeText(input, "   ");
    fireEvent(input, "submitEditing", { nativeEvent: { text: "   " } });

    await waitFor(() => {
      expect(searchLocations).not.toHaveBeenCalled();
    });
  });

  it("searches and selects a result", async () => {
    const { getByPlaceholderText, findByText } = render(
      <SearchPanel {...defaultProps} />,
    );

    const input = getByPlaceholderText("Search");

    fireEvent.changeText(input, "Place A");
    fireEvent(input, "submitEditing", { nativeEvent: { text: "Place A" } });

    const result = await findByText("Place A");
    fireEvent.press(result);

    await waitFor(() => {
      expect(addSearchHistory).toHaveBeenCalledWith("Place A");

      expect(onSelectLocation).toHaveBeenCalledWith({
        latitude: 1,
        longitude: 2,
        name: "Place A",
      });

      expect(onClose).toHaveBeenCalled();
    });
  });

  it("fetches nearby places using store location", async () => {
    const { findByText } = render(<SearchPanel {...defaultProps} />);

    expect(await findByText("Cafe Nearby")).toBeTruthy();

    expect(getNearbyPlaces).toHaveBeenCalledWith(45.5, -73.6, "restaurant");
  });

  it("uses GPS when store location is missing", async () => {
    storeState.currentLocation = null;

    getCurrentPosition.mockResolvedValue({
      latitude: 45.61,
      longitude: -73.71,
    });

    render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
      expect(getNearbyPlaces).toHaveBeenCalledWith(45.61, -73.71, "restaurant");
    });
  });

  it("requests location permission when allowed", async () => {
    storeState.permissionStatus = "denied";
    storeState.canAskAgain = true;

    const { findByText } = render(<SearchPanel {...defaultProps} />);

    fireEvent.press(await findByText("Enable Location"));

    expect(requestPermission).toHaveBeenCalled();
  });

  it("opens settings when permission cannot be requested", async () => {
    storeState.permissionStatus = "denied";
    storeState.canAskAgain = false;
    storeState.userSkippedPermission = true;

    const { findByText } = render(<SearchPanel {...defaultProps} />);

    fireEvent.press(await findByText("Open Settings"));

    expect(openSettings).toHaveBeenCalled();
  });

  it("shows alert if GPS fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    storeState.currentLocation = null;
    getCurrentPosition.mockRejectedValue(new Error("gps failed"));

    render(<SearchPanel {...defaultProps} />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it("close button triggers onClose", () => {
    const { getByText } = render(<SearchPanel {...defaultProps} />);

    fireEvent.press(getByText("Close"));

    expect(onClose).toHaveBeenCalled();
  });

  it("selects a recent search", async () => {
    (getSearchHistory as jest.Mock).mockResolvedValue([{ query: "coffee" }]);

    const { findByText } = render(<SearchPanel {...defaultProps} />);

    fireEvent.press(await findByText("coffee"));

    await waitFor(() => {
      expect(getNearbyPlaces).toHaveBeenCalled();
    });
  });
});