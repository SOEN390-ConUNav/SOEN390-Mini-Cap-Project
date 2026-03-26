import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react-native";
import ShuttleInfoPage from "../app/shuttle-info/index";
import * as cache from "../services/shuttleScheduleCache";
import { computeNextDepartures } from "../data/ShuttleSchedule";
import type { DeparturesByDay } from "../services/shuttleScheduleCache";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../services/shuttleScheduleCache");
jest.mock("../data/ShuttleSchedule", () => ({
  computeNextDepartures: jest.fn(),
  toMinutes24: jest.fn((t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }),
  nowMinutes: jest.fn(() => 0),
  isFriday: jest.fn(() => false),
  isWeekend: jest.fn(() => false),
}));

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../components/CampusSwitcher", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return ({
    value,
    onChange,
  }: {
    value: "SGW" | "LOYOLA";
    onChange: (c: "SGW" | "LOYOLA") => void;
  }) => (
    <View>
      <Text>{`Campus:${value}`}</Text>
      <Pressable onPress={() => onChange("SGW")}>
        <Text>Switch SGW</Text>
      </Pressable>
      <Pressable onPress={() => onChange("LOYOLA")}>
        <Text>Switch Loyola</Text>
      </Pressable>
    </View>
  );
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

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

const departures = [
  {
    id: "1",
    time: "10:00",
    from: "Henry F. Hall",
    eta: "in 8 min",
    countdownMin: 8,
  },
];

describe("ShuttleInfoPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (computeNextDepartures as jest.Mock).mockReturnValue(departures);
  });

  it("shows loading state initially", () => {
    (cache.getSchedule as jest.Mock).mockReturnValue(new Promise(() => {}));

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

  it("renders schedule and next departures after successful fetch", async () => {
    (cache.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText("Shuttle Schedule")).toBeTruthy();
      expect(screen.getByText("Next Departures")).toBeTruthy();
      expect(screen.getByText("10:00")).toBeTruthy();
    });
  });

  it("routes to map with selected campus", async () => {
    (cache.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText("S.G.W Departures")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("navigate"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home-page)",
      params: { shuttleCampus: "SGW" },
    });
  });

  it("switches campus and updates route destination campus", async () => {
    (cache.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText("S.G.W Departures")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Switch Loyola"));

    await waitFor(() => {
      expect(screen.getByText("Loyola Departures")).toBeTruthy();
      expect(screen.getByText("7141 Sherbrooke St. W.")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("navigate"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home-page)",
      params: { shuttleCampus: "LOYOLA" },
    });
  });

  it("toggles full schedule view and can go back", async () => {
    (cache.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText("View Full Schedule")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View Full Schedule"));

    await waitFor(() => {
      expect(screen.getByText("Monday - Thursday")).toBeTruthy();
      expect(screen.getByText("Friday")).toBeTruthy();
      expect(screen.getByText("arrow-back")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("arrow-back"));

    await waitFor(() => {
      expect(screen.getByText("Next Departures")).toBeTruthy();
    });
  });

  it("shows no departures message when none are available", async () => {
    (cache.getSchedule as jest.Mock).mockResolvedValue(mockSchedule);
    (computeNextDepartures as jest.Mock).mockReturnValue([]);

    render(<ShuttleInfoPage />);

    await waitFor(() => {
      expect(screen.getByText("No more departures today.")).toBeTruthy();
    });
  });
});
