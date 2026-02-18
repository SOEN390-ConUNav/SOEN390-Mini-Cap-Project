import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { IndoorDirectionResponse } from '../types/indoorDirections';

interface BottomPanelProps {
  startRoom: string;
  endRoom: string;
  routeData: IndoorDirectionResponse | null;
  isLoadingRoute: boolean;
  showDirections: boolean;
  onToggleDirections: () => void;
}

export default function BottomPanel({
  startRoom,
  endRoom,
  routeData,
  isLoadingRoute,
  showDirections,
  onToggleDirections,
}: BottomPanelProps) {
  return (
    <View style={styles.bottomPanel}>
      {!routeData || isLoadingRoute ? (
        /* Suggestion Panel - When no route is shown */
        <View style={styles.suggestionPanel}>
          <Text style={styles.suggestionSubtitle}>
            {!startRoom && !endRoom
              ? 'Select a starting point and destination above'
              : !startRoom
              ? 'Select a starting point'
              : !endRoom
              ? 'Select a destination'
              : 'Finding route...'}
          </Text>
        </View>
      ) : (
        /* Route Summary Panel - When route is available */
        <View style={styles.routeSummaryPanel}>
          <View style={styles.routeInfoRow}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoLabel}>From</Text>
              <Text style={styles.routeInfoValue} numberOfLines={1}>{startRoom || '—'}</Text>
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoLabel}>To</Text>
              <Text style={styles.routeInfoValue} numberOfLines={1}>{endRoom || '—'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.goButton} onPress={onToggleDirections}>
            <Text style={styles.goButtonText}>
              {showDirections ? 'Hide' : 'Show'} Directions
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomPanel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 80 : 60,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  suggestionPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    alignItems: 'center',
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  routeSummaryPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  routeInfo: {
    alignItems: 'center',
  },
  routeInfoLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  routeInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    maxWidth: 140,
  },
  goButton: {
    backgroundColor: '#8B1538',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  goButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
