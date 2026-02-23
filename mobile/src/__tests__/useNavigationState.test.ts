import useNavigationState, {
  useNavigationStore,
} from "../hooks/useNavigationState";
import { NAVIGATION_STATE } from "../const";
import { act, renderHook } from "@testing-library/react-native";

describe("useNavigationState", () => {
  beforeEach(() => {
    useNavigationStore.setState({ navigationState: NAVIGATION_STATE.IDLE });
  });

  it("exposes idle flags by default", () => {
    const { result } = renderHook(() => useNavigationState());
    expect(result.current.isIdle).toBe(true);
    expect(result.current.isNavigating).toBe(false);
    expect(result.current.isConfiguring).toBe(false);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.isCancellingNavigation).toBe(false);
  });

  it("updates derived flags for each navigation state", () => {
    const { result } = renderHook(() => useNavigationState());
    act(() => {
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.ROUTE_CONFIGURING,
      });
    });
    expect(result.current.isConfiguring).toBe(true);

    act(() => {
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATING,
      });
    });
    expect(result.current.isNavigating).toBe(true);

    act(() => {
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.SEARCHING,
      });
    });
    expect(result.current.isSearching).toBe(true);

    act(() => {
      useNavigationStore.setState({
        navigationState: NAVIGATION_STATE.NAVIGATION_CANCELLING,
      });
    });
    expect(result.current.isCancellingNavigation).toBe(true);
  });

  it("setNavigationState mutates the store", () => {
    const { result } = renderHook(() => useNavigationState());
    act(() => {
      result.current.setNavigationState(NAVIGATION_STATE.NAVIGATING);
    });
    expect(useNavigationStore.getState().navigationState).toBe(
      NAVIGATION_STATE.NAVIGATING,
    );
  });
});
