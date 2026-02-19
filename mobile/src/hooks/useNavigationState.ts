import {NAVIGATION_STATE} from "../const";
import {NavigationState} from "../type";
import {create} from "zustand";
interface NavigationStateStore {
    navigationState: NavigationState;
    setNavigationState: (state: NavigationState) => void;
}

export const useNavigationStore = create<NavigationStateStore>((set) => ({
    navigationState: NAVIGATION_STATE.IDLE,
    setNavigationState: (state) => set({ navigationState: state }),
}));
export default function useNavigationState() {
    const { navigationState, setNavigationState } = useNavigationStore();

    return {
        navigationState,
        setNavigationState,
        isIdle: navigationState === NAVIGATION_STATE.IDLE,
        isConfiguring: navigationState === NAVIGATION_STATE.ROUTE_CONFIGURING,
        isNavigating: navigationState === NAVIGATION_STATE.NAVIGATING,
        isSearching: navigationState === NAVIGATION_STATE.SEARCHING,
    };
}