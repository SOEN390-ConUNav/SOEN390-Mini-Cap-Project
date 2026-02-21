import { getOutdoorDirections } from "../api/outdoorDirectionsApi";

globalThis.fetch = jest.fn();

describe("outdoorDirectionsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("successfully fetches directions", async () => {
    const mockData = {
      distance: "1.2 km",
      duration: "15 mins",
      polyline: "abc",
      transportMode: "walking",
      steps: [],
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await getOutdoorDirections(
      "origin",
      "destination",
      "walking",
    );

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("transportMode=walking"),
    );
  });

  it("returns null when API responds 204", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await getOutdoorDirections("origin", "destination");

    expect(result).toBeNull();
  });

  it("returns null and logs error on response !ok", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await getOutdoorDirections("origin", "destination");

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("returns null on network error", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const result = await getOutdoorDirections("origin", "destination");

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "Failed to fetch directions:",
      expect.any(Error),
    );
  });
});
