import { API_BASE_URL } from "../const";

/**
 * Simple backend connectivity test
 */
export async function getHealth(): Promise<string> {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL is not defined");
  }

  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }

  return response.text();
}
