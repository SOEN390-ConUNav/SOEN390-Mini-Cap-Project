import { getDistance, isPointWithinRadius } from "geolib";
import { BUILDINGS } from "../data/buildings";
import { Coordinate } from "../type";

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

//FUNCTIONS AND VARIABLES TO CHECK IF SHUTTLE IS A VIABLE MODE OF TRANSPORT
const DEFAULT_RADIUS = 1000;
const SGW_STOP = BUILDINGS.find((b) => b.id == "H")?.marker;
const LOYOLA_STOP = BUILDINGS.find((b) => b.id == "VE")?.marker;

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
    if (isWithinRadius(LOYOLA_STOP, origin, 3000)) return false;
  } else {
    dest_shuttle = isWithinRadius(SGW_STOP, targetCoords, DEFAULT_RADIUS)
      ? "SGW"
      : "";
    if (isWithinRadius(SGW_STOP, origin, 3000)) return false;
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
