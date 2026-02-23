import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import UpcomingEventButton from "../components/UpcomingEventButton";

let mockShouldThrowOnArrayClear = false;

jest.mock("react", () => {
  const actualReact = jest.requireActual("react");
  return {
    ...actualReact,
    useState: (initial: any) => {
      const tuple = actualReact.useState(initial);
      if (!Array.isArray(initial)) {
        return tuple;
      }
      return [
        tuple[0],
        (next: any) => {
          if (
            mockShouldThrowOnArrayClear &&
            Array.isArray(next) &&
            next.length === 0
          ) {
            throw new Error("clear state failed");
          }
          return tuple[1](next);
        },
      ] as any;
    },
  };
});

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { GOOGLE_WEB_CLIENT_ID: "web-client-id" } },
}));

jest.mock("../api", () => ({
  requestGoogleCalendars: jest.fn(),
  requestGoogleLogout: jest.fn(),
  requestGoogleOAuthExchange: jest.fn(),
  requestGoogleState: jest.fn(),
  requestSetGoogleSelectedCalendar: jest.fn(),
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    revokeAccess: jest.fn(),
    signOut: jest.fn(),
  },
}));

import { requestGoogleLogout, requestGoogleState } from "../api";

describe("UpcomingEventButton logout catch coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldThrowOnArrayClear = false;
    (requestGoogleState as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        selectedCalendar: { id: "cal-1", summary: "School", primary: true },
        calendarSelected: true,
        nextEvent: { summary: "SOEN 390", location: "H-937" },
        nextEventDetailsText: "details",
      }),
      text: async () => "",
    });
    (requestGoogleLogout as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ loggedOut: true }),
      text: async () => "",
    });
  });

  it("covers outer logout catch when local clear state throws", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const onOpenEventDetails = jest.fn();

    render(<UpcomingEventButton onOpenEventDetails={onOpenEventDetails} />);

    await waitFor(() => {
      expect(screen.getByText("Upcoming event: SOEN 390")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Upcoming event: SOEN 390"));

    mockShouldThrowOnArrayClear = true;
    await act(async () => {
      onOpenEventDetails.mock.calls[0][0].onLogout();
    });

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith("LOGOUT ERROR:", expect.any(Error));
    });
  });
});
