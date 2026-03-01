import {
  parseIndoorEventInfo,
  pickEntranceRoom,
  resolveClassroomForFloor,
} from "../utils/eventIndoorNavigation";

describe("eventIndoorNavigation utils", () => {
  it("extracts classroom and floor from details text", () => {
    const info = parseIndoorEventInfo(
      "SGW - Hall Building Rm. H-937",
      "SGW\nHall\nClassroom: H-937\nThu, 10:00 - 11:15",
      "H",
    );

    expect(info).toEqual({ classroom: "H-937", floor: "9" });
  });

  it("extracts floor for basement room", () => {
    const info = parseIndoorEventInfo(
      "John Molson School of Business Rm. MB-S2-101",
      undefined,
      "MB",
    );

    expect(info).toEqual({ classroom: "MB-S2-101", floor: "S2" });
  });

  it("infers floor when classroom line contains only room digits", () => {
    const info = parseIndoorEventInfo(
      "Henry F. Hall Building",
      "SGW\nHall\nClassroom: 937\nThu, 10:00 - 11:15",
      "H",
    );

    expect(info).toEqual({ classroom: "937", floor: "9" });
  });

  it("resolves classroom against available room variants", () => {
    const resolved = resolveClassroomForFloor(
      ["H9-937", "H9-936", "Bishop-Entrance"],
      "H",
      "9",
      "H-937",
    );

    expect(resolved).toBe("H9-937");
  });

  it("selects entrance room by priority", () => {
    const entrance = pickEntranceRoom([
      "Bishop-Entrance",
      "H9-937",
      "Maisonneuve-Entrance",
    ]);

    expect(entrance).toBe("Maisonneuve-Entrance");
  });
});
