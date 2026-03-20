const POI_PATTERNS: [RegExp | string, string][] = [
  [/bathroom[-_]?women|women.*bathroom/i, "bathroom-women"],
  [/bathroom[-_]?men|men.*bathroom/i, "bathroom-men"],
  [/bathroom/i, "bathroom-men"],
  [/elevator/i, "elevator"],
  [/stairs[-_]?down|stairsdown/i, "stairs-down"],
  [/stairs[-_]?up|stairsup/i, "stairs-up"],
  [/stairs/i, "stairs"],
  [/water[-_]?fountain|waterfountain/i, "water-fountain"],
  [/emergency[-_]?exit|emergency[-_]?stairs/i, "emergency-exit"],
  [/exit|entrance/i, "entrance-exit"],
  [/printer/i, "printer"],
  [/computer[-_]?(station|area)?/i, "computer-station"],
  [/study[-_]?area|sitting[-_]?area|tabling|couch|stand/i, "study-area"],
  [/shelve|bookshelf/i, "bookshelf"],
];

export function inferPoiType(roomId: string): string | null {
  const lower = roomId.toLowerCase();
  for (const [pattern, type] of POI_PATTERNS) {
    if (
      typeof pattern === "string"
        ? lower.includes(pattern)
        : pattern.test(lower)
    ) {
      return type;
    }
  }
  return null;
}

export function getDisplayNameFromRoomId(roomId: string): string {
  return (
    roomId
      .split("-")
      .slice(1)
      .join(" ")
      .replaceAll(/([a-z])([A-Z])/g, "$1 $2") || roomId
  );
}
