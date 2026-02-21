import { View, StyleSheet } from 'react-native'
import React from 'react'
import CircleIconButton from '../CircleIconButton'
import NavigationInfoTop from '../navigation-info/NavigationInfoTop'
import NavigationInfoTopExt from '../navigation-info/NavigationInfoTopExt'

interface NavigationBarProps {
  readonly destination: string,
  readonly onPress?: () => void,
  readonly navigationInfoToggleState?: "maximize" | "minimize";
}
const NavigationBar = ({destination, onPress, navigationInfoToggleState} : NavigationBarProps) => {
  return (
    <View style={styles.container}>
  <View style={styles.circleButtonWrapper}>
    <CircleIconButton icon="arrow-back" onPress={onPress} />
  </View>

  <View style={styles.navigationWrapper}>
    {navigationInfoToggleState === "maximize" && (
      <NavigationInfoTopExt destination={destination} />
    )}
    {navigationInfoToggleState === "minimize" && (
      <NavigationInfoTop destination={destination} />
    )}
  </View>
</View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  circleButtonWrapper: {
    justifyContent: 'flex-start',
  },

  navigationWrapper: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'flex-start',
  },
})

export default NavigationBar