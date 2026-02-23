import {
  getManeuverIcon,
  getStreetOnlyInstruction,
} from "../components/navigation-direction/navigationDirectionUtils";

describe("navigationDirectionUtils", () => {
  describe("getManeuverIcon", () => {
    it("maps known maneuver types", () => {
      expect(getManeuverIcon("TURN_LEFT")).toBe("arrow-back");
      expect(getManeuverIcon("TURN_RIGHT")).toBe("arrow-forward");
      expect(getManeuverIcon("KEEP_RIGHT")).toBe("chevron-forward");
    });

    it("falls back for unknown maneuver types", () => {
      expect(getManeuverIcon("UNSPECIFIED" as any)).toBe("arrow-up");
    });
  });

  describe("getStreetOnlyInstruction", () => {
    it("extracts street name after 'onto'", () => {
      expect(
        getStreetOnlyInstruction("Turn left onto Maisonneuve Street"),
      ).toBe("Maisonneuve Street");
    });

    it("extracts label after 'toward'", () => {
      expect(getStreetOnlyInstruction("Head north toward Downtown")).toBe(
        "Downtown",
      );
    });

    it("strips html tags before extraction", () => {
      expect(
        getStreetOnlyInstruction("<b>Turn right</b> onto Guy Street"),
      ).toBe("Guy Street");
    });
  });
});
