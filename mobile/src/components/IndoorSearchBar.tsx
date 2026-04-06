import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../hooks/useTheme";

interface SearchBarProps {
  readonly startRoom: string;
  readonly endRoom: string;
  readonly isLoadingRoute: boolean;
  readonly statusBarHeight: number;
  readonly buildingName?: string;
  readonly floor?: string;
  readonly onStartPress: () => void;
  readonly onEndPress: () => void;
  readonly onClearStart: () => void;
  readonly onClearEnd: () => void;
  readonly onSwap: () => void;
}

export default function SearchBar({
  startRoom,
  endRoom,
  isLoadingRoute,
  statusBarHeight,
  buildingName,
  floor,
  onStartPress,
  onEndPress,
  onClearStart,
  onClearEnd,
  onSwap,
}: SearchBarProps) {
  const { colors, isDark } = useTheme();
  const headerBg = isDark ? colors.surface : "#424242";

  return (
    <View style={[styles.searchContainer, { top: statusBarHeight + 16 }]}>
      {/* Building and Floor Label */}
      {(buildingName || floor) && (
        <View style={styles.buildingInfo}>
          <Text style={[styles.buildingInfoText, { color: colors.textMuted }]}>
            {buildingName || "Hall Building"}
            {floor ? ` - Floor ${floor}` : " - Floor 8"}
          </Text>
        </View>
      )}

      {/* Card Container */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Dark Gray Header Section */}
        <TouchableOpacity
          style={[styles.headerSection, { backgroundColor: headerBg }]}
          onPress={onStartPress}
          activeOpacity={0.7}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>From</Text>
            <View style={styles.searchIconContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <Text style={styles.searchText}>{startRoom || "Search"}</Text>
            </View>
          </View>
          {startRoom ? (
            <TouchableOpacity
              style={styles.headerClearButton}
              onPress={(e) => {
                e.stopPropagation();
                onClearStart();
              }}
            >
              <Text style={[styles.clearButtonText, { color: "#fff" }]}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* White Body Section */}
        <View style={[styles.bodySection, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.bodyContent}
            onPress={onEndPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.bodyLabel, { color: colors.textMuted }]}>
              To
            </Text>
            <Text
              style={[styles.bodyValue, { color: colors.text }]}
              numberOfLines={1}
            >
              {endRoom || "Choose destination"}
            </Text>
          </TouchableOpacity>

          {/* Swap Button */}
          <TouchableOpacity
            style={[
              styles.swapButton,
              { backgroundColor: colors.primary },
              (!startRoom || !endRoom) && [
                styles.swapButtonDisabled,
                { backgroundColor: colors.border },
              ],
            ]}
            onPress={onSwap}
            disabled={!startRoom || !endRoom}
          >
            <Text
              style={[
                styles.swapIcon,
                { color: "#FFFFFF" },
                (!startRoom || !endRoom) && [
                  styles.swapIconDisabled,
                  { color: colors.textMuted },
                ],
              ]}
            >
              ⇄
            </Text>
          </TouchableOpacity>

          {endRoom ? (
            <TouchableOpacity
              style={[
                styles.bodyClearButton,
                { backgroundColor: colors.border },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onClearEnd();
              }}
            >
              <Text
                style={[styles.clearButtonText, { color: colors.textMuted }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Loading indicator */}
        {isLoadingRoute && (
          <View
            style={[
              styles.loadingContainer,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Finding route...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
  },
  buildingInfo: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  buildingInfoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
    marginRight: 12,
    minWidth: 40,
  },
  searchIconContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "400",
  },
  headerClearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  divider: {
    height: 1,
  },
  bodySection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  bodyContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  bodyLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 12,
    minWidth: 40,
  },
  bodyValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginRight: 8,
  },
  swapButtonDisabled: {},
  swapIcon: {
    fontSize: 18,
    fontWeight: "bold",
  },
  swapIconDisabled: {},
  bodyClearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
