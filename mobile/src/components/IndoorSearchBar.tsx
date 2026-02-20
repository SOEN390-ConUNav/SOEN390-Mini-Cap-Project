import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

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
  return (
    <View style={[styles.searchContainer, { top: statusBarHeight + 16 }]}>
      {/* Building and Floor Label */}
      {(buildingName || floor) && (
        <View style={styles.buildingInfo}>
          <Text style={styles.buildingInfoText}>
            {buildingName || "Hall Building"}
            {floor ? ` - Floor ${floor}` : " - Floor 8"}
          </Text>
        </View>
      )}

      {/* Card Container */}
      <View style={styles.card}>
        {/* Dark Gray Header Section */}
        <TouchableOpacity
          style={styles.headerSection}
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
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* White Body Section */}
        <View style={styles.bodySection}>
          <TouchableOpacity
            style={styles.bodyContent}
            onPress={onEndPress}
            activeOpacity={0.7}
          >
            <Text style={styles.bodyLabel}>To</Text>
            <Text style={styles.bodyValue} numberOfLines={1}>
              {endRoom || "Choose destination"}
            </Text>
          </TouchableOpacity>

          {/* Swap Button */}
          <TouchableOpacity
            style={[
              styles.swapButton,
              (!startRoom || !endRoom) && styles.swapButtonDisabled,
            ]}
            onPress={onSwap}
            disabled={!startRoom || !endRoom}
          >
            <Text
              style={[
                styles.swapIcon,
                (!startRoom || !endRoom) && styles.swapIconDisabled,
              ]}
            >
              ⇄
            </Text>
          </TouchableOpacity>

          {endRoom ? (
            <TouchableOpacity
              style={styles.bodyClearButton}
              onPress={(e) => {
                e.stopPropagation();
                onClearEnd();
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Loading indicator */}
        {isLoadingRoute && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8B1538" />
            <Text style={styles.loadingText}>Finding route...</Text>
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
    color: "#424242",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerSection: {
    backgroundColor: "#424242",
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
    backgroundColor: "#E0E0E0",
  },
  bodySection: {
    backgroundColor: "#FFFFFF",
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
    color: "#424242",
    fontWeight: "500",
    marginRight: 12,
    minWidth: 40,
  },
  bodyValue: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    fontWeight: "600",
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#8B1538",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginRight: 8,
  },
  swapButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  swapIcon: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  swapIconDisabled: {
    color: "#9E9E9E",
  },
  bodyClearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#757575",
  },
});
