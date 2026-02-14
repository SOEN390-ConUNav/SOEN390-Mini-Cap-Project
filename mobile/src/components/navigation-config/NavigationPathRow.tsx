import { StyleSheet, Text, View } from 'react-native';
import NavigationGoButton from './NavigationGoButton';
import React from 'react';

interface NavigationPathRowProps {
  handleGo: () => void;
  duration: string;
}

export default function NavigationPathRow({
  handleGo,
  duration,
}: NavigationPathRowProps) {
  const calculateETA = (durationStr: string) => {
    if (!durationStr || durationStr === 'N/A') return '--:--';

    const now = new Date();

    const hourMatch = durationStr.match(/(\d+)(?:[ ]?h|[ ]?hour)/i);
    const minMatch = durationStr.match(/(\d+)(?:[ ]?m|[ ]?min)/i);

    const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const mins = minMatch ? parseInt(minMatch[1], 10) : 0;

    if (hours > 8760) return '--:--';

    now.setHours(now.getHours() + hours);
    now.setMinutes(now.getMinutes() + mins);

    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  return (
    <View style={styles.actionRow}>
      <View style={styles.statsContainer}>
        <Text style={styles.arrivingLabel}>Arriving in</Text>
        <Text
          style={styles.arrivingTime}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {duration}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.etaLabel}>ETA</Text>
        <Text style={styles.etaTime}>{calculateETA(duration)}</Text>
      </View>

      <NavigationGoButton onPress={handleGo} />
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    width: '95%',
    height: '57%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 3,
    borderColor: '#D9D9D9',
    borderWidth: 1,
  },
  statsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  arrivingTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  etaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  etaTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
});
