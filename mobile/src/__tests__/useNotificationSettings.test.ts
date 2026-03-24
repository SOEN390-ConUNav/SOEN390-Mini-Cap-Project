import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook } from "@testing-library/react-native";
import {
  useNotificationSettings,
  useNotificationSettingsStore,
} from "../hooks/useNotificationSettings";

describe("useNotificationSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationSettingsStore.setState({
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
    });
  });

  it("toggles push and sound", () => {
    useNotificationSettingsStore.getState().setPushEnabled(false);
    useNotificationSettingsStore.getState().setSoundEnabled(false);
    const s = useNotificationSettingsStore.getState();
    expect(s.pushEnabled).toBe(false);
    expect(s.soundEnabled).toBe(false);
  });

  it("setQuietHoursActive updates state", () => {
    useNotificationSettingsStore.getState().setQuietHoursActive(false);
    expect(useNotificationSettingsStore.getState().quietHoursActive).toBe(
      false,
    );
    useNotificationSettingsStore.getState().setQuietHoursActive(true);
    expect(useNotificationSettingsStore.getState().quietHoursActive).toBe(true);
  });

  it("hydrateFromStorage merges stored values", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ pushEnabled: false, quietHoursLabel: "22:00–07:00" }),
    );
    await useNotificationSettingsStore.getState().hydrateFromStorage();
    const s = useNotificationSettingsStore.getState();
    expect(s.pushEnabled).toBe(false);
    expect(s.quietHoursLabel).toBe("22:00–07:00");
  });

  it("hydrateFromStorage swallows bad JSON", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("{");
    await useNotificationSettingsStore.getState().hydrateFromStorage();
    expect(useNotificationSettingsStore.getState().pushEnabled).toBe(true);
  });

  it("remaining setters update state", () => {
    const g = useNotificationSettingsStore.getState();
    g.setVibrationEnabled(false);
    g.setBadgeEnabled(false);
    g.setClassUpdates(false);
    g.setEventReminders(false);
    g.setCampusAlerts(false);
    g.setNavigationUpdates(true);
    g.setPromotionsTips(true);
    const s = useNotificationSettingsStore.getState();
    expect(s.vibrationEnabled).toBe(false);
    expect(s.badgeEnabled).toBe(false);
    expect(s.classUpdates).toBe(false);
    expect(s.eventReminders).toBe(false);
    expect(s.campusAlerts).toBe(false);
    expect(s.navigationUpdates).toBe(true);
    expect(s.promotionsTips).toBe(true);
  });

  it("useNotificationSettings hook returns store slice", () => {
    const { result } = renderHook(() => useNotificationSettings());
    expect(result.current.pushEnabled).toBe(true);
    expect(typeof result.current.setPushEnabled).toBe("function");
  });
});
