import { act, renderHook } from "@testing-library/react-native";
import useNavigationProgress from "../hooks/useNavigationProgress";

describe("useNavigationProgress", () => {
  beforeEach(() => {
    useNavigationProgress.setState({
      currentStepIndex: 0,
      distanceToNextStep: "",
    });
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useNavigationProgress());
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.distanceToNextStep).toBe("");
  });

  it("sets current step index", () => {
    const { result } = renderHook(() => useNavigationProgress());
    act(() => {
      result.current.setCurrentStepIndex(3);
    });
    expect(result.current.currentStepIndex).toBe(3);
  });

  it("sets distance to next step", () => {
    const { result } = renderHook(() => useNavigationProgress());
    act(() => {
      result.current.setDistanceToNextStep("120 m");
    });
    expect(result.current.distanceToNextStep).toBe("120 m");
  });

  it("resets progress", () => {
    const { result } = renderHook(() => useNavigationProgress());
    act(() => {
      result.current.setCurrentStepIndex(2);
      result.current.setDistanceToNextStep("65 m");
      result.current.resetProgress();
    });
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.distanceToNextStep).toBe("");
  });
});
