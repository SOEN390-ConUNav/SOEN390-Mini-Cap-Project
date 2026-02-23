import { useEffect, useMemo, useRef, ReactNode } from "react";
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

interface BottomDrawerProps {
  readonly visible: boolean;
  readonly onClose?: () => void;
  readonly children: ReactNode;
  readonly snapPoints?: string[] | number[];
  readonly initialSnapIndex?: number;
  readonly backgroundColor?: string;
  readonly handleColor?: string;
  readonly enablePanDownToClose?: boolean;
  readonly enableDynamicSizing?: boolean;
  readonly contentContainerStyle?: ViewStyle;
  readonly handleMode?: "dismiss" | "toggle";
  readonly onPressAction?: () => void;
  readonly onSnapIndexChange?: (index: number) => void;
  readonly useModal?: boolean;
}

interface CustomHandleProps {
  readonly onPress: () => void;
  readonly backgroundColor: string;
  readonly handleColor: string;
}

function CustomHandle({
  onPress,
  backgroundColor,
  handleColor,
}: CustomHandleProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.handleWrapper, { backgroundColor }]}
    >
      <View
        style={[styles.handleIndicator, { backgroundColor: handleColor }]}
      />
    </TouchableOpacity>
  );
}

function createHandleComponent(props: CustomHandleProps) {
  return function HandleComponent() {
    return (
      <CustomHandle
        onPress={props.onPress}
        backgroundColor={props.backgroundColor}
        handleColor={props.handleColor}
      />
    );
  };
}

export default function BottomDrawer({
  visible,
  onClose,
  children,
  snapPoints = ["10%", "50%", "75%"],
  initialSnapIndex = 0,
  backgroundColor = "#FFFFFF",
  handleColor = "#00000040",
  enablePanDownToClose = true,
  enableDynamicSizing = false,
  contentContainerStyle,
  handleMode = "dismiss",
  onPressAction,
  onSnapIndexChange,
  useModal = true,
}: BottomDrawerProps) {
  const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
  const modalSheetRef = useRef<BottomSheetModal>(null);
  const nonModalSheetRef = useRef<BottomSheet>(null);
  const currentSnapIndex = useRef(initialSnapIndex);

  const onPress = () => {
    switch (handleMode) {
      case "dismiss":
        if (useModal) {
          modalSheetRef.current?.dismiss();
        } else {
          nonModalSheetRef.current?.close();
        }
        break;

      case "toggle": {
        const nextIndex = currentSnapIndex.current === 0 ? 1 : 0;
        if (useModal) {
          modalSheetRef.current?.snapToIndex(nextIndex);
        } else {
          nonModalSheetRef.current?.snapToIndex(nextIndex);
        }
        onPressAction?.();
        break;
      }

      default:
        break;
    }
  };

  const handleComponent = useMemo(
    () =>
      createHandleComponent({
        onPress,
        backgroundColor,
        handleColor,
      }),
    [onPress, backgroundColor, handleColor],
  );

  useEffect(() => {
    if (useModal) {
      if (visible) {
        modalSheetRef.current?.present();
      } else {
        modalSheetRef.current?.dismiss();
      }
      return;
    }

    if (visible) {
      nonModalSheetRef.current?.snapToIndex(initialSnapIndex);
    } else {
      nonModalSheetRef.current?.close();
    }
  }, [visible, useModal, initialSnapIndex]);

  if (!useModal) {
    return (
      <BottomSheet
        ref={nonModalSheetRef}
        snapPoints={memoizedSnapPoints}
        index={visible ? initialSnapIndex : -1}
        enableDynamicSizing={enableDynamicSizing}
        enablePanDownToClose={enablePanDownToClose}
        onClose={onClose}
        onChange={(index: number) => {
          currentSnapIndex.current = index;
          onSnapIndexChange?.(index);
        }}
        backgroundStyle={[styles.background, { backgroundColor }]}
        handleComponent={handleComponent}
      >
        <BottomSheetView
          style={[styles.contentContainer, contentContainerStyle]}
        >
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }

  return (
    <BottomSheetModal
      ref={modalSheetRef}
      snapPoints={memoizedSnapPoints}
      index={initialSnapIndex}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose}
      onDismiss={onClose}
      onChange={(index) => {
        currentSnapIndex.current = index;
        onSnapIndexChange?.(index);
      }}
      backgroundStyle={[styles.background, { backgroundColor }]}
      handleComponent={handleComponent}
    >
      <BottomSheetView style={[styles.contentContainer, contentContainerStyle]}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -5, // Small negative value to show above the sheet
    },
    shadowOpacity: 0.99,
    shadowRadius: 10,
    elevation: 10,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: "center",
  },
  handleWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});
