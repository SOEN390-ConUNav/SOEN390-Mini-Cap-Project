import { create } from "zustand";

interface NavigationProgressState {
  currentStepIndex: number;
  distanceToNextStep: string;
  setCurrentStepIndex: (index: number) => void;
  setDistanceToNextStep: (distance: string) => void;
  resetProgress: () => void;
}

const useNavigationProgress = create<NavigationProgressState>((set) => ({
  currentStepIndex: 0,
  distanceToNextStep: "",
  setCurrentStepIndex: (index: number) => set({ currentStepIndex: index }),
  setDistanceToNextStep: (distance: string) =>
    set({ distanceToNextStep: distance }),
  resetProgress: () => set({ currentStepIndex: 0, distanceToNextStep: "" }),
}));

export default useNavigationProgress;
