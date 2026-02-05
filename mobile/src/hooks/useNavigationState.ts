import {NAVIGATION_STATE} from "../const";
import {NavigationState} from "../type";
import {useState} from "react";
export default function useNavigationState() {
    const [navigationState, setNavigationState] = useState<NavigationState>(NAVIGATION_STATE.IDLE);

    return {
        navigationState,
        setNavigationState,
        isIdle: navigationState === NAVIGATION_STATE.IDLE,
        isConfiguring: navigationState === NAVIGATION_STATE.ROUTE_CONFIGURING,
        isNavigating: navigationState === NAVIGATION_STATE.NAVIGATING,
        isSearching: navigationState === NAVIGATION_STATE.SEARCHING
    };
}