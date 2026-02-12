import React from "react";
import {StyleSheet, View, Text, ActivityIndicator} from "react-native";
import BottomDrawer from "../BottomDrawer";
import NavigationTransportCard from "./NavigationTransportCard";
import NavigationPathRow from "./NavigationPathRow";
import useNavigationConfig from "../../hooks/useNavigationConfig";
import useNavigationInfo from "../../hooks/useNavigationInfo";

interface NavigationConfigViewProps {
    visible: boolean;
    onClose: () => void;
}

export default function NavigationConfigView({visible, onClose}: NavigationConfigViewProps) {
    const {navigationMode, setNavigationMode} = useNavigationConfig();
    const {isLoading} = useNavigationInfo();
    const handleGo = () => {
        // Logic to start the actual turn-by-turn navigation
        console.log("Start navigation with mode:", navigationMode);
    };

    return (
        <BottomDrawer
            visible={visible}
            onClose={onClose}
            snapPoints={['35%']} // Adjusted height for this content
            enablePanDownToClose={true}
            contentContainerStyle={styles.drawerContent}
        >
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff"/>
                    <Text>Calculating Route...</Text>
                </View>
            ) : (
                <>
                    {/* 1. Transport Mode Selection Row */}
                    <View style={styles.transportRow}>
                        <NavigationTransportCard
                            mode="WALK"
                            duration="5 mins"
                            isSelected={navigationMode === "WALK"}
                            onSelect={() => setNavigationMode("WALK")}
                        />
                        <NavigationTransportCard
                            mode="BIKE"
                            duration="5 mins"
                            isSelected={navigationMode === "BIKE"}
                            onSelect={() => setNavigationMode("BIKE")}
                        />
                        <NavigationTransportCard
                            mode="BUS"
                            duration="N/A"
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
                    <NavigationPathRow handleGo={handleGo}/>
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
        backgroundColor: ""
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
        height: 150
    }
});