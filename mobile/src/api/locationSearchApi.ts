import { API_BASE_URL } from "../const";

export async function searchLocations(
  query: string,
  latitude: number,
  longitude: number
) {
  const response = await fetch(
    `${API_BASE_URL}/api/places/search` +
      `?query=${encodeURIComponent(query)}` +
      `&latitude=${latitude}` +
      `&longitude=${longitude}`
  );

  const json = await response.json();

  return (json.places ?? []).map((p: any, index: number) => ({
    id: p.id ?? p.placeId ?? `${p.displayName?.text}-${index}`,
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? "",
    location: p.location,
    rating: p.rating,
    openingHours: p.currentOpeningHours ?? "N/A",
    phoneNumber: p.nationalPhoneNumber ?? "N/A",
  }));
}
