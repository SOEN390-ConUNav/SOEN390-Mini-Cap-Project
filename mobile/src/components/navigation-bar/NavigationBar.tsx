import { View, StyleSheet } from "react-native";
import React from "react";
import CircleIconButton from "../CircleIconButton";
import NavigationInfoTopCombined from "../navigation-info/NavigationInfoTopCombined";
import { Step } from "../../api/outdoorDirectionsApi";

interface NavigationBarProps {
  readonly destination: string;
  readonly onPress?: () => void;
  readonly navigationInfoToggleState?: "maximize" | "minimize";
  readonly navigationHUDToggleState?: "maximize" | "minimize";
  readonly isCancellingNavigation?: boolean;
  readonly navigationHUDStep?: Step;
}
const NavigationBar = ({
  destination,
  onPress,
  navigationInfoToggleState,
  navigationHUDToggleState,
  isCancellingNavigation = false,
  navigationHUDStep,
}: NavigationBarProps) => {
  // In screen state wiring, index===0 (snapped down/hidden) maps to "maximize".
  const showInfoExtended = isCancellingNavigation
    ? true
    : navigationInfoToggleState === "maximize";
  const shouldShowHudTopExt = isCancellingNavigation
    ? true
    : navigationInfoToggleState !== "maximize" &&
      navigationHUDToggleState === "maximize";

  return (
    <View style={styles.container}>
      {!isCancellingNavigation && (
        <View style={styles.circleButtonWrapper}>
          <CircleIconButton icon="arrow-back" onPress={onPress} />
        </View>
      )}

      <View
        style={[
          styles.navigationWrapper,
          isCancellingNavigation && styles.navigationWrapperNoBack,
        ]}
      >
        <NavigationInfoTopCombined
          destination={destination}
          showInfoExtended={showInfoExtended}
          showHudExtended={shouldShowHudTopExt}
          hudStep={navigationHUDStep}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  circleButtonWrapper: {
    justifyContent: "flex-start",
  },

  navigationWrapper: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "flex-start",
  },
  navigationWrapperNoBack: {
    marginLeft: 0,
  },
});

export default NavigationBar;
