import { act, renderHook } from '@testing-library/react-native';
import useNavigationInfo from '../hooks/useNavigationInfo';

describe('useNavigationInfo', () => {
    afterEach(() => {
        const { result } = renderHook(() => useNavigationInfo());
        act(() => {
            result.current.setPathDistance('0');
            result.current.setPathDuration('0');
            result.current.setIsLoading(false);
        });
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useNavigationInfo());
        expect(result.current.pathDistance).toBe('0');
        expect(result.current.pathDuration).toBe('0');
        expect(result.current.isLoading).toBe(false);
    });

    it('sets pathDistance correctly', () => {
        const { result } = renderHook(() => useNavigationInfo());
        act(() => result.current.setPathDistance('5 km'));
        expect(result.current.pathDistance).toBe('5 km');
    });

    it('sets pathDuration correctly', () => {
        const { result } = renderHook(() => useNavigationInfo());
        act(() => result.current.setPathDuration('10 min'));
        expect(result.current.pathDuration).toBe('10 min');
    });

    it('sets isLoading to true', () => {
        const { result } = renderHook(() => useNavigationInfo());
        act(() => result.current.setIsLoading(true));
        expect(result.current.isLoading).toBe(true);
    });

    it('sets isLoading back to false', () => {
        const { result } = renderHook(() => useNavigationInfo());
        act(() => result.current.setIsLoading(true));
        act(() => result.current.setIsLoading(false));
        expect(result.current.isLoading).toBe(false);
    });

    it('updates pathDistance without affecting other state', () => {
        const { result } = renderHook(() => useNavigationInfo());
        act(() => result.current.setPathDuration('10 min'));
        act(() => result.current.setPathDistance('5 km'));
        expect(result.current.pathDuration).toBe('10 min');
        expect(result.current.isLoading).toBe(false);
    });

    it('exposes setPathDistance, setPathDuration and setIsLoading as functions', () => {
        const { result } = renderHook(() => useNavigationInfo());
        expect(typeof result.current.setPathDistance).toBe('function');
        expect(typeof result.current.setPathDuration).toBe('function');
        expect(typeof result.current.setIsLoading).toBe('function');
    });
});