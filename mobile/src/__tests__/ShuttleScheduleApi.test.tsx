import { getShuttleSchedule, getShuttleVersion } from "../api";

jest.mock("../const", () => ({
  API_BASE_URL: "http://mock-api.com",
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockScheduleResponse = {
  schedules: [
    { campus: "SGW", dayType: "WEEKDAY", departureTimes: ["09:00", "10:00"] },
    { campus: "LOYOLA", dayType: "FRIDAY", departureTimes: ["09:15", "10:15"] },
  ],
  version: 3,
};

describe("getShuttleSchedule", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns schedule data on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockScheduleResponse,
    });

    const result = await getShuttleSchedule();

    expect(result).toEqual(mockScheduleResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-api.com/api/shuttle/schedule",
    );
  });

  it("throws when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(getShuttleSchedule()).rejects.toThrow(
      "Shuttle schedule API error: 500",
    );
  });

  it("throws when API_BASE_URL is not defined", async () => {
    jest.resetModules();
    jest.mock("../const", () => ({ API_BASE_URL: "" }));

    const { getShuttleSchedule: getFresh } = require("../api");
    await expect(getFresh()).rejects.toThrow("API_BASE_URL is not defined");
  });
});

describe("getShuttleVersion", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns version number on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 7 }),
    });

    const result = await getShuttleVersion();

    expect(result).toBe(7);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://mock-api.com/api/shuttle/version",
    );
  });

  it("throws when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    await expect(getShuttleVersion()).rejects.toThrow(
      "Shuttle version API error: 404",
    );
  });

  it("throws when API_BASE_URL is not defined", async () => {
    jest.resetModules();
    jest.mock("../const", () => ({ API_BASE_URL: "" }));

    const { getShuttleVersion: getFresh } = require("../api");
    await expect(getFresh()).rejects.toThrow("API_BASE_URL is not defined");
  });

  it("returns correct version from json payload", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 42, extra: "ignored" }),
    });

    const result = await getShuttleVersion();
    expect(result).toBe(42);
  });
});
