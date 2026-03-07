import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSchedule } from "../services/shuttleScheduleCache";
import * as api from "../api/shuttleScheduleApi";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("../api/shuttleScheduleApi");

const mockScheduleResponse: api.ShuttleScheduleResponse = {
  schedules: [
    { campus: "SGW", dayType: "weekday", departureTimes: ["09:30", "10:00"] },
    { campus: "LOY", dayType: "weekday", departureTimes: ["09:15", "10:15"] },
    { campus: "SGW", dayType: "friday", departureTimes: ["09:45"] },
    { campus: "LOY", dayType: "friday", departureTimes: ["09:15"] },
  ],
  version: 1,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("shuttleScheduleCache", () => {
  it("fetches from API when no cache exists", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (api.getShuttleSchedule as jest.Mock).mockResolvedValue(
      mockScheduleResponse,
    );

    const result = await getSchedule();

    expect(api.getShuttleSchedule).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "shuttle_schedule:cache",
      expect.any(String),
    );
    expect(result.monThu.sgw).toEqual(["09:30", "10:00"]);
    expect(result.monThu.loyola).toEqual(["09:15", "10:15"]);
    expect(result.friday.sgw).toEqual(["09:45"]);
    expect(result.friday.loyola).toEqual(["09:15"]);
  });

  it("returns cached data when cache is still valid", async () => {
    const cachedEnvelope = {
      value: mockScheduleResponse,
      expiresAt: Date.now() + 60_000,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(cachedEnvelope),
    );

    const result = await getSchedule();

    expect(api.getShuttleSchedule).not.toHaveBeenCalled();
    expect(result.monThu.sgw).toEqual(["09:30", "10:00"]);
  });

  it("fetches from API when cached entry is expired", async () => {
    const expiredEnvelope = {
      value: mockScheduleResponse,
      expiresAt: Date.now() - 1,
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(expiredEnvelope),
    );
    (api.getShuttleSchedule as jest.Mock).mockResolvedValue(
      mockScheduleResponse,
    );

    const result = await getSchedule();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      "shuttle_schedule:cache",
    );
    expect(api.getShuttleSchedule).toHaveBeenCalled();
    expect(result.monThu.sgw).toEqual(["09:30", "10:00"]);
  });
});
