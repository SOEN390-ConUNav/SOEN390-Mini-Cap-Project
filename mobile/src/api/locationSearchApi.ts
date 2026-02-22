import { API_BASE_URL } from "../const";

export async function searchLocations(query: string): Promise<any[]> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/places/search?query=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error(`Search API error: ${response.status}`);
  }

  const json = await response.json();

  return (json.places ?? []).map((p: any, index: number) => ({
    id: index.toString(),
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? "",
    location: p.location,
  }));
}
