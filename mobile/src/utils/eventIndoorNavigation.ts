import { BuildingId } from "../data/buildings";

type IndoorEventInfo = {
  classroom: string | null;
  floor: string | null;
};

const CLASSROOM_LINE_REGEX = /classroom:\s*([^\r\n]+)/i;
const ROOM_WITH_RM_REGEX = /\brm\.?\s*([a-z0-9.\-\s]+)/i;
const ROOM_CODE_REGEX =
  /\b([a-z]{1,3}\s*-?\s*(?:s\d|\d)\s*-?\s*\d{2,4}[a-z]?)\b/i;
const ROOM_NUMBER_ONLY_REGEX = /\b((?:s\d\s*-?\s*)?\d{2,4}[a-z]?)\b/i;

function normalizeToken(value: string): string {
  return value
    .toUpperCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

function extractClassroomToken(
  locationText: string,
  detailsText?: string,
): string | null {
  const details = detailsText ?? "";
  const location = locationText ?? "";

  const classroomLine = details.match(CLASSROOM_LINE_REGEX)?.[1];
  if (classroomLine) {
    const coded = classroomLine.match(ROOM_CODE_REGEX)?.[1];
    if (coded) return normalizeToken(coded);
    const roomNumberOnly = classroomLine.match(ROOM_NUMBER_ONLY_REGEX)?.[1];
    if (roomNumberOnly) return normalizeToken(roomNumberOnly);
    return normalizeToken(classroomLine);
  }

  const fromRm = location.match(ROOM_WITH_RM_REGEX)?.[1];
  if (fromRm) {
    return normalizeToken(fromRm);
  }

  const fromLocationCode = location.match(ROOM_CODE_REGEX)?.[1];
  if (fromLocationCode) {
    return normalizeToken(fromLocationCode);
  }

  const fromDetailsCode = details.match(ROOM_CODE_REGEX)?.[1];
  if (fromDetailsCode) {
    return normalizeToken(fromDetailsCode);
  }

  return null;
}

function extractFloorFromClassroom(
  buildingId: BuildingId,
  classroom: string,
): string | null {
  const prefix = buildingId.toUpperCase();
  const normalizedClassroom = normalizeToken(classroom);

  const suffix = normalizedClassroom.startsWith(prefix)
    ? normalizedClassroom.slice(prefix.length).replace(/^-+/, "")
    : normalizedClassroom;
  if (!suffix) return null;

  // Basement examples: MB-S2-101, S2-101
  const basementMatch = suffix.match(/(?:^|-)S(\d)/);
  if (basementMatch?.[1]) return `S${basementMatch[1]}`;

  // Typical examples: H-937, 937, LB-204, 204
  const trailingRoomDigits = suffix.match(/(\d{2,4}[A-Z]?)$/)?.[1];
  if (trailingRoomDigits?.[0] && /\d/.test(trailingRoomDigits[0])) {
    return trailingRoomDigits[0];
  }

  return null;
}

export function parseIndoorEventInfo(
  locationText: string,
  detailsText: string | undefined,
  buildingId: BuildingId,
): IndoorEventInfo {
  const classroom = extractClassroomToken(locationText, detailsText);
  if (!classroom) {
    return { classroom: null, floor: null };
  }
  const floor = extractFloorFromClassroom(buildingId, classroom);
  return { classroom, floor };
}

function canonical(value: string): string {
  return normalizeToken(value).replace(/[^A-Z0-9]/g, "");
}

export function resolveClassroomForFloor(
  availableRooms: string[],
  buildingId: BuildingId,
  floor: string,
  rawClassroom: string,
): string | null {
  if (!rawClassroom) return null;

  const lookup = new Map<string, string>();
  for (const room of availableRooms) {
    lookup.set(canonical(room), room);
  }

  const direct = lookup.get(canonical(rawClassroom));
  if (direct) return direct;

  const normalized = normalizeToken(rawClassroom);
  const suffix = normalized.match(/(\d{2,4}[A-Z]?)$/)?.[1];
  if (!suffix) return null;

  const prefix = buildingId.toUpperCase();
  const normalizedFloor = floor.toUpperCase();
  const variants = [
    `${prefix}${normalizedFloor}-${suffix}`,
    `${prefix}${normalizedFloor}${suffix}`,
    `${prefix}-${normalizedFloor}${suffix}`,
    `${prefix}-${normalizedFloor}-${suffix}`,
  ];

  for (const variant of variants) {
    const hit = lookup.get(canonical(variant));
    if (hit) return hit;
  }

  return null;
}

export function pickEntranceRoom(availableRooms: string[]): string | null {
  const rankedPatterns = [
    /^MAISONNEUVE-ENTRANCE$/i,
    /^BISHOP-ENTRANCE$/i,
    /^MCKAY-ENTRANCE$/i,
    /^UNDERGROUND-ENTRANCE$/i,
    /ENTRANCE/i,
    /METRO/i,
  ];

  for (const pattern of rankedPatterns) {
    const match = availableRooms.find((room) => pattern.test(room));
    if (match) return match;
  }

  return null;
}
