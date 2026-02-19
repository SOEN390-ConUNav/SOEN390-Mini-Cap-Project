import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSharedValue } from "react-native-reanimated";
import RouteCard from "./RouteCard";
import RouteRow from "./RouteRow";

interface SearchBarProps {
    placeholder: string;
    onPress: () => void;
    isConfiguring?: boolean;
    isNavigating?: boolean;
    originLabel?: string;
    destinationLabel?: string;
    onBack?: () => void;
    onSwap?: () => void;
}

export default function SearchBar({
                                      placeholder,
                                      onPress,
                                      isConfiguring = false,
                                      isNavigating = false,
                                      originLabel = "Current Location",
                                      destinationLabel = "Select destination",
                                      onBack,
                                      onSwap,
                                  }: SearchBarProps) {
    // Dummy shared values — no drag interaction while navigating
    const dummyDrag = useSharedValue(0);

    // ── Navigating: single "To" row in a card shell ──
    if (isNavigating) {
        return (
            <View style={styles.singleRowCard}>
                <RouteRow
                    label="To"
                    value={destinationLabel}
                    onSwap={() => {}}
                    dragProgress={dummyDrag}
                    siblingDragProgress={dummyDrag}
                />
            </View>
        );
    }

    // ── Configuring: full route card ──
    if (isConfiguring) {
        return (
            <RouteCard
                originLabel={originLabel}
                destinationLabel={destinationLabel}
                onBack={onBack ?? (() => {})}
                onSwap={onSwap ?? (() => {})}
            />
        );
    }

    // ── Default: search bar ──
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]}
        >
            <Ionicons name="search" size={18} color="#555" />
            <Text style={styles.text}>{placeholder}</Text>
            <View style={styles.spacer} />
            <Ionicons name="mic" size={18} color="#555" />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.95)",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    text: {
        opacity: 0.65,
        fontSize: 15,
    },
    spacer: {
        flex: 1,
    },
    // Matches RouteCard's card shell but without the row/flex layout for a back button
    singleRowCard: {
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.97)",
        paddingVertical: 10,
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
});