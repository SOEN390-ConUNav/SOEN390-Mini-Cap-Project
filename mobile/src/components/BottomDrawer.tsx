import {useEffect, useMemo, useRef} from "react";
import {BottomSheetModal, BottomSheetView} from "@gorhom/bottom-sheet";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";

interface BottomDrawerProps {
    visible: boolean,
    onClose: () => void
}

export default function BottomDrawer({visible, onClose}: BottomDrawerProps) {
    const snapPoints = useMemo(() => ['50%', '75%'], []);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const CustomHandle = ({onPress}: { onPress: () => void }) => {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={styles.handleWrapper}
            >
                {/* This is the visual "pill" bar */}
                <View style={styles.handleIndicator}/>
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={snapPoints}
            index={0}
            enableDynamicSizing={false}
            enablePanDownToClose={true}
            onDismiss={onClose}
            // Pass the custom handle here
            handleComponent={() => (
                <CustomHandle onPress={() => bottomSheetRef.current?.dismiss()}/>
            )}
        >
            <BottomSheetView style={styles.contentContainer}>
                <Text>Testing bottom Sheet</Text>
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        padding: 36,
        alignItems: 'center',
    },
    handleWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    handleIndicator: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#00000040',
    },
});