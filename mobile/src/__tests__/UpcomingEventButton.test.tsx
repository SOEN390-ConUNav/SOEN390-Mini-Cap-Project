import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import UpcomingEventButton from "../components/UpcomingEventButton";
import {
  requestGoogleCalendars,
  requestGoogleLogout,
  requestGoogleOAuthExchange,
  requestGoogleState,
  requestSetGoogleSelectedCalendar,
} from "../api";

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

const okResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
  text: async () => "",
});

describe("UpcomingEventButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requestGoogleOAuthExchange as jest.Mock).mockResolvedValue(okResponse({}));
    (requestGoogleLogout as jest.Mock).mockResolvedValue(
      okResponse({ loggedOut: true }),
    );
  });

  it("runs import flow, opens calendar picker, and selects a calendar", async () => {
    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        okResponse({
          selectedCalendar: null,
          calendarSelected: false,
          nextEvent: null,
          nextEventDetailsText: "No upcoming event",
        }),
      )
      .mockResolvedValueOnce(
        okResponse({
          selectedCalendar: null,
          calendarSelected: false,
          nextEvent: null,
          nextEventDetailsText: "No upcoming event",
        }),
      )
      .mockResolvedValueOnce(
        okResponse({
          selectedCalendar: { id: "cal-1", summary: "School", primary: true },
          calendarSelected: true,
          nextEvent: null,
          nextEventDetailsText: "No upcoming event",
        }),
      );

    (requestGoogleCalendars as jest.Mock).mockResolvedValue(
      okResponse([{ id: "cal-1", summary: "School", primary: true }]),
    );
    (requestSetGoogleSelectedCalendar as jest.Mock).mockResolvedValue(
      okResponse({ saved: true }),
    );

    const onMainButtonPress = jest.fn();

    render(<UpcomingEventButton onMainButtonPress={onMainButtonPress} />);

    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Import Google Calendar Schedule"));

    expect(onMainButtonPress).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText("Select a calendar")).toBeTruthy();
      expect(screen.getByText("School")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("School"));

    await waitFor(() => {
      expect(requestSetGoogleSelectedCalendar).toHaveBeenCalledWith({
        id: "cal-1",
        summary: "School",
        primary: true,
      });
    });
  }, 15000);
});
