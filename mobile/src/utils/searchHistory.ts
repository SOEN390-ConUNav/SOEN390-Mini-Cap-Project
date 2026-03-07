import cacheService from "../services/cacheService";

const CACHE_NAMESPACE = "search_history";
const KEY = "items";
const MAX_HISTORY = 10;

export type SearchHistoryItem = {
  query: string;
  timestamp: number;
};

export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  const history = await cacheService.getPersistentRaw<SearchHistoryItem[]>(
    CACHE_NAMESPACE,
    KEY,
  );
  return history ?? [];
}

export async function addSearchHistory(query: string) {
  const history = await getSearchHistory();

  // Remove duplicate of same query
  const filtered = history.filter((item) => item.query !== query);

  // Add new entry
  const newHistory = [{ query, timestamp: Date.now() }, ...filtered].slice(
    0,
    MAX_HISTORY,
  );

  await cacheService.setPersistentRaw(CACHE_NAMESPACE, KEY, newHistory);
}
