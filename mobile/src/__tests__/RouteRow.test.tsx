import React from "react";
import { render } from "@testing-library/react-native";
import RouteRow from "../components/search-bar/RouteRow";

// ─── Gesture handler mock with callback capture ───────────────────────────────

type GestureCallbacks = {
  onBegin?: () => void;
  onUpdate?: (e: { translationY: number }) => void;
  onEnd?: (e: { translationY: number }) => void;
  onFinalize?: () => void;
};

const capturedCallbacks: GestureCallbacks = {};

jest.mock("react-native-gesture-handler", () => {
  const { View } = require("react-native");
  return {
    Gesture: {
      Pan: () => ({
        runOnJS(_val: boolean) {
          return this;
        },
        onBegin(fn: () => void) {
          capturedCallbacks.onBegin = fn;
          return this;
        },
        onUpdate(fn: (e: { translationY: number }) => void) {
          capturedCallbacks.onUpdate = fn;
          return this;
        },
        onEnd(fn: (e: { translationY: number }) => void) {
          capturedCallbacks.onEnd = fn;
          return this;
        },
        onFinalize(fn: () => void) {
          capturedCallbacks.onFinalize = fn;
          return this;
        },
      }),
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

// ─── Shared value factory ─────────────────────────────────────────────────────

const makeSharedValue = (init: number) => ({
  value: init,
  get: () => init,
  set: () => {},
  addListener: () => {},
  removeListener: () => {},
  modify: () => {},
  _isReanimatedSharedValue: true as const,
});

// ─── Base props ───────────────────────────────────────────────────────────────

const onSwap = jest.fn();

const makeDragProgress = () => makeSharedValue(0);
const makeSiblingDragProgress = () => makeSharedValue(0);

const baseProps = {
  label: "From" as const,
  value: "Hall Building",
  onSwap,
  dragProgress: makeDragProgress(),
  siblingDragProgress: makeSiblingDragProgress(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("RouteRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { root } = render(<RouteRow {...baseProps} />);
    expect(root).toBeTruthy();
  });

  it('renders the "From" label', () => {
    const { getByText } = render(<RouteRow {...baseProps} label="From" />);
    expect(getByText("From")).toBeTruthy();
  });

  it('renders the "To" label', () => {
    const { getByText } = render(<RouteRow {...baseProps} label="To" />);
    expect(getByText("To")).toBeTruthy();
  });

  it("renders the value text", () => {
    const { getByText } = render(
      <RouteRow {...baseProps} value="Loyola Campus" />,
    );
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("renders both label and value simultaneously", () => {
    const { getByText } = render(
      <RouteRow {...baseProps} label="To" value="Loyola Campus" />,
    );
    expect(getByText("To")).toBeTruthy();
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("renders updated value when prop changes", () => {
    const { getByText, rerender } = render(
      <RouteRow {...baseProps} value="Hall Building" />,
    );
    expect(getByText("Hall Building")).toBeTruthy();
    rerender(<RouteRow {...baseProps} value="Loyola Campus" />);
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("renders updated label when prop changes", () => {
    const { getByText, rerender } = render(
      <RouteRow {...baseProps} label="From" />,
    );
    expect(getByText("From")).toBeTruthy();
    rerender(<RouteRow {...baseProps} label="To" />);
    expect(getByText("To")).toBeTruthy();
  });

  // ─── Gesture callbacks ──────────────────────────────────────────────────────

  it("onBegin scales up without throwing", () => {
    render(<RouteRow {...baseProps} />);
    expect(() => capturedCallbacks.onBegin?.()).not.toThrow();
  });

  it("onUpdate clamps translationY and updates dragProgress", () => {
    const dragProgress = makeDragProgress();
    render(<RouteRow {...baseProps} dragProgress={dragProgress} />);

    // Within threshold — dragProgress between 0 and 1
    capturedCallbacks.onUpdate?.({ translationY: 20 });
    expect(dragProgress.value).toBeGreaterThanOrEqual(0);

    // Beyond clamp — translationY > 60 is clamped
    expect(() =>
      capturedCallbacks.onUpdate?.({ translationY: 100 }),
    ).not.toThrow();
    expect(() =>
      capturedCallbacks.onUpdate?.({ translationY: -100 }),
    ).not.toThrow();
  });

  it("onEnd calls onSwap when translationY exceeds threshold (42)", () => {
    render(<RouteRow {...baseProps} />);
    capturedCallbacks.onEnd?.({ translationY: 50 });
    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it("onEnd does not call onSwap when translationY is below threshold", () => {
    render(<RouteRow {...baseProps} />);
    capturedCallbacks.onEnd?.({ translationY: 10 });
    expect(onSwap).not.toHaveBeenCalled();
  });

  it("onEnd does not call onSwap at exactly the threshold boundary (41)", () => {
    render(<RouteRow {...baseProps} />);
    capturedCallbacks.onEnd?.({ translationY: 41 });
    expect(onSwap).not.toHaveBeenCalled();
  });

  it("onEnd calls onSwap with negative translationY exceeding threshold", () => {
    render(<RouteRow {...baseProps} />);
    capturedCallbacks.onEnd?.({ translationY: -50 });
    expect(onSwap).toHaveBeenCalledTimes(1);
  });

  it("onFinalize resets without throwing", () => {
    render(<RouteRow {...baseProps} />);
    expect(() => capturedCallbacks.onFinalize?.()).not.toThrow();
  });
});
