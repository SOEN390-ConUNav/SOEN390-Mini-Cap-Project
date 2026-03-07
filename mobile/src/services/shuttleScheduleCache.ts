import {
  getShuttleSchedule,
  ShuttleScheduleResponse,
} from "../api/shuttleScheduleApi";
import type { CampusKey } from "../data/ShuttleSchedule";
import cacheService from "./cacheService";

const CACHE_NAMESPACE = "shuttle_schedule";
const CACHE_KEY = "cache";
const CACHE_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

export type DeparturesByDay = {
  monThu: Record<CampusKey, string[]>;
  friday: Record<CampusKey, string[]>;
};

async function getCachedSchedule(): Promise<ShuttleScheduleResponse | null> {
  return cacheService.getPersistent<ShuttleScheduleResponse>(
    CACHE_NAMESPACE,
    CACHE_KEY,
  );
}

async function setCachedSchedule(data: ShuttleScheduleResponse): Promise<void> {
  await cacheService.setPersistent(
    CACHE_NAMESPACE,
    CACHE_KEY,
    data,
    CACHE_MAX_AGE_MS,
  );
}

function toDeparturesByDay(response: ShuttleScheduleResponse): DeparturesByDay {
  const monThu: Record<CampusKey, string[]> = { sgw: [], loyola: [] };
  const friday: Record<CampusKey, string[]> = { sgw: [], loyola: [] };

  for (const s of response.schedules) {
    const key: CampusKey = s.campus === "SGW" ? "sgw" : "loyola";
    if (s.dayType === "weekday") {
      monThu[key] = s.departureTimes;
    } else {
      friday[key] = s.departureTimes;
    }
  }

  return { monThu, friday };
}

export async function getSchedule(): Promise<DeparturesByDay> {
  const cached = await getCachedSchedule();

  // 1. Cache hit -> return it
  if (cached) {
    console.log("[SHUTTLE CACHE] HIT - serving cached schedule");
    return toDeparturesByDay(cached);
  }

  // 2. Cache miss/expired -> full fetch
  console.log("[SHUTTLE CACHE] MISS - fetching full schedule from API");
  const fresh = await getShuttleSchedule();
  await setCachedSchedule(fresh);
  console.log("[SHUTTLE CACHE] Stored new schedule in cache");
  return toDeparturesByDay(fresh);
}
