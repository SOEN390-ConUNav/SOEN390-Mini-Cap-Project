import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert, AppState } from "react-native";
import UpcomingEventButton from "../components/UpcomingEventButton";
import Constants from "expo-constants";
import {
  requestGoogleCalendars,
  requestGoogleLogout,
  requestGoogleOAuthExchange,
  requestGoogleState,
  requestSetGoogleSelectedCalendar,
} from "../api";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

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

const response = ({
  ok = true,
  status = 200,
  json = {},
  text = "",
}: {
  ok?: boolean;
  status?: number;
  json?: any;
  text?: string;
}) => ({
  ok,
  status,
  json: async () => json,
  text: async () => text,
});

describe("UpcomingEventButton branch coverage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation(() => ({ remove: jest.fn() }) as any);
    (GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(undefined);
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ serverAuthCode: "server-code-123" });
    (requestGoogleOAuthExchange as jest.Mock).mockResolvedValue(response({ ok: true, json: {} }));
    (requestGoogleLogout as jest.Mock).mockResolvedValue(response({ ok: true, json: { loggedOut: true } }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("handles initial unauthorized state by keeping local disconnected UI", async () => {
    (requestGoogleState as jest.Mock).mockResolvedValue(
      response({ ok: false, status: 401, text: "unauthorized" })
    );

    render(<UpcomingEventButton />);

    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });
  });

  it("reauthenticates and skips picker when calendar is already selected", async () => {
    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      )
      .mockResolvedValueOnce(response({ ok: false, status: 401, text: "expired" }))
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: { id: "cal-1", summary: "School", primary: true },
            calendarSelected: true,
            nextEvent: { summary: "SOEN 390", location: "H-937" },
            nextEventDetailsText: "SGW\nHall\nClassroom: H-937\nThu, 10:00 - 11:15",
          },
        })
      );

    render(<UpcomingEventButton />);

    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Import Google Calendar Schedule"));

    await waitFor(() => {
      expect(requestGoogleOAuthExchange).toHaveBeenCalledWith("server-code-123");
    });

    expect(requestGoogleCalendars).not.toHaveBeenCalled();
    expect(screen.queryByText("Select a calendar")).toBeNull();
  });

  it("logs import-flow error when web client id is missing", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const originalClientId = (Constants as any).expoConfig?.extra?.GOOGLE_WEB_CLIENT_ID;
    (Constants as any).expoConfig.extra.GOOGLE_WEB_CLIENT_ID = undefined;

    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      )
      .mockResolvedValueOnce(response({ ok: false, status: 401, text: "expired" }));

    render(<UpcomingEventButton />);
    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Import Google Calendar Schedule"));

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith("IMPORT FLOW ERROR:", expect.any(Error));
    });

    (Constants as any).expoConfig.extra.GOOGLE_WEB_CLIENT_ID = originalClientId;
  });

  it("retries calendars request after unauthorized and allows canceling picker", async () => {
    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      )
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      );

    (requestGoogleCalendars as jest.Mock)
      .mockResolvedValueOnce(response({ ok: false, status: 401, text: "expired" }))
      .mockResolvedValueOnce(
        response({ json: [{ id: "cal-1", summary: "School", primary: true }] })
      );

    render(<UpcomingEventButton />);

    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Import Google Calendar Schedule"));

    await waitFor(() => {
      expect(screen.getByText("Select a calendar")).toBeTruthy();
      expect(screen.getByText("School")).toBeTruthy();
    });

    expect(requestGoogleCalendars).toHaveBeenCalledTimes(2);
    expect(requestGoogleOAuthExchange).toHaveBeenCalled();

    fireEvent.press(screen.getByText("Cancel"));
    await waitFor(() => {
      expect(screen.queryByText("Select a calendar")).toBeNull();
    });
  });

  it("logs import-flow error when calendars fetch fails", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      )
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      );
    (requestGoogleCalendars as jest.Mock).mockResolvedValue(
      response({ ok: false, status: 500, text: "calendar error" })
    );

    render(<UpcomingEventButton />);

    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Import Google Calendar Schedule"));

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith("IMPORT FLOW ERROR:", expect.any(Error));
    });
  });

  it("logs import-flow error when oauth exchange response is not ok", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    (requestGoogleOAuthExchange as jest.Mock).mockResolvedValueOnce(
      response({ ok: false, status: 500, text: "oauth failed" })
    );
    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      )
      .mockResolvedValueOnce(response({ ok: false, status: 401, text: "expired" }));

    render(<UpcomingEventButton />);
    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Import Google Calendar Schedule"));

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith("IMPORT FLOW ERROR:", expect.any(Error));
    });
  });

  it("handles event details directions branches and logout flow", async () => {
    const onOpenEventDetails = jest.fn();
    const onRequestDirections = jest.fn();

    (requestGoogleState as jest.Mock).mockResolvedValue(
      response({
        json: {
          selectedCalendar: { id: "cal-1", summary: "School", primary: true },
          calendarSelected: true,
          nextEvent: { summary: "SOEN 390", location: "H-937" },
          nextEventDetailsText: "SGW\nHall\nClassroom: H-937\nThu, 10:00 - 11:15",
        },
      })
    );

    (requestGoogleLogout as jest.Mock).mockRejectedValue(new Error("logout failed"));
    (GoogleSignin.revokeAccess as jest.Mock).mockRejectedValue(new Error("revoke failed"));
    (GoogleSignin.signOut as jest.Mock).mockRejectedValue(new Error("signout failed"));
    (requestGoogleCalendars as jest.Mock).mockResolvedValue(
      response({ json: [{ id: "cal-1", summary: "School", primary: true }] })
    );

    render(
      <UpcomingEventButton
        onOpenEventDetails={onOpenEventDetails}
        onRequestDirections={onRequestDirections}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Upcoming event: SOEN 390")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Upcoming event: SOEN 390"));
    expect(onOpenEventDetails).toHaveBeenCalledTimes(1);

    const payload = onOpenEventDetails.mock.calls[0][0];
    payload.onDirections();
    expect(onRequestDirections).toHaveBeenCalledWith("H-937");

    await act(async () => {
      payload.onChangeCalendar();
    });
    await waitFor(() => {
      expect(requestGoogleCalendars).toHaveBeenCalled();
    });

    await act(async () => {
      payload.onLogout();
    });
    await waitFor(() => {
      expect(requestGoogleLogout).toHaveBeenCalled();
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });
  });

  it("handles no-location and no-directions callbacks", async () => {
    const onOpenEventDetails = jest.fn();

    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: { id: "cal-1", summary: "School", primary: true },
            calendarSelected: true,
            nextEvent: { summary: "No Location Event", location: "   " },
            nextEventDetailsText: "No location",
          },
        })
      )
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: { id: "cal-1", summary: "School", primary: true },
            calendarSelected: true,
            nextEvent: { summary: "Has Location Event", location: "Hall Building" },
            nextEventDetailsText: "Has location",
          },
        })
      );

    const firstView = render(<UpcomingEventButton onOpenEventDetails={onOpenEventDetails} />);

    await waitFor(() => {
      expect(screen.getByText("Upcoming event: No Location Event")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Upcoming event: No Location Event"));
    onOpenEventDetails.mock.calls[0][0].onDirections();
    expect(Alert.alert).toHaveBeenCalledWith(
      "No location",
      "This event has no location to navigate to."
    );

    firstView.unmount();
    render(<UpcomingEventButton onOpenEventDetails={onOpenEventDetails} />);
    await waitFor(() => {
      expect(screen.getByText("Upcoming event: Has Location Event")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Upcoming event: Has Location Event"));
    onOpenEventDetails.mock.calls[1][0].onDirections();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Directions unavailable",
      "Internal directions are not available right now."
    );
  });

  it("retries selected-calendar save after unauthorized", async () => {
    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      )
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      )
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      );

    (requestGoogleCalendars as jest.Mock).mockResolvedValue(
      response({ json: [{ id: "cal-1", summary: "School", primary: true }] })
    );

    (requestSetGoogleSelectedCalendar as jest.Mock)
      .mockResolvedValueOnce(response({ ok: false, status: 401, text: "expired" }))
      .mockResolvedValueOnce(response({ ok: true, status: 200, json: { saved: true } }));

    render(<UpcomingEventButton />);

    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Import Google Calendar Schedule"));
    await waitFor(() => {
      expect(screen.getByText("School")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("School"));

    await waitFor(() => {
      expect(requestSetGoogleSelectedCalendar).toHaveBeenCalledTimes(2);
      expect(requestGoogleOAuthExchange).toHaveBeenCalled();
    });
  });

  it("logs selected-calendar errors when save fails", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    (requestGoogleState as jest.Mock)
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      )
      .mockResolvedValueOnce(
        response({
          json: {
            selectedCalendar: null,
            calendarSelected: false,
            nextEvent: null,
            nextEventDetailsText: "No upcoming event",
          },
        })
      );

    (requestGoogleCalendars as jest.Mock).mockResolvedValue(
      response({ json: [{ id: "cal-1", summary: "School", primary: true }] })
    );
    (requestSetGoogleSelectedCalendar as jest.Mock).mockResolvedValueOnce(
      response({ ok: false, status: 500, text: "set failed" })
    );

    render(<UpcomingEventButton />);

    await waitFor(() => {
      expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Import Google Calendar Schedule"));
    await waitFor(() => {
      expect(screen.getByText("School")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("School"));

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith("SELECT CALENDAR ERROR:", expect.any(Error));
    });
  });

  it("refreshes on interval and when app returns active", async () => {
    jest.useFakeTimers();
    let appStateListener: ((state: any) => void) | undefined;
    jest.restoreAllMocks();
    const addListenerSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_type: any, listener: any) => {
        appStateListener = listener;
        return { remove: jest.fn() } as any;
      });

    Object.defineProperty(AppState, "currentState", {
      value: "active",
      configurable: true,
    });

    (requestGoogleState as jest.Mock).mockResolvedValue(
      response({
        json: {
          selectedCalendar: { id: "cal-1", summary: "School", primary: true },
          calendarSelected: true,
          nextEvent: null,
          nextEventDetailsText: "No upcoming event",
        },
      })
    );

    render(<UpcomingEventButton />);

    await waitFor(() => {
      expect(addListenerSpy).toHaveBeenCalled();
    });

    const callCountAfterMount = (requestGoogleState as jest.Mock).mock.calls.length;

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });

    expect((requestGoogleState as jest.Mock).mock.calls.length).toBeGreaterThan(callCountAfterMount);

    await act(async () => {
      appStateListener?.("active");
    });

    expect((requestGoogleState as jest.Mock).mock.calls.length).toBeGreaterThan(callCountAfterMount + 1);
    addListenerSpy.mockRestore();
  });

  it("logs state refresh errors for non-auth failures", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    (requestGoogleState as jest.Mock).mockResolvedValue(
      response({ ok: false, status: 500, text: "boom" })
    );

    render(<UpcomingEventButton />);

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith("STATE REFRESH ERROR:", expect.any(Error));
    });
    expect(screen.getByText("Import Google Calendar Schedule")).toBeTruthy();
  });
});
