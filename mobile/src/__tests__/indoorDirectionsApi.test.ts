import {
  getIndoorDirections,
  getAvailableRooms,
  getRoomPoints,
  getPointsOfInterest,
  getWaypoints,
} from '../api/indoorDirectionsApi';



const mockFetch = (body: unknown, ok = true, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
};



beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});



describe('getIndoorDirections', () => {
  it('calls the correct URL and returns the response', async () => {
    const payload = { distance: '50m', duration: '1 min', steps: [] };
    mockFetch(payload);

    const result = await getIndoorDirections('Hall-8', 'H-831', 'H-832');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url: string = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('/api/directions/indoor');
    expect(url).toContain('buildingId=Hall-8');
    expect(url).toContain('origin=H-831');
    expect(url).toContain('destination=H-832');
    expect(result).toEqual(payload);
  });

  it('appends optional floor params when provided', async () => {
    mockFetch({});
    await getIndoorDirections('Hall-8', 'H-831', 'H-832', '8', '9');

    const url: string = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('originFloor=8');
    expect(url).toContain('destinationFloor=9');
  });

  it('throws on non-ok response', async () => {
    mockFetch('Not Found', false, 404);

    await expect(
      getIndoorDirections('Hall-8', 'H-831', 'H-832'),
    ).rejects.toThrow('Backend error (404)');
  });

  it('wraps network errors with a helpful message', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network request failed'),
    );

    await expect(
      getIndoorDirections('Hall-8', 'H-831', 'H-832'),
    ).rejects.toThrow('Cannot connect to backend');
  });
});



describe('getAvailableRooms', () => {
  it('returns sorted rooms on success', async () => {
    mockFetch(['H-832', 'H-831', 'H-820']);
    const rooms = await getAvailableRooms('Hall-8');

    expect(rooms).toEqual(['H-820', 'H-831', 'H-832']);
  });

  it('appends floor param when provided', async () => {
    mockFetch([]);
    await getAvailableRooms('Hall-8', '9');

    const url: string = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('floor=9');
  });

  it('returns empty array on non-ok response', async () => {
    mockFetch('error', false, 500);
    const rooms = await getAvailableRooms('Hall-8');
    expect(rooms).toEqual([]);
  });

  it('returns empty array when response is not an array', async () => {
    mockFetch({ oops: true });
    const rooms = await getAvailableRooms('Hall-8');
    expect(rooms).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const rooms = await getAvailableRooms('Hall-8');
    expect(rooms).toEqual([]);
  });
});



describe('getRoomPoints', () => {
  it('returns room points on success', async () => {
    const points = [{ x: 1, y: 2, id: 'r1' }];
    mockFetch(points);

    const result = await getRoomPoints('Hall-8');
    expect(result).toEqual(points);
  });

  it('returns empty array on failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const result = await getRoomPoints('Hall-8');
    expect(result).toEqual([]);
  });

  it('returns empty array when response is not an array', async () => {
    mockFetch('not-array');
    const result = await getRoomPoints('Hall-8');
    expect(result).toEqual([]);
  });
});



describe('getPointsOfInterest', () => {
  it('returns POIs on success', async () => {
    const pois = [{ x: 1, y: 2, id: 'p1', displayName: 'Elev', type: 'elevator' }];
    mockFetch(pois);

    const result = await getPointsOfInterest('Hall-8', '8');
    expect(result).toEqual(pois);
    const url: string = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('floor=8');
  });

  it('returns empty array on failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const result = await getPointsOfInterest('Hall-8');
    expect(result).toEqual([]);
  });
});



describe('getWaypoints', () => {
  it('returns waypoints on success', async () => {
    const wps = [{ x: 10, y: 20, id: 'w1' }];
    mockFetch(wps);

    const result = await getWaypoints('Hall-8');
    expect(result).toEqual(wps);
  });

  it('returns empty array on failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const result = await getWaypoints('Hall-8');
    expect(result).toEqual([]);
  });

  it('returns empty array when response is not an array', async () => {
    mockFetch({ bad: true });
    const result = await getWaypoints('Hall-8');
    expect(result).toEqual([]);
  });
});
