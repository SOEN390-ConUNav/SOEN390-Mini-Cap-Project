import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import BottomDrawer from "../BottomDrawer";
import NavigationTransportCard, { TransportMode } from "./NavigationTransportCard";
import NavigationGoButton from "./NavigationGoButton";

interface NavigationConfigViewProps {
    visible: boolean;
    onClose: () => void;
}

export default function NavigationConfigView({ visible, onClose }: NavigationConfigViewProps) {
    const [selectedMode, setSelectedMode] = useState<TransportMode>("WALK");

    const handleGo = () => {
        // Logic to start the actual turn-by-turn navigation
        console.log("Start navigation with mode:", selectedMode);
    };

    return (
        <BottomDrawer
            visible={visible}
            onClose={onClose}
            snapPoints={['35%']} // Adjusted height for this content
            enablePanDownToClose={true}
            contentContainerStyle={styles.drawerContent}
        >
            {/* 1. Transport Mode Selection Row */}
            <View style={styles.transportRow}>
                <NavigationTransportCard
                    mode="WALK"
                    duration="5 mins"
                    isSelected={selectedMode === "WALK"}
                    onSelect={() => setSelectedMode("WALK")}
                />
                <NavigationTransportCard
                    mode="BIKE"
                    duration="5 mins"
                    isSelected={selectedMode === "BIKE"}
                    onSelect={() => setSelectedMode("BIKE")}
                />
                <NavigationTransportCard
                    mode="BUS"
                    duration="N/A"
                    isSelected={selectedMode === "BUS"}
                    onSelect={() => setSelectedMode("BUS")}
                />
                <NavigationTransportCard
                    mode="SHUTTLE"
                    duration="N/A"
                    isSelected={selectedMode === "SHUTTLE"}
                    onSelect={() => setSelectedMode("SHUTTLE")}
                />
            </View>

            {/* Divider Line */}
            <View style={styles.divider} />

            {/* 2. Stats & Action Row */}
            <View style={styles.actionRow}>
                <View style={styles.statsContainer}>
                    <Text style={styles.arrivingLabel}>Arriving in</Text>
                    <Text style={styles.arrivingTime}>5 mins</Text>
                </View>

                <View style={styles.statsContainer}>
                    <Text style={styles.etaLabel}>ETA</Text>
                    <Text style={styles.etaTime}>16:37</Text>
                </View>

                <NavigationGoButton onPress={handleGo} />
            </View>
        </BottomDrawer>
    );
}

const styles = StyleSheet.create({
    drawerContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: "center",
    },
    transportRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: "#E0E0E0",
        width: "100%",
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    statsContainer: {
        alignItems: "flex-start",
    },
    arrivingLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 2,
    },
    arrivingTime: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
    },
    etaLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 2,
    },
    etaTime: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
    },
});