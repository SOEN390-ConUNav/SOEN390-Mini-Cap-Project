import { Ionicons } from "@expo/vector-icons";
import { ManeuverTypeApi } from "../../type";

export function getManeuverIcon(
  maneuver: ManeuverTypeApi,
): keyof typeof Ionicons.glyphMap {
  switch (maneuver) {
    case "TURN_RIGHT":
    case "RAMP_RIGHT":
    case "FORK_RIGHT":
      return "arrow-forward";
    case "TURN_LEFT":
    case "RAMP_LEFT":
    case "FORK_LEFT":
      return "arrow-back";
    case "TURN_SLIGHT_RIGHT":
    case "KEEP_RIGHT":
      return "chevron-forward";
    case "TURN_SLIGHT_LEFT":
    case "KEEP_LEFT":
      return "chevron-back";
    case "TURN_SHARP_RIGHT":
      return "return-up-forward";
    case "TURN_SHARP_LEFT":
      return "return-up-back";
    case "UTURN_RIGHT":
      return "return-down-forward";
    case "UTURN_LEFT":
      return "return-down-back";
    case "ROUNDABOUT_RIGHT":
    case "ROUNDABOUT_LEFT":
      return "refresh-outline";
    case "MERGE":
      return "git-merge-outline";
    case "FERRY":
      return "boat-outline";
    case "FERRY_TRAIN":
      return "train-outline";
    default:
      return "arrow-up";
  }
}

export function getStreetOnlyInstruction(instruction?: string): string {
  if (!instruction) return "";
  const clean = instruction.replace(/<[^>]+>/g, "").trim();

  const onto = clean.match(/\bonto\s+(.+?)(?:\s+(?:toward|for|to)\b|$)/i);
  if (onto?.[1]) return onto[1].trim();

  const toward = clean.match(/\btoward\s+(.+?)(?:\s+for\b|$)/i);
  if (toward?.[1]) return toward[1].trim();

  const on = clean.match(/\bon\s+(.+?)(?:\s+(?:toward|for|to)\b|$)/i);
  if (on?.[1]) return on[1].trim();

  return clean;
}
