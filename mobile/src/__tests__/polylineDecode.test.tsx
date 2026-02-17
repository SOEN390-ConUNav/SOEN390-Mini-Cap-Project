import { decodePolyline } from '../utils/polylineDecode';

describe('decodePolyline', () => {
  it('decodes a simple polyline string into an array of coordinates', () => {
    const encoded = '_p~iF~ps|U_ulLnnqC';
    const result = decodePolyline(encoded);

    expect(result).toHaveLength(2);

    expect(result[0].latitude).toBeCloseTo(38.5);
    expect(result[0].longitude).toBeCloseTo(-120.2);

    expect(result[1].latitude).toBeCloseTo(40.7);
    expect(result[1].longitude).toBeCloseTo(-120.95);
  });

  it('returns an empty array when given an empty string', () => {
    const result = decodePolyline('');
    expect(result).toEqual([]);
  });

  it('handles a single point polyline', () => {
    const encoded = '??';
    const result = decodePolyline(encoded);

    expect(result).toEqual([{ latitude: 0, longitude: 0 }]);
  });
});
