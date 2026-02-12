import React from "react";
import { StyleSheet, Text, Pressable } from "react-native";

const BURGUNDY = "#800020";

interface Props {
    onPress: () => void;
}

export default function NavigationGoButton({ onPress }: Props) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed
            ]}
            onPress={onPress}
        >
            <Text style={styles.text}>GO</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: BURGUNDY,
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }]
    },
    text: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "bold",
    },
});