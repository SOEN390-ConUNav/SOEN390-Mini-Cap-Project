import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { IndoorDirectionResponse } from '../types/indoorDirections';

interface DirectionsPanelProps {
  routeData: IndoorDirectionResponse | null;
  onClose: () => void;
}

export default function DirectionsPanel({ routeData, onClose }: DirectionsPanelProps) {
  if (!routeData || !routeData.steps || routeData.steps.length === 0) {
    return null;
  }

  return (
    <View style={styles.directionsPanel}>
      <View style={styles.directionsHeader}>
        <Text style={styles.directionsTitle}>Step-by-Step Directions</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeDirectionsButton}>
          <Text style={styles.closeDirectionsText}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.directionsList}>
        {routeData.steps.map((step, index) => (
          <View key={index} style={styles.directionStep}>
            <View style={styles.directionStepNumber}>
              <Text style={styles.directionStepNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.directionStepContent}>
              <Text style={styles.directionStepText}>{step.instruction}</Text>
              {(step.distance || step.duration) && (
                <Text style={styles.directionStepMeta}>
                  {step.distance} • {step.duration}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  directionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  closeDirectionsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDirectionsText: {
    fontSize: 18,
    color: '#757575',
    fontWeight: '600',
  },
  directionsList: {
    padding: 16,
  },
  directionStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  directionStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B1538',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  directionStepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  directionStepContent: {
    flex: 1,
  },
  directionStepText: {
    fontSize: 15,
    color: '#212121',
    marginBottom: 4,
    lineHeight: 20,
  },
  directionStepMeta: {
    fontSize: 13,
    color: '#757575',
  },
});
