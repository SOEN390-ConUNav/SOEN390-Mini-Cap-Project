import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import EnableLocation from "../app/(home-page)/enable-location";

const mockReplace = jest.fn();
const mockOpenSettings = jest.fn();
const mockRequestPermission = jest.fn();
const mockMarkPermissionScreenSeen = jest.fn();
const mockMarkUserSkipped = jest.fn();

let mockParamsState: any = {};
let mockLocationStoreState: any = {
  permissionStatus: "undetermined",
  canAskAgain: true,
  userSkippedPermission: false,
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParamsState,
}));

jest.mock("../hooks/useLocationService", () => ({
  __esModule: true,
  default: () => ({
    requestPermission: mockRequestPermission,
    markPermissionScreenSeen: mockMarkPermissionScreenSeen,
    markUserSkipped: mockMarkUserSkipped,
    openSettings: mockOpenSettings,
  }),
}));

jest.mock("../hooks/useLocationStore", () => ({
  __esModule: true,
  default: (selector: any) => selector(mockLocationStoreState),
}));

describe("EnableLocation screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParamsState = {};
    mockLocationStoreState = {
      permissionStatus: "undetermined",
      canAskAgain: true,
      userSkippedPermission: false,
    };
  });

  it("requests permission and navigates when granted", async () => {
    mockRequestPermission.mockResolvedValue(true);

    const { getByText } = render(<EnableLocation />);
    fireEvent.press(getByText("Enable Location"));

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
      expect(mockMarkPermissionScreenSeen).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/(home-page)");
    });
  });

  it("shows open settings CTA when OS prompt is unavailable", () => {
    mockLocationStoreState = {
      permissionStatus: "denied",
      canAskAgain: false,
      userSkippedPermission: false,
    };

    const { getByText } = render(<EnableLocation />);
    fireEvent.press(getByText("Open Settings"));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("skip action marks user skipped and navigates", async () => {
    mockMarkUserSkipped.mockResolvedValue(undefined);

    const { getByText } = render(<EnableLocation />);
    fireEvent.press(getByText("Skip for now"));

    await waitFor(() => {
      expect(mockMarkUserSkipped).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/(home-page)");
    });
  });

  it("renders revoked UI copy when permission is revoked", () => {
    mockParamsState = { reason: "revoked" };
    mockLocationStoreState = {
      permissionStatus: "revoked",
      canAskAgain: false,
      userSkippedPermission: false,
    };

    const { getByText } = render(<EnableLocation />);
    expect(getByText("Location Permission Revoked")).toBeTruthy();
    expect(getByText("Continue without location")).toBeTruthy();
  });
});
