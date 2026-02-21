import {useEffect, useMemo, useRef, ReactNode} from "react";
import {BottomSheetModal, BottomSheetView} from "@gorhom/bottom-sheet";
import {StyleSheet, TouchableOpacity, View, ViewStyle} from "react-native";

interface BottomDrawerProps {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
    snapPoints?: string[] | number[];
    initialSnapIndex?: number;
    backgroundColor?: string;
    handleColor?: string;
    enablePanDownToClose?: boolean;
    enableDynamicSizing?: boolean;
    contentContainerStyle?: ViewStyle;
    isDismissable?: boolean;
    onPressAction?: () => void;
}

export default function BottomDrawer({
                                         visible,
                                         onClose,
                                         children,
                                         snapPoints = ['10%', '50%', '75%'],
                                         initialSnapIndex = 0,
                                         backgroundColor = '#FFFFFF',
                                         handleColor = '#00000040',
                                         enablePanDownToClose = true,
                                         enableDynamicSizing = false,
                                         contentContainerStyle,
                                         isDismissable = true,
                                         onPressAction
                                     }: BottomDrawerProps) {
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const onPressToggleIndex = useRef(0);

    const CustomHandle = ({onPress}: { onPress: () => void }) => {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.handleWrapper, {backgroundColor}]}
            >
                <View style={[styles.handleIndicator, {backgroundColor: handleColor}]}/>
            </TouchableOpacity>
        );
    };

    const onPress = () => {
        if (isDismissable) {
            bottomSheetRef.current?.dismiss();
        } else {
            bottomSheetRef.current?.snapToIndex(onPressToggleIndex.current);
            onPressToggleIndex.current = onPressToggleIndex.current === 1 ? 0 : 1;
            onPressAction?.();
        }
    }

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
            snapPoints={memoizedSnapPoints}
            index={initialSnapIndex}
            enableDynamicSizing={enableDynamicSizing}
            enablePanDownToClose={enablePanDownToClose}
            onDismiss={onClose}
            backgroundStyle={[styles.background, { backgroundColor }]}
            handleComponent={() => (
                <CustomHandle onPress={onPress}/>
            )}
        >
            <BottomSheetView style={[styles.contentContainer, contentContainerStyle]}>
                {children}
            </BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    background: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -5, // Small negative value to show above the sheet
        },
        shadowOpacity: 0.99,
        shadowRadius: 10,
        elevation: 10,
    },
    contentContainer: {
        paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
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
    },
});