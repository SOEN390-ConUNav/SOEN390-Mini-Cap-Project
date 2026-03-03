export const BURGUNDY = "#800020";
export const POLYLINE_STYLES: Record<
  string,
  { color: string; dash?: number[] }
> = {
  WALK: { color: BURGUNDY, dash: [2, 5] }, // Dotted Red
  SHUTTLE: { color: BURGUNDY }, // Solid Red
  BUS: { color: "#0085CA" }, // Solid Blue
  BIKE: { color: "#228B22", dash: [10, 5] }, // Dashed Green
  CAR: { color: "#808080" }, // Solid Gray
};

export const inferStyleFromInstruction = (
  instruction: string,
  defaultMode: string,
) => {
  const mode = defaultMode.toUpperCase();

  // For walk, bike, car — skip instruction parsing, use mode directly
  if (mode === "WALK" || mode === "WALKING") return POLYLINE_STYLES.WALK;
  if (mode === "BIKE" || mode === "BICYCLING") return POLYLINE_STYLES.BIKE;
  if (mode === "CAR" || mode === "DRIVING") return POLYLINE_STYLES.CAR;

  const text = instruction.toLowerCase();

  // If instruction mentions walking, use walk style
  if (text.includes("walk") || text.includes("head ")) {
    return POLYLINE_STYLES.WALK;
  }

  // If instruction mentions shuttle
  if (text.includes("shuttle")) {
    return POLYLINE_STYLES.SHUTTLE;
  }

  // If instruction mentions transit/bus/train
  if (
    text.includes("bus") ||
    text.includes("train") ||
    text.includes("take ") ||
    text.includes("metro")
  ) {
    return POLYLINE_STYLES.BUS;
  }

  // Fallback to the overall route mode style
  if (mode === "SHUTTLE") return POLYLINE_STYLES.SHUTTLE;
  if (mode === "BUS" || mode === "TRANSIT") return POLYLINE_STYLES.BUS;

  return POLYLINE_STYLES.WALK;
};
