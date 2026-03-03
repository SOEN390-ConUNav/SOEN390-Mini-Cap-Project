import {
  getOutdoorDirections,
  OutdoorDirectionResponse,
} from "../api/outdoorDirectionsApi";
import { getOutdoorDirectionsWithShuttle } from "../api/outdoorDirectionsApi";
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

//shuttle
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockResponse: OutdoorDirectionResponse = {
  distance: "6.50 km",
  duration: "30 mins",
  polyline: "polyline123",
  transportMode: "shuttle",
  steps: [],
};

describe("getOutdoorDirectionsWithShuttle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns data on success", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: { get: () => "100" },
      json: async () => mockResponse,
    });

    const result = await getOutdoorDirectionsWithShuttle(
      "SGW_Start",
      "LOY_End",
      "LOYOLA",
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("destinationShuttle=LOYOLA"),
    );
  });

  it("returns null on 204 status", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 204,
      ok: true,
      headers: { get: () => null },
      json: async () => null,
    });

    const result = await getOutdoorDirectionsWithShuttle(
      "SGW_Start",
      "LOY_End",
      "LOYOLA",
    );

    expect(result).toBeNull();
  });

  it("returns null when content-length is 0", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: { get: () => "0" },
      json: async () => null,
    });

    const result = await getOutdoorDirectionsWithShuttle(
      "SGW_Start",
      "LOY_End",
      "LOYOLA",
    );

    expect(result).toBeNull();
  });

  it("returns null when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 502,
      ok: false,
      headers: { get: () => "50" },
      json: async () => ({ error: "Bad Gateway" }),
    });

    const result = await getOutdoorDirectionsWithShuttle(
      "SGW_Start",
      "LOY_End",
      "LOYOLA",
    );

    expect(result).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await getOutdoorDirectionsWithShuttle(
      "SGW_Start",
      "LOY_End",
      "LOYOLA",
    );

    expect(result).toBeNull();
  });

  it("encodes origin and destination in the URL", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: { get: () => "100" },
      json: async () => mockResponse,
    });

    await getOutdoorDirectionsWithShuttle(
      "45.495, -73.578",
      "45.458, -73.638",
      "LOYOLA",
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("45.495, -73.578")),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent("45.458, -73.638")),
    );
  });
});
