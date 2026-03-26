import { BUILDING_EXIT_ROOMS } from "../data/buildingExits";

describe("BUILDING_EXIT_ROOMS", () => {
  it("defines the shared indoor exit mapping for supported buildings", () => {
    expect(BUILDING_EXIT_ROOMS).toEqual({
      H: { floor: "1", room: "H1-Maisonneuve-Entry" },
      LB: { floor: "2", room: "LB2-Emergency-Exit-1" },
      MB: { floor: "1", room: "MB1-Main-Entrance" },
      VL: { floor: "1", room: "VL-101" },
      VE: { floor: "1", room: "VE1-Entrance/exit" },
      CC: { floor: "1", room: "CC-Entrance-Exit" },
    });
  });
});
