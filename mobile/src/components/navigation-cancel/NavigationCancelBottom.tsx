import React from "react";
import { StyleSheet, Text, View } from "react-native";
import NavigationCancelButton from "./NavigationCancelButton";

interface NavigationCancelBottomProps {
  readonly onOpenSettings: () => void;
  readonly onConfirmCancel: () => void;
  readonly onResumeNavigation: () => void;
}

export default function NavigationCancelBottom({
  onOpenSettings,
  onConfirmCancel,
  onResumeNavigation,
}: NavigationCancelBottomProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.row}>
        <NavigationCancelButton
          testID="resume-button"
          icon="settings-outline"
          onPress={onOpenSettings}
        />

        <View style={styles.centerGroup}>
          <NavigationCancelButton
            testID="resume-button"
            icon="close"
            onPress={onConfirmCancel}
            variant="danger"
            size={72}
          />
          <Text style={styles.cancelText}>Cancel trip</Text>
        </View>

        <NavigationCancelButton
          testID="resume-button"
          icon="arrow-forward"
          onPress={onResumeNavigation}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 24,
  },
  centerGroup: {
    alignItems: "center",
    minWidth: 96,
  },
  cancelText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
});
