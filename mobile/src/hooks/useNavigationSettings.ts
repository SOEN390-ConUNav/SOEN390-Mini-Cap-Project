import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface NavigationSettingsState {
  voiceGuidance: boolean;
  voiceVolume: number; // 0-100
  avoidStairs: boolean;
  indoorNavigation: boolean;
  autoRerouting: boolean;
  showCompass: boolean;
  showPedestrianTraffic: boolean;
  mapTiltAngle: number; // degrees
  distanceUnits: "Meters" | "Feet";
  mapStyle: "Standard" | "Satellite";
  northOrientation: "Fixed" | "Compass";
  setVoiceGuidance: (value: boolean) => void;
  setVoiceVolume: (value: number) => void;
  setAvoidStairs: (value: boolean) => void;
  setIndoorNavigation: (value: boolean) => void;
  setAutoRerouting: (value: boolean) => void;
  setShowCompass: (value: boolean) => void;
  setShowPedestrianTraffic: (value: boolean) => void;
  setMapTiltAngle: (value: number) => void;
  setDistanceUnits: (value: "Meters" | "Feet") => void;
  setMapStyle: (value: "Standard" | "Satellite") => void;
  setNorthOrientation: (value: "Fixed" | "Compass") => void;
  hydrateFromStorage: () => Promise<void>;
}

const STORAGE_KEY = "navigationSettings.v1";

export const useNavigationSettingsStore =
  create<NavigationSettingsState>((set, get) => ({
    voiceGuidance: true,
    voiceVolume: 80,
    avoidStairs: false,
    indoorNavigation: true,
    autoRerouting: true,
    showCompass: true,
    showPedestrianTraffic: false,
    mapTiltAngle: 45,
    distanceUnits: "Meters",
    mapStyle: "Standard",
    northOrientation: "Fixed",
    setVoiceGuidance: (voiceGuidance) =>
      set((state) => {
        const next = { ...state, voiceGuidance };
        void persist(next);
        return next;
      }),
    setVoiceVolume: (voiceVolume) =>
      set((state) => {
        const next = { ...state, voiceVolume };
        void persist(next);
        return next;
      }),
    setAvoidStairs: (avoidStairs) =>
      set((state) => {
        const next = { ...state, avoidStairs };
        void persist(next);
        return next;
      }),
    setIndoorNavigation: (indoorNavigation) =>
      set((state) => {
        const next = { ...state, indoorNavigation };
        void persist(next);
        return next;
      }),
    setAutoRerouting: (autoRerouting) =>
      set((state) => {
        const next = { ...state, autoRerouting };
        void persist(next);
        return next;
      }),
    setShowCompass: (showCompass) =>
      set((state) => {
        const next = { ...state, showCompass };
        void persist(next);
        return next;
      }),
    setShowPedestrianTraffic: (showPedestrianTraffic) =>
      set((state) => {
        const next = { ...state, showPedestrianTraffic };
        void persist(next);
        return next;
      }),
    setMapTiltAngle: (mapTiltAngle) =>
      set((state) => {
        const next = { ...state, mapTiltAngle };
        void persist(next);
        return next;
      }),
    setDistanceUnits: (distanceUnits) =>
      set((state) => {
        const next = { ...state, distanceUnits };
        void persist(next);
        return next;
      }),
    setMapStyle: (mapStyle) =>
      set((state) => {
        const next = { ...state, mapStyle };
        void persist(next);
        return next;
      }),
    setNorthOrientation: (northOrientation) =>
      set((state) => {
        const next = { ...state, northOrientation };
        void persist(next);
        return next;
      }),
    hydrateFromStorage: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        set((state) => ({
          ...state,
          ...parsed,
        }));
      } catch {
        // ignore
      }
    },
  }));

async function persist(state: NavigationSettingsState) {
  const {
    voiceGuidance,
    voiceVolume,
    avoidStairs,
    indoorNavigation,
    autoRerouting,
    showCompass,
    showPedestrianTraffic,
    mapTiltAngle,
    distanceUnits,
    mapStyle,
    northOrientation,
  } = state;

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        voiceGuidance,
        voiceVolume,
        avoidStairs,
        indoorNavigation,
        autoRerouting,
        showCompass,
        showPedestrianTraffic,
        mapTiltAngle,
        distanceUnits,
        mapStyle,
        northOrientation,
      }),
    );
  } catch {
    // best-effort
  }
}

export function useNavigationSettings() {
  return useNavigationSettingsStore();
}

export function getVoiceVolumeLabel(value: number): string {
  if (value <= 33) return "Low";
  if (value >= 75) return "High";
  return "Medium";
}

