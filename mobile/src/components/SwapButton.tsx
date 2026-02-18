import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const BURGUNDY = "#800020";

interface SwapButtonProps {
    onPress: () => void;
}

export default function SwapButton({ onPress }: SwapButtonProps) {
    const rotation = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const handlePress = () => {
        rotation.value = withTiming(rotation.value + 180, {
            duration: 280,
            easing: Easing.inOut(Easing.ease),
        });
        onPress();
    };

    return (
        <Pressable
            onPress={handlePress}
            hitSlop={8}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        >
            <Animated.View style={animStyle}>
                <Ionicons name="swap-vertical" size={16} color={BURGUNDY} />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    btn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(128,0,32,0.10)",
        alignItems: "center",
        justifyContent: "center",
    },
    btnPressed: {
        backgroundColor: "rgba(128,0,32,0.20)",
    },
});