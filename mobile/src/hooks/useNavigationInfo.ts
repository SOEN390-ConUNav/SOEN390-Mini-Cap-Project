import { create } from "zustand";

interface NavigationInfoState {
  pathDistance: string;
  pathDuration: string;
  isLoading: boolean;
  setPathDistance: (distance: string) => void;
  setPathDuration: (duration: string) => void;
  setIsLoading: (loading: boolean) => void;
}

const useNavigationInfo = create<NavigationInfoState>((set) => ({
  pathDistance: "0",
  pathDuration: "0",
  isLoading: false,
  setPathDistance: (distance) => set({ pathDistance: distance }),
  setPathDuration: (duration) => set({ pathDuration: duration }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

export default useNavigationInfo;
