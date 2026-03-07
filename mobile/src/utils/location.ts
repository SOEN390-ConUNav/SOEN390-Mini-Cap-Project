export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getOpenStatusText(openingHours: any): string {
  if (!openingHours?.periods) return "";

  const now = new Date();
  const todayJS = now.getDay();
  const today = todayJS === 0 ? 6 : todayJS - 1;

  const todayPeriod = openingHours.periods.find(
    (p: any) => p.open.day === today,
  );

  if (!todayPeriod) return "";

  const formatTime = (hour: number, minute: number) => {
    const date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (openingHours.openNow && todayPeriod.close) {
    return `Closes at ${formatTime(
      todayPeriod.close.hour,
      todayPeriod.close.minute,
    )}`;
  }

  if (!openingHours.openNow && todayPeriod.open) {
    return `Opens at ${formatTime(
      todayPeriod.open.hour,
      todayPeriod.open.minute,
    )}`;
  }

  return "";
}
