jest.mock("expo-constants", () => ({
  expoConfig: { extra: { API_BASE_URL: "http://localhost:8080" } },
}));

import {
  requestGoogleCalendars,
  requestGoogleLogout,
  requestGoogleOAuthExchange,
  requestGoogleState,
  requestSetGoogleSelectedCalendar,
} from "../api/googleCalendarApi";

describe("googleCalendarApi", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls OAuth exchange endpoint with server auth code", async () => {
    await requestGoogleOAuthExchange("auth-code-123");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/google/oauth/exchange",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverAuthCode: "auth-code-123" }),
      })
    );
  });

  it("calls state endpoint with includeCalendars=true", async () => {
    await requestGoogleState(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/google/state?days=7&timeZone=America%2FMontreal&includeCalendars=true"),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("calls state endpoint with includeCalendars=false by default", async () => {
    await requestGoogleState();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/google/state?days=7&timeZone=America%2FMontreal&includeCalendars=false"),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("calls calendars endpoint", async () => {
    await requestGoogleCalendars();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/google/calendars",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("calls selected-calendar endpoint with normalized primary", async () => {
    await requestSetGoogleSelectedCalendar({
      id: "calendar-id",
      summary: "School",
      primary: true,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/google/selected-calendar",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "calendar-id",
          summary: "School",
          primary: true,
        }),
      })
    );
  });

  it("calls logout endpoint", async () => {
    await requestGoogleLogout();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/google/oauth/logout",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });
});
