import React from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import RouteRow from "./RouteRow";
import SwapButton from "../SwapButton";
import CircleIconButton from "../CircleIconButton";
import useNavigationInfo from "../../hooks/useNavigationInfo";

const BURGUNDY = "#800020";

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
  const { isLoading, setIsLoading } = useNavigationInfo();

  const originDragProgress = useSharedValue(0);
  const destDragProgress = useSharedValue(0);

  return (
    <View style={styles.card}>
      {/* Always rendered — user can cancel even while route is calculating */}
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
            <ActivityIndicator size="small" color={BURGUNDY} />
            <Text style={styles.loadingText}>Calculating route…</Text>
          </View>
        ) : (
          <>
            <RouteRow
              label="From"
              value={originLabel}
              trailingIcon="locate"
              onSwap={onSwap}
              dragProgress={originDragProgress}
              siblingDragProgress={destDragProgress}
            />
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
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
    backgroundColor: "rgba(255,255,255,0.97)",
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
    backgroundColor: "#e0e0e0",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});
