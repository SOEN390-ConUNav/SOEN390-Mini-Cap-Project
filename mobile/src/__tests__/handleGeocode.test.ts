import { reverseGeocode, formatCoords } from '../services/handleGeocode';
import * as Location from 'expo-location';

jest.mock('expo-location');

const mockReverseGeocodeAsync = Location.reverseGeocodeAsync as jest.MockedFunction<any>
typeof Location.reverseGeocodeAsync;

const COORDS = { latitude: 45.497, longitude: -73.579 };

// Helper to build a partial geocode result
const makeResult = (overrides: Partial<Location.LocationGeocodedAddress>): Location.LocationGeocodedAddress => ({
    name: null,
    street: null,
    streetNumber: null,
    district: null,
    subregion: null,
    city: null,
    region: null,
    country: null,
    postalCode: null,
    isoCountryCode: null,
    timezone: null,
    formattedAddress: null,
    ...overrides,
});

describe('formatCoords', () => {
    it('formats coordinates to 5 decimal places', () => {
        expect(formatCoords(COORDS)).toBe('45.49700, -73.57900');
    });

    it('handles negative latitude and longitude', () => {
        expect(formatCoords({ latitude: -33.86785, longitude: 151.20732 })).toBe(
            '-33.86785, 151.20732',
        );
    });

    it('handles zero values', () => {
        expect(formatCoords({ latitude: 0, longitude: 0 })).toBe('0.00000, 0.00000');
    });
});

describe('reverseGeocode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns formatted coords when results array is empty', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([]);
        expect(await reverseGeocode(COORDS)).toBe('45.49700, -73.57900');
    });

    it('returns name (priority 1) when available', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([
            makeResult({ name: 'Concordia University', street: 'De Maisonneuve', streetNumber: '1455' }),
        ]);
        expect(await reverseGeocode(COORDS)).toBe('Concordia University');
    });

    it('returns streetNumber + street (priority 2) when no name', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([
            makeResult({ streetNumber: '1455', street: 'De Maisonneuve' }),
        ]);
        expect(await reverseGeocode(COORDS)).toBe('1455 De Maisonneuve');
    });

    it('returns street only (priority 3) when no name or streetNumber', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([
            makeResult({ street: 'De Maisonneuve' }),
        ]);
        expect(await reverseGeocode(COORDS)).toBe('De Maisonneuve');
    });

    it('returns district (priority 4) when no name, street, or streetNumber', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([
            makeResult({ district: 'Le Plateau-Mont-Royal' }),
        ]);
        expect(await reverseGeocode(COORDS)).toBe('Le Plateau-Mont-Royal');
    });

    it('returns subregion (priority 5) when no name, street, streetNumber, or district', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([
            makeResult({ subregion: 'Communauté-Urbaine-de-Montréal' }),
        ]);
        expect(await reverseGeocode(COORDS)).toBe('Communauté-Urbaine-de-Montréal');
    });

    it('returns city (priority 6) when only city is available', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([
            makeResult({ city: 'Montreal' }),
        ]);
        expect(await reverseGeocode(COORDS)).toBe('Montreal');
    });

    it('returns formatted coords (priority 7) when all fields are null', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([makeResult({})]);
        expect(await reverseGeocode(COORDS)).toBe('45.49700, -73.57900');
    });

    it('does not use streetNumber + street when streetNumber is missing', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([
            makeResult({ streetNumber: null, street: 'De Maisonneuve' }),
        ]);
        // Should fall to priority 3 (street only), not priority 2
        expect(await reverseGeocode(COORDS)).toBe('De Maisonneuve');
    });

    it('does not use streetNumber + street when street is missing', async () => {
        mockReverseGeocodeAsync.mockResolvedValue([
            makeResult({ streetNumber: '1455', street: null }),
        ]);
        // No street → falls through to district/subregion/city → coords
        expect(await reverseGeocode(COORDS)).toBe('45.49700, -73.57900');
    });

    it('propagates errors thrown by reverseGeocodeAsync', async () => {
        mockReverseGeocodeAsync.mockRejectedValue(new Error('Location permission denied'));
        await expect(reverseGeocode(COORDS)).rejects.toThrow('Location permission denied');
    });
});