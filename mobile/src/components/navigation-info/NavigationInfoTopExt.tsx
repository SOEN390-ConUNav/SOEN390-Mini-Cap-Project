import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import useNavigationInfo from '../../hooks/useNavigationInfo'

interface NavigationInfoTopExtProps {
  readonly destination: string
}

const NavigationInfoTopExt = ({ destination }: NavigationInfoTopExtProps) => {
  const dist = useNavigationInfo((state) => state.pathDistance)
  const dur = useNavigationInfo((state) => state.pathDuration)

  const findETA = (durationStr: string) => {
    if (!durationStr || durationStr === 'N/A') return '--:--'

    const now = new Date();
    let totalMinutes = 0;

    const tokens = durationStr.toLowerCase().split(/\s+/);
    for (let j = 0; j < tokens.length; j++) {
      const str = Number.parseInt(tokens[j], 10)
      if (!Number.isNaN(str)) {
        const nextStr = tokens[j + 1] || ''
        if (nextStr.includes('hour')) totalMinutes += str * 60
        else if (nextStr.includes('min')) totalMinutes += str
      }
    }

    if (totalMinutes === 0) return '--:--'

    now.setMinutes(now.getMinutes() + totalMinutes);

    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
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
        <Text style={styles.value}>{findETA(dur)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Distance</Text>
        <Text style={styles.value}>{dist}</Text>
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