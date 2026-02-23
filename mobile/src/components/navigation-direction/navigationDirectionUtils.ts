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
  const clean = stripHtmlTags(instruction).trim();
  return (
    extractAfterKeyword(clean, "onto", ["toward", "for", "to"]) ||
    extractAfterKeyword(clean, "toward", ["for"]) ||
    extractAfterKeyword(clean, "on", ["toward", "for", "to"]) ||
    clean
  );
}

function stripHtmlTags(value: string): string {
  let out = "";
  let inTag = false;

  for (const ch of value) {
    if (ch === "<") {
      inTag = true;
      continue;
    }
    if (ch === ">") {
      inTag = false;
      continue;
    }
    if (!inTag) out += ch;
  }

  return out;
}

function extractAfterKeyword(
  source: string,
  keyword: string,
  stopWords: readonly string[],
): string | null {
  const lower = source.toLowerCase();
  const key = `${keyword} `;
  const start = lower.indexOf(key);
  if (start < 0) return null;

  let phrase = source.slice(start + key.length).trim();
  if (!phrase) return null;

  const phraseLower = phrase.toLowerCase();
  let cutIndex = phrase.length;

  for (const stopWord of stopWords) {
    const stop = ` ${stopWord} `;
    const idx = phraseLower.indexOf(stop);
    if (idx >= 0 && idx < cutIndex) {
      cutIndex = idx;
    }
  }

  phrase = phrase.slice(0, cutIndex).trim();
  return phrase || null;
}
