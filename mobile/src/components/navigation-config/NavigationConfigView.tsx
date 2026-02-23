import React from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import BottomDrawer from "../BottomDrawer";
import NavigationTransportCard from "./NavigationTransportCard";
import NavigationPathRow from "./NavigationPathRow";
import useNavigationConfig from "../../hooks/useNavigationConfig";
import useNavigationInfo from "../../hooks/useNavigationInfo";
import { OutdoorDirectionResponse } from "../../api/outdoorDirectionsApi";
import { TRANSPORT_MODE_API_MAP } from "../../type";
import { NAVIGATION_STATE } from "../../const";
import { useNavigationStore } from "../../hooks/useNavigationState";

interface NavigationConfigViewProps {
  readonly durations: OutdoorDirectionResponse[];
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onGo?: () => void;
}

export default function NavigationConfigView({
  durations,
  visible,
  onClose,
  onGo,
}: NavigationConfigViewProps) {
  const { navigationMode, setNavigationMode } = useNavigationConfig();
  const { isLoading } = useNavigationInfo();
  const getDurationForMode = (mode: string) => {
    const route = durations.find(
      (d) => d.transportMode?.toLowerCase() === mode.toLowerCase(),
    );

    return route ? route.duration : "N/A";
  };
  const getSelectedDuration = () => {
    const apiKey = TRANSPORT_MODE_API_MAP[navigationMode] || "walking";
    return getDurationForMode(apiKey);
  };
  const handleGo = () => {
    // Logic to start the actual turn-by-turn navigation
    console.log("Start navigation with mode:", navigationMode);
    onGo?.();
  };

  return (
    <BottomDrawer
      visible={visible}
      onClose={() => {
        if (
          useNavigationStore.getState().navigationState !==
          NAVIGATION_STATE.NAVIGATING
        ) {
          onClose();
        }
      }}
      snapPoints={["35%"]} // Adjusted height for this content
      enablePanDownToClose={true}
      contentContainerStyle={styles.drawerContent}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#800020" />
          <Text>Calculating Route...</Text>
        </View>
      ) : (
        <>
          {/* 1. Transport Mode Selection Row */}
          <View style={styles.transportRow}>
            <NavigationTransportCard
              mode="WALK"
              duration={getDurationForMode(TRANSPORT_MODE_API_MAP.WALK)}
              isSelected={navigationMode === "WALK"}
              onSelect={() => setNavigationMode("WALK")}
            />
            <NavigationTransportCard
              mode="BIKE"
              duration={getDurationForMode(TRANSPORT_MODE_API_MAP.BIKE)}
              isSelected={navigationMode === "BIKE"}
              onSelect={() => setNavigationMode("BIKE")}
            />
            <NavigationTransportCard
              mode="BUS"
              duration={getDurationForMode(TRANSPORT_MODE_API_MAP.BUS)}
              isSelected={navigationMode === "BUS"}
              onSelect={() => setNavigationMode("BUS")}
            />
            <NavigationTransportCard
              mode="SHUTTLE"
              duration="N/A"
              isSelected={navigationMode === "SHUTTLE"}
              onSelect={() => setNavigationMode("SHUTTLE")}
            />
          </View>

          {/* 2. Stats & Action Row */}
          <NavigationPathRow
            duration={getSelectedDuration()}
            handleGo={handleGo}
          />
        </>
      )}
    </BottomDrawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: "center",
    backgroundColor: "",
  },
  transportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "95%",
    paddingHorizontal: 5,
    marginBottom: 20,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 150,
  },
});
