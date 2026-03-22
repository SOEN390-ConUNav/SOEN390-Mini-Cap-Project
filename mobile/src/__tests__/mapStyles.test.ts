import { DARK_MAP_STYLE } from "../constants/mapStyles";

describe("mapStyles", () => {
  it("exports a non-empty dark map style", () => {
    expect(Array.isArray(DARK_MAP_STYLE)).toBe(true);
    expect(DARK_MAP_STYLE.length).toBeGreaterThan(3);
    expect(DARK_MAP_STYLE[0]).toHaveProperty("stylers");
  });
});
