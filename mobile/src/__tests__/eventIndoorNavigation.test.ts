import { getAvailableRooms } from "../api/indoorDirectionsApi";
import { buildEventIndoorTarget } from "../utils/eventIndoorNavigation";
import { getAvailableFloors } from "../utils/buildingIndoorMaps";
import { findBuildingFromLocationText } from "../utils/eventLocationBuildingMatcher";

jest.mock("../api/indoorDirectionsApi", () => ({
  getAvailableRooms: jest.fn(),
}));

jest.mock("../utils/buildingIndoorMaps", () => ({
  getAvailableFloors: jest.fn(),
}));

jest.mock("../utils/eventLocationBuildingMatcher", () => ({
  findBuildingFromLocationText: jest.fn(),
}));

describe("eventIndoorNavigation", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns null when no building matches the event location", async () => {
    (findBuildingFromLocationText as jest.Mock).mockReturnValue(null);

    const target = await buildEventIndoorTarget({
      locationText: "Unknown place",
      detailsText: "Classroom: H-937",
    });

    expect(target).toBeNull();
    expect(getAvailableRooms).not.toHaveBeenCalled();
  });

  it("marks unsupported floor and skips room resolution", async () => {
    (findBuildingFromLocationText as jest.Mock).mockReturnValue({ id: "H" });
    (getAvailableFloors as jest.Mock).mockReturnValue(["1", "2", "8"]);
    (getAvailableRooms as jest.Mock).mockResolvedValue([]);

    const target = await buildEventIndoorTarget({
      locationText: "Hall Building",
      detailsText: "SGW\nHall\nClassroom: H-937\nThu, 10:00 - 11:15",
    });

    expect(target).toEqual({
      buildingId: "H",
      floor: "9",
      startFloor: null,
      floorSupported: false,
      destinationRoom: "H-937",
      startRoom: null,
    });
    expect(getAvailableRooms).toHaveBeenCalledTimes(3);
  });

  it("resolves classroom and selects a likely indoor start room", async () => {
    (findBuildingFromLocationText as jest.Mock).mockReturnValue({ id: "H" });
    (getAvailableFloors as jest.Mock).mockReturnValue(["1", "8", "9"]);
    (getAvailableRooms as jest.Mock).mockImplementation(
      async (_buildingId: string, floor: string) => {
        if (floor === "1") {
          return ["H1-Maisonneuve-Entry", "Hall-Elevator-Main"];
        }
        if (floor === "9") {
          return ["H9-937", "Hall-Elevator-Main", "H9-Emergency-Exit-975"];
        }
        return [];
      },
    );

    const target = await buildEventIndoorTarget({
      locationText: "H-937",
      detailsText: "SGW\nHall\nClassroom: H-937\nThu, 10:00 - 11:15",
    });

    expect(target).toEqual({
      buildingId: "H",
      floor: "9",
      startFloor: "9",
      floorSupported: true,
      destinationRoom: "H9-937",
      startRoom: "Hall-Elevator-Main",
    });
  });

  it("matches calendar format with building name and Rm token", async () => {
    (findBuildingFromLocationText as jest.Mock).mockReturnValue({ id: "MB" });
    (getAvailableFloors as jest.Mock).mockReturnValue(["1", "S2"]);
    (getAvailableRooms as jest.Mock).mockImplementation(
      async (_buildingId: string, floor: string) => {
        if (floor === "S2") {
          return ["MB-S2-330", "MB-Elevator-Main"];
        }
        return ["MB-1-101"];
      },
    );

    const target = await buildEventIndoorTarget({
      locationText: "John Molson School of Business Rm S2.330",
      detailsText: "John Molson School of Business\nRm S2.330",
    });

    expect(target).toEqual({
      buildingId: "MB",
      floor: "S2",
      startFloor: "S2",
      floorSupported: true,
      destinationRoom: "MB-S2-330",
      startRoom: "MB-Elevator-Main",
    });
  });

  it("prefers elevator as start room for MB basement floors", async () => {
    (findBuildingFromLocationText as jest.Mock).mockReturnValue({ id: "MB" });
    (getAvailableFloors as jest.Mock).mockReturnValue(["1", "S2"]);
    (getAvailableRooms as jest.Mock).mockImplementation(
      async (_buildingId: string, floor: string) => {
        if (floor === "S2") {
          return ["MBS2-Entrance-Exit", "MB-Elevator-Main", "MB-S2-330"];
        }
        return ["MB-1-101"];
      },
    );

    const target = await buildEventIndoorTarget({
      locationText: "John Molson School of Business Rm S2.330",
      detailsText: "John Molson School of Business\nRm S2.330",
    });

    expect(target).toEqual({
      buildingId: "MB",
      floor: "S2",
      startFloor: "S2",
      floorSupported: true,
      destinationRoom: "MB-S2-330",
      startRoom: "MB-Elevator-Main",
    });
  });
});
