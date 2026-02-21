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
