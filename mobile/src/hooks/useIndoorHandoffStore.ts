import { create } from "zustand";
import type { EventIndoorTarget } from "../utils/eventIndoorNavigation";

interface IndoorHandoffStore {
  pendingIndoorTarget: EventIndoorTarget | null;
  setPendingIndoorTarget: (target: EventIndoorTarget | null) => void;
  clearPendingIndoorTarget: () => void;
}

export const useIndoorHandoffStore = create<IndoorHandoffStore>((set) => ({
  pendingIndoorTarget: null,
  setPendingIndoorTarget: (target) => set({ pendingIndoorTarget: target }),
  clearPendingIndoorTarget: () => set({ pendingIndoorTarget: null }),
}));
