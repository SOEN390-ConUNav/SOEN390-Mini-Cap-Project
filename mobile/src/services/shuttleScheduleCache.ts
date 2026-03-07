import {
  getShuttleSchedule,
  getShuttleVersion,
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

interface CachedSchedule {
  data: ShuttleScheduleResponse;
  fetchedAt: number;
}

async function getCachedSchedule(): Promise<CachedSchedule | null> {
  return cacheService.getPersistentRaw<CachedSchedule>(
    CACHE_NAMESPACE,
    CACHE_KEY,
  );
}

async function setCachedSchedule(data: ShuttleScheduleResponse): Promise<void> {
  const entry: CachedSchedule = { data, fetchedAt: Date.now() };
  await cacheService.setPersistentRaw(CACHE_NAMESPACE, CACHE_KEY, entry);
}

async function refreshCacheTimestamp(cached: CachedSchedule): Promise<void> {
  cached.fetchedAt = Date.now();
  await cacheService.setPersistentRaw(CACHE_NAMESPACE, CACHE_KEY, cached);
}

function isFresh(cached: CachedSchedule): boolean {
  return Date.now() - cached.fetchedAt < CACHE_MAX_AGE_MS;
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

  // 1. Cache is fresh → return it
  if (cached && isFresh(cached)) {
    console.log("[SHUTTLE CACHE] HIT — serving fresh cache");
    return toDeparturesByDay(cached.data);
  }

  // 2. Cache is stale → check version
  if (cached) {
    console.log("[SHUTTLE CACHE] STALE — checking remote version…");
    try {
      const remoteVersion = await getShuttleVersion();
      if (remoteVersion === cached.data.version) {
        console.log("[SHUTTLE CACHE] Version unchanged — refreshing timestamp");
        await refreshCacheTimestamp(cached);
        return toDeparturesByDay(cached.data);
      }
      console.log("[SHUTTLE CACHE] Version changed — will do full fetch");
    } catch {
      console.log("[SHUTTLE CACHE] Version check failed — will do full fetch");
    }
  }

  // 3. No cache or version changed → full fetch
  console.log("[SHUTTLE CACHE] MISS — fetching full schedule from API");
  const fresh = await getShuttleSchedule();
  await setCachedSchedule(fresh);
  console.log("[SHUTTLE CACHE] Stored new schedule in cache");
  return toDeparturesByDay(fresh);
}
