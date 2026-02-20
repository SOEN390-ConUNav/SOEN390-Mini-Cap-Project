import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import useNavigationInfo from '../../hooks/useNavigationInfo'

interface NavigationInfoTopExtProps {
  destination: string
}

const NavigationInfoTopExt = ({ destination }: NavigationInfoTopExtProps) => {
  const pathDistance = useNavigationInfo((state) => state.pathDistance)
  const pathDuration = useNavigationInfo((state) => state.pathDuration)

  const calculateETA = (durationStr: string) => {
    if (!durationStr || durationStr === 'N/A') return '--:--'

    const now = new Date()
    let totalMinutes = 0

    const tokens = durationStr.toLowerCase().split(/\s+/)
    for (let i = 0; i < tokens.length; i++) {
      const val = Number.parseInt(tokens[i], 10)
      if (!Number.isNaN(val)) {
        const nextToken = tokens[i + 1] || ''
        if (nextToken.includes('hour')) totalMinutes += val * 60
        else if (nextToken.includes('min')) totalMinutes += val
      }
    }

    if (totalMinutes === 0) return '--:--'

    now.setMinutes(now.getMinutes() + totalMinutes)

    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.headerRow}>
        <MaterialIcons name="place" size={18} color="#000" />
        <Text style={styles.title}>{destination}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.label}>Arriving at</Text>
        <Text style={styles.value}>{calculateETA(pathDuration)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{pathDistance}</Text>
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