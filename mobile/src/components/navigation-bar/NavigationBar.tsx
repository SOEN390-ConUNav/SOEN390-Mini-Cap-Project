import { View, StyleSheet } from 'react-native'
import React from 'react'
import CircleIconButton from '../CircleIconButton'
import NavigationInfoTop from '../navigation-info/NavigationInfoTop'

const NavigationBar = () => {
  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
        <CircleIconButton icon='arrow-back' />
      </View>
      <View style={styles.navigationWrapper}>
        <NavigationInfoTop />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  buttonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navigationWrapper: {
    flex: 10,
    justifyContent: 'center',
  },
})

export default NavigationBar
