import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import ShuttleInfoPage from "../app/shuttle-info/index";
import * as cache from "../services/shuttleScheduleCache";
import type { DeparturesByDay } from "../services/shuttleScheduleCache";

jest.mock("../services/shuttleScheduleCache");


jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockSchedule: DeparturesByDay = {
  monThu: {
    sgw: ["09:30", "10:00", "14:00", "15:00", "18:00"],
    loyola: ["09:15", "10:15", "14:15", "15:15", "18:15"],
  },
  friday: {
    sgw: ["09:45", "10:15", "14:00"],
    loyola: ["09:15", "10:45", "14:30"],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ShuttleInfoPage", () => {
  it("shows loading state initially", () => {
    (cache.getSchedule as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    render(<ShuttleInfoPage />);

    expect(screen.getByText(/loading shuttle schedule/i)).toBeTruthy();
  });

  it("shows error state when fetch fails", async () => {
    (cache.getSchedule as jest.Mock).mockRejectedValue(new Error("fail"));

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load shuttle schedule/i)).toBeTruthy();
    });
  });

  it("renders schedule after successful fetch", async () => {
    (cache.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText("Shuttle Schedule")).toBeTruthy();
    });
  });

  it("shows SGW departures by default", async () => {
    (cache.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText("S.G.W Departures")).toBeTruthy();
      expect(screen.getByText("1455 Blvd. De Maisonneuve Ouest")).toBeTruthy();
    });
  });

  it("shows View Full Schedule button", async () => {
    (cache.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText("View Full Schedule")).toBeTruthy();
    });
  });
});
