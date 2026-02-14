import {create} from 'zustand';
import {TransportMode} from "../type";
import {OutdoorDirectionResponse} from "../api/outdoorDirectionsApi";

interface NavigationConfigState {
    navigationMode: TransportMode;
    setNavigationMode: (mode: TransportMode) => void;
    allOutdoorRoutes: OutdoorDirectionResponse[];
    setAllOutdoorRoutes: (routes: OutdoorDirectionResponse[]) => void;
}

const useNavigationConfig = create<NavigationConfigState>((set) => ({
    navigationMode: 'WALK',
    setNavigationMode: (mode: TransportMode) => set({navigationMode: mode}),
    allOutdoorRoutes: [],
    setAllOutdoorRoutes: (routes: OutdoorDirectionResponse[]) => set({allOutdoorRoutes: routes}),
}));

export default useNavigationConfig;
