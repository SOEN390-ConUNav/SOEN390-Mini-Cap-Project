import { act, renderHook } from "@testing-library/react-native";
import useNavigationEndpoints from "../hooks/useNavigationEndpoints";

const HALL = { latitude: 45.4972, longitude: -73.579, label: "Hall Building" };
const LOYOLA = {
  latitude: 45.4582,
  longitude: -73.6405,
  label: "Loyola Campus",
};

describe("useNavigationEndpoints", () => {
  // Reset store state between tests by clearing after each
  afterEach(() => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.clear());
  });

  it("initializes with null origin and destination", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    expect(result.current.origin).toBeNull();
    expect(result.current.destination).toBeNull();
  });

  it("sets origin correctly", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.setOrigin(HALL));
    expect(result.current.origin).toEqual(HALL);
  });

  it("sets destination correctly", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.setDestination(LOYOLA));
    expect(result.current.destination).toEqual(LOYOLA);
  });

  it("sets origin to null", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.setOrigin(HALL));
    act(() => result.current.setOrigin(null));
    expect(result.current.origin).toBeNull();
  });

  it("sets destination to null", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.setDestination(LOYOLA));
    act(() => result.current.setDestination(null));
    expect(result.current.destination).toBeNull();
  });

  it("swaps origin and destination", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.setOrigin(HALL));
    act(() => result.current.setDestination(LOYOLA));
    act(() => result.current.swap());
    expect(result.current.origin).toEqual(LOYOLA);
    expect(result.current.destination).toEqual(HALL);
  });

  it("swap works when origin is null", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.setDestination(LOYOLA));
    act(() => result.current.swap());
    expect(result.current.origin).toEqual(LOYOLA);
    expect(result.current.destination).toBeNull();
  });

  it("swap works when destination is null", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.setOrigin(HALL));
    act(() => result.current.swap());
    expect(result.current.origin).toBeNull();
    expect(result.current.destination).toEqual(HALL);
  });

  it("swap works when both are null", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.swap());
    expect(result.current.origin).toBeNull();
    expect(result.current.destination).toBeNull();
  });

  it("clear resets both origin and destination to null", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    act(() => result.current.setOrigin(HALL));
    act(() => result.current.setDestination(LOYOLA));
    act(() => result.current.clear());
    expect(result.current.origin).toBeNull();
    expect(result.current.destination).toBeNull();
  });

  it("exposes setOrigin, setDestination, swap, and clear as functions", () => {
    const { result } = renderHook(() => useNavigationEndpoints());
    expect(typeof result.current.setOrigin).toBe("function");
    expect(typeof result.current.setDestination).toBe("function");
    expect(typeof result.current.swap).toBe("function");
    expect(typeof result.current.clear).toBe("function");
  });
});
