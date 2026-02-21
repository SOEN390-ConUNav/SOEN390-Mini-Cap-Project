describe("googleCalendarApi missing API_BASE_URL", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("throws when API_BASE_URL is not configured", () => {
    jest.doMock("expo-constants", () => ({
      expoConfig: { extra: {} },
    }));

    jest.isolateModules(() => {
      const api = require("../api/googleCalendarApi");
      expect(() => api.requestGoogleCalendars()).toThrow(
        "API_BASE_URL is missing (check .env + app.config.ts)"
      );
    });
  });
});
