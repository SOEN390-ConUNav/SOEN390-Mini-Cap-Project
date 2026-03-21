import { getDimOverlayOpacity } from "../utils/layoutDimOpacity";

describe("getDimOverlayOpacity", () => {
  it("returns 0 when auto brightness is on", () => {
    expect(getDimOverlayOpacity(50, true)).toBe(0);
  });

  it("returns 0 when brightness is full", () => {
    expect(getDimOverlayOpacity(100, false)).toBe(0);
  });

  it("returns scaled opacity when manual dim", () => {
    expect(getDimOverlayOpacity(0, false)).toBe(0.5);
    expect(getDimOverlayOpacity(50, false)).toBeCloseTo(0.25);
  });
});
