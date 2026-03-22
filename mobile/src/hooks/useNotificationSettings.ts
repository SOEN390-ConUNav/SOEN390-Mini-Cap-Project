import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface NotificationSettingsState {
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  classUpdates: boolean;
  eventReminders: boolean;
  campusAlerts: boolean;
  navigationUpdates: boolean;
  promotionsTips: boolean;
  quietHoursActive: boolean;
  quietHoursLabel: string;
  setPushEnabled: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
  setBadgeEnabled: (value: boolean) => void;
  setClassUpdates: (value: boolean) => void;
  setEventReminders: (value: boolean) => void;
  setCampusAlerts: (value: boolean) => void;
  setNavigationUpdates: (value: boolean) => void;
  setPromotionsTips: (value: boolean) => void;
  setQuietHoursActive: (value: boolean) => void;
  hydrateFromStorage: () => Promise<void>;
}

const STORAGE_KEY = "notificationSettings.v1";

export const useNotificationSettingsStore = create<NotificationSettingsState>(
  (set, get) => ({
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
    classUpdates: true,
    eventReminders: true,
    campusAlerts: true,
    navigationUpdates: false,
    promotionsTips: false,
    quietHoursActive: true,
    quietHoursLabel: "10:00 PM – 8:00 AM",
    setPushEnabled: (pushEnabled) =>
      set((state) => {
        const next = { ...state, pushEnabled };
        void persist(next);
        return next;
      }),
    setSoundEnabled: (soundEnabled) =>
      set((state) => {
        const next = { ...state, soundEnabled };
        void persist(next);
        return next;
      }),
    setVibrationEnabled: (vibrationEnabled) =>
      set((state) => {
        const next = { ...state, vibrationEnabled };
        void persist(next);
        return next;
      }),
    setBadgeEnabled: (badgeEnabled) =>
      set((state) => {
        const next = { ...state, badgeEnabled };
        void persist(next);
        return next;
      }),
    setClassUpdates: (classUpdates) =>
      set((state) => {
        const next = { ...state, classUpdates };
        void persist(next);
        return next;
      }),
    setEventReminders: (eventReminders) =>
      set((state) => {
        const next = { ...state, eventReminders };
        void persist(next);
        return next;
      }),
    setCampusAlerts: (campusAlerts) =>
      set((state) => {
        const next = { ...state, campusAlerts };
        void persist(next);
        return next;
      }),
    setNavigationUpdates: (navigationUpdates) =>
      set((state) => {
        const next = { ...state, navigationUpdates };
        void persist(next);
        return next;
      }),
    setPromotionsTips: (promotionsTips) =>
      set((state) => {
        const next = { ...state, promotionsTips };
        void persist(next);
        return next;
      }),
    setQuietHoursActive: (quietHoursActive) =>
      set((state) => {
        const next = { ...state, quietHoursActive };
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
  }),
);

async function persist(state: NotificationSettingsState) {
  const {
    pushEnabled,
    soundEnabled,
    vibrationEnabled,
    badgeEnabled,
    classUpdates,
    eventReminders,
    campusAlerts,
    navigationUpdates,
    promotionsTips,
    quietHoursActive,
    quietHoursLabel,
  } = state;

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        pushEnabled,
        soundEnabled,
        vibrationEnabled,
        badgeEnabled,
        classUpdates,
        eventReminders,
        campusAlerts,
        navigationUpdates,
        promotionsTips,
        quietHoursActive,
        quietHoursLabel,
      }),
    );
  } catch {
    // best-effort
  }
}

export function useNotificationSettings() {
  return useNotificationSettingsStore();
}
