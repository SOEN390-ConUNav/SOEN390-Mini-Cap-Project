import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const BURGUNDY = "#800020";
const SWAP_THRESHOLD = 42;

interface RouteRowProps {
  label: "From" | "To";
  value: string;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  onSwap: () => void;
  /**
   * Shared value owned by RouteCard.
   * This row WRITES to it while being dragged (0 → 1).
   * The sibling row READS from it to grey itself out.
   */
  dragProgress: SharedValue<number>;
  /**
   * Shared value owned by RouteCard, driven by the *sibling* row.
   * This row READS from it to know when to fade out.
   */
  siblingDragProgress: SharedValue<number>;
}

export default function RouteRow({
                                   label,
                                   value,
                                   trailingIcon,
                                   onSwap,
                                   dragProgress,
                                   siblingDragProgress,
                                 }: RouteRowProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const pan = Gesture.Pan()
      .onBegin(() => {
        scale.value = withSpring(1.02);
      })
      .onUpdate((e) => {
        translateY.value = Math.max(-60, Math.min(60, e.translationY));
        dragProgress.value = Math.min(1, Math.abs(e.translationY) / SWAP_THRESHOLD);
      })
      .onEnd((e) => {
        if (Math.abs(e.translationY) >= SWAP_THRESHOLD) {
          runOnJS(onSwap)();
        }
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        scale.value = withSpring(1);
        dragProgress.value = withSpring(0);
      })
      .onFinalize(() => {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        scale.value = withSpring(1);
        dragProgress.value = withSpring(0);
      });

  const rowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    zIndex: Math.abs(translateY.value) > 4 ? 10 : 0,
    elevation: Math.abs(translateY.value) > 4 ? 4 : 0,
  }));

  // Greyed out when the *sibling* is being dragged toward the threshold
  const dimAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(siblingDragProgress.value, [0, 1], [1, 0.35]),
  }));

  return (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.row, rowAnimStyle]}>
          <Animated.View style={[styles.inner, dimAnimStyle]}>
            <Ionicons
                name="reorder-two-outline"
                size={16}
                color="#ccc"
                style={styles.handle}
            />
            <View style={styles.textGroup}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value} numberOfLines={1}>
                {value}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    backgroundColor: "transparent",
  },
  inner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  handle: {
    marginRight: 6,
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 1,
  },
  value: {
    fontSize: 15,
    color: "#222",
  },
  trailingIcon: {
    marginLeft: 6,
  },
});