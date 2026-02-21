import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import useNavigationInfo from '../../hooks/useNavigationInfo'
import { calculateETA } from '../../utils/calculateETA'

interface NavigationInfoTopExtProps {
  readonly destination: string
}

const NavigationInfoTopExt = ({ destination }: NavigationInfoTopExtProps) => {
  const distance = useNavigationInfo((state) => state.pathDistance)
  const duration = useNavigationInfo((state) => state.pathDuration)

  return (
    <View style={styles.container}>
      
      <View style={styles.headerRow}>
        <MaterialIcons name="place" size={18} color="#000" />
        <Text style={styles.title}>{destination}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.label}>Arriving at</Text>
        <Text style={styles.value}>{calculateETA(duration)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{distance}</Text>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#800020',
    elevation: 4,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 16,
  },

  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },

  label: {
    color: '#555',
    fontSize: 14,
  },

  value: {
    fontWeight: 'bold',
    fontSize: 14,
  },
})

export default NavigationInfoTopExt