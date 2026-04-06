import React from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import RouteRow from "./RouteRow";
import SwapButton from "../SwapButton";
import CircleIconButton from "../CircleIconButton";
import useNavigationInfo from "../../hooks/useNavigationInfo";
import { useAccessibleTypography } from "../../hooks/useAccessibilitySettings";
import { useTheme } from "../../hooks/useTheme";

interface RouteCardProps {
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly onBack: () => void;
  readonly onSwap: () => void;
}

export default function RouteCard({
  originLabel,
  destinationLabel,
  onBack,
  onSwap,
}: RouteCardProps) {
  const { colors } = useTheme();
  const isLoading = useNavigationInfo((s) => s.isLoading);
  const setIsLoading = useNavigationInfo((s) => s.setIsLoading);
  const { textStyle } = useAccessibleTypography();

  const originDragProgress = useSharedValue(0);
  const destDragProgress = useSharedValue(0);

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Always rendered - user can cancel even while route is calculating */}
      <CircleIconButton
        icon="arrow-back"
        onPress={() => {
          setIsLoading(false);
          onBack();
        }}
      />

      <View style={styles.rows}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text
              style={[
                styles.loadingText,
                textStyle(14),
                { color: colors.textMuted },
              ]}
            >
              Calculating route…
            </Text>
          </View>
        ) : (
          <>
            <RouteRow
              label="From"
              value={originLabel}
              onSwap={onSwap}
              dragProgress={originDragProgress}
              siblingDragProgress={destDragProgress}
            />
            <View style={styles.dividerRow}>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <SwapButton onPress={onSwap} />
            </View>
            <RouteRow
              label="To"
              value={destinationLabel}
              onSwap={onSwap}
              dragProgress={destDragProgress}
              siblingDragProgress={originDragProgress}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  rows: {
    flex: 1,
    justifyContent: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 3,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
