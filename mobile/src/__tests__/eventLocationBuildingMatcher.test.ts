import { findBuildingFromLocationText } from "../utils/eventLocationBuildingMatcher";

describe("findBuildingFromLocationText", () => {
  it("returns null for empty input", () => {
    expect(findBuildingFromLocationText("")).toBeNull();
    expect(findBuildingFromLocationText("   ")).toBeNull();
  });

  it("matches room-style codes by building id prefix", () => {
    expect(findBuildingFromLocationText("H-937")?.id).toBe("H");
    expect(findBuildingFromLocationText("HB 125")?.id).toBe("HB");
    expect(findBuildingFromLocationText("VL-101")?.id).toBe("VL");
  });

  it("matches by explicit building id tokens", () => {
    expect(findBuildingFromLocationText("Meet at MB entrance")?.id).toBe("MB");
    expect(
      findBuildingFromLocationText("Class in CC near the atrium")?.id,
    ).toBe("CC");
  });

  it("matches aliases and names case-insensitively", () => {
    expect(findBuildingFromLocationText("SGW - Hall Building Rm 937")?.id).toBe(
      "H",
    );
    expect(findBuildingFromLocationText("John Molson")?.id).toBe("MB");
    expect(findBuildingFromLocationText("student center")?.id).toBe("SC");
    expect(findBuildingFromLocationText("Vanier Library")?.id).toBe("VL");
  });

  it("returns null when no building can be inferred", () => {
    expect(findBuildingFromLocationText("Unknown Place XYZ 999")).toBeNull();
  });

  it("does not match short aliases inside larger words", () => {
    expect(findBuildingFromLocationText("cambridge")).toBeNull();
    expect(findBuildingFromLocationText("nimble")).toBeNull();
    expect(findBuildingFromLocationText("member services office")).toBeNull();
  });

  it("still matches short aliases when they are standalone tokens", () => {
    expect(findBuildingFromLocationText("mb")).toBeTruthy();
    expect(findBuildingFromLocationText("to mb")).toBeTruthy();
    expect(findBuildingFromLocationText("meet at mb, lobby")?.id).toBe("MB");
  });
});
