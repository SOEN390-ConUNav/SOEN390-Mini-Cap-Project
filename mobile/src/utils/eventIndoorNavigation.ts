import { getAvailableRooms } from "../api/indoorDirectionsApi";
import { BuildingId } from "../data/buildings";
import { getAvailableFloors } from "./buildingIndoorMaps";
import { findBuildingFromLocationText } from "./eventLocationBuildingMatcher";

export type EventDirectionsRequest = {
  locationText: string;
  detailsText: string;
};

export type EventIndoorTarget = {
  buildingId: BuildingId;
  floor: string | null;
  startFloor: string | null;
  floorSupported: boolean;
  destinationRoom: string | null;
  startRoom: string | null;
};

type RoomIndex = {
  floor: string;
  rooms: string[];
};

const MAX_REGEX_INPUT_LENGTH = 2048;
const MAX_REGEX_MATCHES = 200;
const MAX_REGEX_CAPTURE_LENGTH = 48;
const CLASSROOM_LINE_REGEX =
  /\b(?:classroom|room|rm)\b[ \t]{0,6}[:#-]?[ \t]{0,6}([^\n\r]{1,120})/i;
const FLOOR_LINE_REGEX =
  /\b(?:floor|flr|niveau)\b[ \t]{0,6}[:#-]?[ \t]{0,6}(S?\d{1,2})\b/i;
const ROOM_MARKER_REGEX =
  /\b(?:RM|ROOM)\b[ \t]{0,6}[:#-]?[ \t]{0,6}([A-Z0-9][A-Z0-9.\-/]{0,23})\b/gi;
const PREFIXED_ROOM_REGEX =
  /\b([A-Z]{1,3}[ \t]{0,3}-?[ \t]{0,3}S?\d[A-Z0-9.\-/]{0,15})\b/gi;
const ROOM_NUMBER_REGEX = /\b(S\d[.\-]?\d{2,4}|\d{3,4})\b/gi;

const safeRegexInput = (value: string): string =>
  value.length > MAX_REGEX_INPUT_LENGTH
    ? value.slice(0, MAX_REGEX_INPUT_LENGTH)
    : value;

const normalizeRoom = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, "")
    .trim();

const compactRoom = (value: string): string =>
  normalizeRoom(value).replace(/[^A-Z0-9]/g, "");

const getRoomSuffix = (value: string): string => {
  const normalized = normalizeRoom(value);
  const lastSegment = normalized.split("-").at(-1) ?? normalized;
  return lastSegment.replace(/[^A-Z0-9.]/g, "");
};

const inferFloorFromCandidate = (
  candidate: string,
  buildingId: BuildingId,
): string | null => {
  const normalized = normalizeRoom(candidate);

  const subFloor = normalized.match(/S(\d)/);
  if (subFloor?.[1]) return `S${subFloor[1]}`;

  const dottedFloor = normalized.match(/\b(\d)\.\d{2,4}\b/);
  if (dottedFloor?.[1]) return dottedFloor[1];

  const explicit = normalized.match(/^[A-Z]{1,3}-?(\d)-/);
  if (explicit?.[1]) return explicit[1];

  const digits = normalized.match(/(\d{3,4})/);
  if (digits?.[1]) {
    const first = digits[1][0];
    if (buildingId === "H") return first;
    if (["LB", "VL", "VE", "CC", "MB"].includes(buildingId)) return first;
  }

  return null;
};

const tokenizeForMatch = (value: string): Set<string> => {
  const normalized = normalizeRoom(value);
  const compact = compactRoom(normalized);
  const suffix = getRoomSuffix(normalized);
  const tokens = new Set<string>();

  if (compact.length >= 2) tokens.add(compact);
  if (suffix.length >= 2) tokens.add(suffix.replace(/\./g, ""));

  const digitsOnly = compact.replace(/\D/g, "");
  if (digitsOnly.length >= 3) tokens.add(digitsOnly);

  const numbered = normalized.match(/(\d{3,4})/);
  if (numbered?.[1]) tokens.add(numbered[1]);

  const roomAfterSubFloor = normalized.match(/S\d[.\-]?(\d{2,4})/);
  if (roomAfterSubFloor?.[1]) tokens.add(roomAfterSubFloor[1]);

  return tokens;
};

const scoreRoomMatch = (
  candidate: string,
  room: string,
  roomFloor: string,
  buildingId: BuildingId,
): number => {
  const normalizedCandidate = normalizeRoom(candidate);
  const normalizedRoom = normalizeRoom(room);
  const compactCandidate = compactRoom(normalizedCandidate);
  const compactRoomId = compactRoom(normalizedRoom);

  if (!compactCandidate || !compactRoomId) return Number.NEGATIVE_INFINITY;

  let score = Number.NEGATIVE_INFINITY;

  if (normalizedRoom === normalizedCandidate) {
    score = 1200;
  }

  if (compactRoomId === compactCandidate) {
    score = Math.max(score, 1150);
  }

  const suffixCandidate = getRoomSuffix(normalizedCandidate).replace(/\./g, "");
  const suffixRoom = getRoomSuffix(normalizedRoom).replace(/\./g, "");
  if (suffixCandidate.length >= 2 && suffixCandidate === suffixRoom) {
    score = Math.max(score, 1050);
  }

  if (
    compactCandidate.length >= 3 &&
    compactRoomId.endsWith(compactCandidate)
  ) {
    score = Math.max(score, 980);
  }

  const candidateTokens = tokenizeForMatch(normalizedCandidate);
  const roomTokens = tokenizeForMatch(normalizedRoom);
  let bestTokenLength = 0;
  candidateTokens.forEach((token) => {
    if (token.length >= 3 && roomTokens.has(token)) {
      bestTokenLength = Math.max(bestTokenLength, token.length);
    }
  });
  if (bestTokenLength > 0) {
    score = Math.max(score, 820 + bestTokenLength);
  }

  if (!Number.isFinite(score)) {
    return Number.NEGATIVE_INFINITY;
  }

  const inferredFloor = inferFloorFromCandidate(
    normalizedCandidate,
    buildingId,
  );
  if (inferredFloor) {
    score += inferredFloor === roomFloor ? 120 : -80;
  }

  return score;
};

const pushCandidate = (set: Set<string>, value: string | undefined | null) => {
  if (!value) return;
  const normalized = normalizeRoom(value)
    .replace(/^RM[-:]?/, "")
    .replace(/^ROOM[-:]?/, "");
  if (normalized.length >= 2) {
    set.add(normalized);
  }
};

const collectRegexMatches = (set: Set<string>, text: string, regex: RegExp) => {
  const safeText = safeRegexInput(text);
  regex.lastIndex = 0;
  for (let i = 0; i < MAX_REGEX_MATCHES; i += 1) {
    const match = regex.exec(safeText);
    if (!match?.[1]) break;
    pushCandidate(set, match[1].slice(0, MAX_REGEX_CAPTURE_LENGTH));
    if (match[0].length === 0) {
      regex.lastIndex += 1;
    }
  }
};

const parseRoomCandidates = (
  detailsText: string,
  locationText: string,
): string[] => {
  const candidates = new Set<string>();
  const safeLocationText = safeRegexInput(locationText);
  const safeDetailsText = safeRegexInput(detailsText);
  const mergedText = `${safeLocationText}\n${safeDetailsText}`;

  const classroomLine = CLASSROOM_LINE_REGEX.exec(safeDetailsText)?.[1];
  if (classroomLine) {
    collectRegexMatches(candidates, classroomLine, ROOM_MARKER_REGEX);
    collectRegexMatches(candidates, classroomLine, PREFIXED_ROOM_REGEX);
    collectRegexMatches(candidates, classroomLine, ROOM_NUMBER_REGEX);
    const firstToken = classroomLine.trim().split(" ")[0];
    pushCandidate(candidates, firstToken);
  }

  collectRegexMatches(candidates, mergedText, ROOM_MARKER_REGEX);
  collectRegexMatches(candidates, mergedText, PREFIXED_ROOM_REGEX);
  collectRegexMatches(candidates, mergedText, ROOM_NUMBER_REGEX);

  return Array.from(candidates);
};

const resolveBestRoomMatch = (
  roomCandidates: string[],
  roomIndex: RoomIndex[],
  buildingId: BuildingId,
): { room: string; floor: string } | null => {
  if (!roomCandidates.length) return null;

  let best: { room: string; floor: string; score: number } | null = null;

  for (const floorEntry of roomIndex) {
    for (const room of floorEntry.rooms) {
      for (const candidate of roomCandidates) {
        const score = scoreRoomMatch(
          candidate,
          room,
          floorEntry.floor,
          buildingId,
        );
        if (!Number.isFinite(score)) continue;
        if (!best || score > best.score) {
          best = { room, floor: floorEntry.floor, score };
        }
      }
    }
  }

  if (!best || best.score < 820) {
    return null;
  }

  return { room: best.room, floor: best.floor };
};

const parseFloorCandidate = (
  detailsText: string,
  roomCandidates: string[],
  buildingId: BuildingId,
): string | null => {
  const floorFromDetails = FLOOR_LINE_REGEX.exec(
    safeRegexInput(detailsText),
  )?.[1]?.toUpperCase();
  if (floorFromDetails) return floorFromDetails;

  for (const candidate of roomCandidates) {
    const inferred = inferFloorFromCandidate(candidate, buildingId);
    if (inferred) return inferred;
  }

  return null;
};

const scoreStartRoom = (room: string): number => {
  const lower = room.toLowerCase();
  if (/(entrance|entry)/.test(lower)) return 100;
  if (/elevator/.test(lower) && /main/.test(lower)) return 90;
  if (/stairs?/.test(lower) && /main/.test(lower)) return 80;
  if (/elevator/.test(lower)) return 70;
  if (/stairs?/.test(lower)) return 60;
  if (/exit/.test(lower) && !/emergency/.test(lower)) return 50;
  if (/exit/.test(lower)) return 30;
  return 0;
};

const resolveStartRoom = (
  availableRooms: string[],
  destinationRoom: string | null,
): string | null => {
  if (availableRooms.length === 0) return null;

  const pool = availableRooms.filter(
    (room) => room.toUpperCase() !== destinationRoom?.toUpperCase(),
  );
  if (pool.length === 0) return null;

  const scored = pool
    .map((room) => ({ room, score: scoreStartRoom(room) }))
    .sort((a, b) => b.score - a.score || a.room.localeCompare(b.room));

  return scored[0].score > 0 ? scored[0].room : null;
};

const resolveSpecialStartRoom = (
  availableRooms: string[],
  buildingId: BuildingId,
  floor: string,
): string | null => {
  if (buildingId !== "MB" || !/^S\d+$/i.test(floor)) {
    return null;
  }

  const elevators = availableRooms
    .filter((room) => /elevator/i.test(room))
    .sort((a, b) => {
      const aMain = /main/i.test(a) ? 1 : 0;
      const bMain = /main/i.test(b) ? 1 : 0;
      if (aMain !== bMain) return bMain - aMain;
      return a.localeCompare(b);
    });

  return elevators[0] ?? null;
};

export const buildEventIndoorTarget = async (
  request: EventDirectionsRequest,
): Promise<EventIndoorTarget | null> => {
  const building =
    findBuildingFromLocationText(request.locationText) ||
    findBuildingFromLocationText(request.detailsText) ||
    findBuildingFromLocationText(
      `${request.locationText} ${request.detailsText}`,
    );

  if (!building) return null;

  const buildingId = building.id as BuildingId;
  const availableFloors = getAvailableFloors(buildingId);
  if (!availableFloors.length) {
    return {
      buildingId,
      floor: null,
      startFloor: null,
      floorSupported: false,
      destinationRoom: null,
      startRoom: null,
    };
  }

  const roomCandidates = parseRoomCandidates(
    request.detailsText,
    request.locationText,
  );

  const roomIndex = await Promise.all(
    availableFloors.map(async (floor): Promise<RoomIndex> => {
      try {
        const fetched = await getAvailableRooms(buildingId, floor);
        return {
          floor,
          rooms: Array.isArray(fetched) ? fetched : [],
        };
      } catch {
        return { floor, rooms: [] };
      }
    }),
  );

  const bestMatch = resolveBestRoomMatch(roomCandidates, roomIndex, buildingId);
  const explicitFloor = parseFloorCandidate(
    request.detailsText,
    roomCandidates,
    buildingId,
  );

  const resolvedFloor = bestMatch?.floor ?? explicitFloor ?? null;
  const floorSupported =
    !!resolvedFloor && availableFloors.includes(resolvedFloor);

  if (!floorSupported || !resolvedFloor) {
    return {
      buildingId,
      floor: resolvedFloor,
      startFloor: null,
      floorSupported: false,
      destinationRoom: bestMatch?.room ?? roomCandidates[0] ?? null,
      startRoom: null,
    };
  }

  const floorRooms =
    roomIndex.find((entry) => entry.floor === resolvedFloor)?.rooms ?? [];
  const destinationRoom = bestMatch?.room ?? roomCandidates[0] ?? null;
  const startFloor = resolvedFloor;
  const startRoom =
    resolveSpecialStartRoom(floorRooms, buildingId, resolvedFloor) ??
    resolveStartRoom(floorRooms, destinationRoom);

  return {
    buildingId,
    floor: resolvedFloor,
    startFloor,
    floorSupported: true,
    destinationRoom,
    startRoom,
  };
};
