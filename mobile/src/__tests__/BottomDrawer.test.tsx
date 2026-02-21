import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import BottomDrawer from "../components/BottomDrawer";

// ─── Mock BottomSheetModal / BottomSheetView ─────────────
jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    BottomSheetModal: React.forwardRef(
      ({ children, onDismiss, handleComponent }: any, ref: any) => {
        // simulate imperative handle
        React.useImperativeHandle(ref, () => ({
          present: jest.fn(),
          dismiss: jest.fn(),
          snapToIndex: jest.fn(),
        }));

        return (
          <View testID="bottom-sheet-modal" onDismiss={onDismiss}>
            {handleComponent?.()}
            {children}
          </View>
        );
      },
    ),
    BottomSheetView: ({ children, style }: any) => (
      <View style={style}>{children}</View>
    ),
  };
});

describe("BottomDrawer", () => {
  const onClose = jest.fn();
  const onPressAction = jest.fn();

  const baseProps = {
    visible: true,
    onClose,
    children: <Text testID="child">Hello</Text>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children", () => {
    const { getByTestId } = render(<BottomDrawer {...baseProps} />);
    expect(getByTestId("child")).toBeTruthy();
  });

  it("calls onClose when dismissed", () => {
    const { getByTestId } = render(<BottomDrawer {...baseProps} />);
    const modal = getByTestId("bottom-sheet-modal");

    // call onDismiss from props (now it exists)
    modal.props.onDismiss?.();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onPressAction when handle pressed and isDismissable is false", () => {
    const { getByTestId } = render(
      <BottomDrawer
        {...baseProps}
        handleMode={"toggle"}
        onPressAction={onPressAction}
      />,
    );
    const modal = getByTestId("bottom-sheet-modal");
    const handle = modal.props.children[0]; // handleComponent is rendered first
    handle.props.onPress();
    expect(onPressAction).toHaveBeenCalledTimes(1);
  });
});
