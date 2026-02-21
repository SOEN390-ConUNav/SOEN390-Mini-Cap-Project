import { Building, BUILDINGS } from "../data/buildings";

const normalizeLocationText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsAlias = (normalizedLocation: string, alias: string): boolean => {
  const aliasPattern = new RegExp(`\\b${escapeRegExp(alias)}\\b`);
  return aliasPattern.test(normalizedLocation);
};

const BUILDING_ALIAS_INDEX = BUILDINGS.map((building) => {
  const normalizedName = normalizeLocationText(building.name);
  const simplifiedName = normalizedName
    .replace(/\b(building|complex|annex|library|wing|center|centre)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const aliases = new Set<string>([
    normalizeLocationText(building.id),
    normalizedName,
    simplifiedName,
    ...building.aliases.map(normalizeLocationText),
  ]);

  return {
    building,
    aliases: [...aliases].filter((alias) => alias.length >= 2),
  };
});

export const findBuildingFromLocationText = (
  locationText: string,
): Building | null => {
  const trimmed = locationText.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  const roomCodeMatch = upper.match(
    /\b([A-Z]{1,3})[-\s]?[A-Z]?\d{2,4}[A-Z]?\b/,
  );
  if (roomCodeMatch?.[1]) {
    const byRoomCode = BUILDINGS.find(
      (building) => building.id.toUpperCase() === roomCodeMatch[1],
    );
    if (byRoomCode) return byRoomCode;
  }

  const byBuildingId = BUILDINGS.find((building) => {
    const id = building.id.toUpperCase();
    if (id.length === 1) {
      return new RegExp(`\\b${id}[-\\s]?\\d{2,4}[A-Z]?\\b`).test(upper);
    }
    return new RegExp(`\\b${id}(?=\\b|[-\\s])`).test(upper);
  });
  if (byBuildingId) return byBuildingId;

  const normalizedLocation = normalizeLocationText(trimmed);
  const aliasMatches = BUILDING_ALIAS_INDEX.flatMap(({ building, aliases }) =>
    aliases
      .filter((alias) => containsAlias(normalizedLocation, alias))
      .map((alias) => ({ building, score: alias.length })),
  );
  if (aliasMatches.length === 0) return null;

  aliasMatches.sort((a, b) => b.score - a.score);
  return aliasMatches[0].building;
};
