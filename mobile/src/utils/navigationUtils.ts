import { getDistance, isPointWithinRadius } from "geolib";
import { BUILDINGS } from "../data/buildings";
import { Coordinate } from "../type";

const MAX_DISTANCE_REGEX_INPUT_LENGTH = 128;
const DISTANCE_KM_REGEX = /^([0-9]{1,6}(?:\.[0-9]{1,3})?)[ \t]{0,4}km$/i;
const DISTANCE_METER_REGEX = /^([0-9]{1,6}(?:\.[0-9]{1,3})?)[ \t]{0,4}m$/i;

export function calculateETA(duration: string) {
  if (!duration || duration === "N/A") return "--:--";

  const now = new Date();
  let totalMinutes = 0;

  const tokens = duration.toLowerCase().split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const val = Number.parseInt(tokens[i], 10);
    if (!Number.isNaN(val)) {
      const nextToken = tokens[i + 1] || "";
      if (nextToken.includes("hour")) {
        totalMinutes += val * 60;
      } else if (nextToken.includes("min")) {
        totalMinutes += val;
      }
    }
  }

  if (totalMinutes === 0) return "--:--";

  now.setMinutes(now.getMinutes() + totalMinutes);

  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function parseDistanceMeters(value: string): number | null {
  if (!value) return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .slice(0, MAX_DISTANCE_REGEX_INPUT_LENGTH);

  const kmMatch = DISTANCE_KM_REGEX.exec(normalized);
  if (kmMatch?.[1]) return Number(kmMatch[1]) * 1000;

  const meterMatch = DISTANCE_METER_REGEX.exec(normalized);
  if (meterMatch?.[1]) return Number(meterMatch[1]);

  return null;
}

//FUNCTIONS AND VARIABLES TO CHECK IF SHUTTLE IS A VIABLE MODE OF TRANSPORT
const DEFAULT_RADIUS = 1000;
const SGW_STOP = BUILDINGS.find((b) => b.id === "H")?.marker;
const LOYOLA_STOP = BUILDINGS.find((b) => b.id === "VE")?.marker;
const RADIUS = 3000;
export function checkAndGetViableShuttleDestination(
  targetCoords: Coordinate,
  origin: Coordinate,
) {
  if (!LOYOLA_STOP || !SGW_STOP) return false;

  const distFromLoyola = getDistance(LOYOLA_STOP, targetCoords);
  const distFromSGW = getDistance(SGW_STOP, targetCoords);
  let dest_shuttle: string;

  if (distFromLoyola < distFromSGW) {
    dest_shuttle = isWithinRadius(LOYOLA_STOP, targetCoords, DEFAULT_RADIUS)
      ? "LOYOLA"
      : "";
    if (isWithinRadius(LOYOLA_STOP, origin, RADIUS)) return false;
  } else {
    dest_shuttle = isWithinRadius(SGW_STOP, targetCoords, DEFAULT_RADIUS)
      ? "SGW"
      : "";
    if (isWithinRadius(SGW_STOP, origin, RADIUS)) return false;
  }
  return dest_shuttle;
}

function isWithinRadius(
  shuttle_stop: Coordinate,
  targetCoords: Coordinate,
  radius: number,
) {
  return isPointWithinRadius(
    {
      latitude: shuttle_stop.latitude,
      longitude: shuttle_stop.longitude,
    },
    { latitude: targetCoords.latitude, longitude: targetCoords.longitude },
    radius,
  );
}
