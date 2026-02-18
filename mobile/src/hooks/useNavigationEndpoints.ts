import { create } from "zustand";
import { Coordinate } from "../type";

export interface LabeledCoordinate extends Coordinate {
    /** Human-readable name resolved by the geocoding service */
    label: string;
}
interface NavigationEndpointsState {
    origin: LabeledCoordinate | null;
    destination: LabeledCoordinate | null;

    setOrigin: (endpoint: LabeledCoordinate | null) => void;
    setDestination: (endpoint: LabeledCoordinate | null) => void;

    /** Swap origin ↔ destination in one atomic update */
    swap: () => void;

    /** Reset both endpoints (e.g. on back/cancel) */
    clear: () => void;
}


const useNavigationEndpointsStore = create<NavigationEndpointsState>((set) => ({
    origin: null,
    destination: null,

    setOrigin: (endpoint) => set({ origin: endpoint }),
    setDestination: (endpoint) => set({ destination: endpoint }),

    swap: () =>
        set((state) => ({
            origin: state.destination,
            destination: state.origin,
        })),

    clear: () => set({ origin: null, destination: null }),
}));

export default function useNavigationEndpoints() {
    const origin = useNavigationEndpointsStore((s) => s.origin);
    const destination = useNavigationEndpointsStore((s) => s.destination);
    const setOrigin = useNavigationEndpointsStore((s) => s.setOrigin);
    const setDestination = useNavigationEndpointsStore((s) => s.setDestination);
    const swap = useNavigationEndpointsStore((s) => s.swap);
    const clear = useNavigationEndpointsStore((s) => s.clear);

    return { origin, setOrigin, destination, setDestination, swap, clear };
}