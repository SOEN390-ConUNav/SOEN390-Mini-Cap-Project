import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Animated, View } from "react-native";
import CampusSwitcher from "../components/CampusSwitcher";

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      primary: "#800020",
      surface: "#eee",
      textMuted: "#666",
    },
  }),
}));

type MockCompositeAnimation = Animated.CompositeAnimation & {
  start: jest.Mock;
  stop: jest.Mock;
  runCompletion: (finished?: boolean) => void;
};

describe("CampusSwitcher", () => {
  const createdAnimations: MockCompositeAnimation[] = [];

  beforeEach(() => {
    createdAnimations.length = 0;
    jest.spyOn(Animated, "spring").mockImplementation(() => {
      let completionCb: ((result: { finished: boolean }) => void) | undefined;
      const animation = {
        start: jest.fn((cb?: (result: { finished: boolean }) => void) => {
          completionCb = cb;
        }),
        stop: jest.fn(),
        runCompletion: (finished = true) => {
          completionCb?.({ finished });
        },
      } as unknown as MockCompositeAnimation;
      createdAnimations.push(animation);
      return animation;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders both campus labels", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <CampusSwitcher value="SGW" onChange={onChange} />,
    );
    expect(getByText("SGW Campus")).toBeTruthy();
    expect(getByText("Loyola Campus")).toBeTruthy();
  });

  it("calls onChange with LOYOLA when Loyola pressed", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <CampusSwitcher value="SGW" onChange={onChange} />,
    );
    fireEvent.press(getByText("Loyola Campus"));
    expect(onChange).toHaveBeenCalledWith("LOYOLA");
  });

  it("calls onChange with SGW when SGW pressed", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <CampusSwitcher value="LOYOLA" onChange={onChange} />,
    );
    fireEvent.press(getByText("SGW Campus"));
    expect(onChange).toHaveBeenCalledWith("SGW");
  });

  it("stores animation and clears it when start callback finishes", () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType, rerender } = render(
      <CampusSwitcher value="SGW" onChange={onChange} />,
    );
    const wrapper = UNSAFE_getByType(View);

    fireEvent(wrapper, "layout", {
      nativeEvent: { layout: { width: 300, height: 42 } },
    });

    expect(Animated.spring).toHaveBeenCalledTimes(1);
    expect(createdAnimations[0].start).toHaveBeenCalledTimes(1);

    createdAnimations[0].runCompletion(true);

    rerender(<CampusSwitcher value="LOYOLA" onChange={onChange} />);
    fireEvent(wrapper, "layout", {
      nativeEvent: { layout: { width: 300, height: 42 } },
    });

    expect(Animated.spring).toHaveBeenCalledTimes(2);
  });

  it("stops current animation during cleanup", () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType, unmount } = render(
      <CampusSwitcher value="SGW" onChange={onChange} />,
    );
    const wrapper = UNSAFE_getByType(View);

    fireEvent(wrapper, "layout", {
      nativeEvent: { layout: { width: 300, height: 42 } },
    });

    expect(createdAnimations[0].stop).not.toHaveBeenCalled();
    unmount();
    expect(createdAnimations[0].stop).toHaveBeenCalledTimes(1);
  });
});
