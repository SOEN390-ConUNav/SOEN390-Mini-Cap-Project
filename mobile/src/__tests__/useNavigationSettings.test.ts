import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook } from "@testing-library/react-native";
import {
  useNavigationSettings,
  useNavigationSettingsStore,
} from "../hooks/useNavigationSettings";

describe("useNavigationSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigationSettingsStore.setState({
      avoidStairs: false,
      indoorNavigation: true,
      autoRerouting: true,
      showCompass: true,
      showPedestrianTraffic: false,
      mapTiltAngle: 45,
      distanceUnits: "Meters",
      mapStyle: "Standard",
      northOrientation: "Fixed",
    });
  });

  it("has expected defaults", () => {
    const s = useNavigationSettingsStore.getState();
    expect(s.avoidStairs).toBe(false);
    expect(s.distanceUnits).toBe("Meters");
    expect(s.mapTiltAngle).toBe(45);
  });

  it("setAvoidStairs updates state", () => {
    useNavigationSettingsStore.getState().setAvoidStairs(true);
    expect(useNavigationSettingsStore.getState().avoidStairs).toBe(true);
  });

  it("setMapStyle and setNorthOrientation update state", () => {
    useNavigationSettingsStore.getState().setMapStyle("Satellite");
    useNavigationSettingsStore.getState().setNorthOrientation("Compass");
    const s = useNavigationSettingsStore.getState();
    expect(s.mapStyle).toBe("Satellite");
    expect(s.northOrientation).toBe("Compass");
  });

  it("setMapTiltAngle and setDistanceUnits update state", () => {
    useNavigationSettingsStore.getState().setMapTiltAngle(30);
    useNavigationSettingsStore.getState().setDistanceUnits("Feet");
    const s = useNavigationSettingsStore.getState();
    expect(s.mapTiltAngle).toBe(30);
    expect(s.distanceUnits).toBe("Feet");
  });

  it("hydrateFromStorage merges JSON from AsyncStorage", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ avoidStairs: true, mapStyle: "Satellite" }),
    );
    await useNavigationSettingsStore.getState().hydrateFromStorage();
    const s = useNavigationSettingsStore.getState();
    expect(s.avoidStairs).toBe(true);
    expect(s.mapStyle).toBe("Satellite");
  });

  it("hydrateFromStorage ignores invalid JSON", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("not-json");
    await useNavigationSettingsStore.getState().hydrateFromStorage();
    expect(useNavigationSettingsStore.getState().avoidStairs).toBe(false);
  });

  it("all other setters update state and persist", () => {
    const g = useNavigationSettingsStore.getState();
    g.setIndoorNavigation(false);
    g.setAutoRerouting(false);
    g.setShowCompass(false);
    g.setShowPedestrianTraffic(true);
    const s = useNavigationSettingsStore.getState();
    expect(s.indoorNavigation).toBe(false);
    expect(s.autoRerouting).toBe(false);
    expect(s.showCompass).toBe(false);
    expect(s.showPedestrianTraffic).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it("useNavigationSettings hook returns store slice", () => {
    const { result } = renderHook(() => useNavigationSettings());
    expect(result.current.mapStyle).toBe("Standard");
    expect(typeof result.current.setAvoidStairs).toBe("function");
  });
});
