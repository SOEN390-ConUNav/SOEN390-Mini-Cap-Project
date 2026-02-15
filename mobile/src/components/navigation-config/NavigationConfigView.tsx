import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import BottomDrawer from '../BottomDrawer';
import NavigationTransportCard from './NavigationTransportCard';
import NavigationPathRow from './NavigationPathRow';
import useNavigationConfig from '../../hooks/useNavigationConfig';
import { OutdoorDirectionResponse } from '../../api/outdoorDirectionsApi';

interface NavigationConfigViewProps {
  readonly durations: OutdoorDirectionResponse[];
  readonly visible: boolean;
  readonly onClose: () => void;
}

export default function NavigationConfigView({
  durations,
  visible,
  onClose,
}: NavigationConfigViewProps) {
  const { navigationMode, setNavigationMode } = useNavigationConfig();
  const getDurationForMode = (mode: string) => {
    const route = durations.find(
      (d) => d.transportMode?.toLowerCase() === mode.toLowerCase(),
    );

    return route ? route.duration : 'N/A';
  };
  const getSelectedDuration = () => {
    const modeMapping: Record<string, string> = {
      WALK: 'walking',
      BIKE: 'bicycling',
      BUS: 'transit',
      SHUTTLE: 'shuttle',
    };

    const apiKey = modeMapping[navigationMode] || 'walking';
    return getDurationForMode(apiKey);
  };
  const handleGo = () => {
    // Logic to start the actual turn-by-turn navigation
    console.log('Start navigation with mode:', navigationMode);
  };

  return (
    <BottomDrawer
      visible={visible}
      onClose={onClose}
      snapPoints={['35%']} // Adjusted height for this content
      enablePanDownToClose={true}
      contentContainerStyle={styles.drawerContent}
    >
      {/* 1. Transport Mode Selection Row */}
      <View style={styles.transportRow}>
        <NavigationTransportCard
          mode="WALK"
          duration={getDurationForMode('walking')}
          isSelected={navigationMode === 'WALK'}
          onSelect={() => setNavigationMode('WALK')}
        />
        <NavigationTransportCard
          mode="BIKE"
          duration={getDurationForMode('bicycling')}
          isSelected={navigationMode === 'BIKE'}
          onSelect={() => setNavigationMode('BIKE')}
        />
        <NavigationTransportCard
          mode="BUS"
          duration={getDurationForMode('transit')}
          isSelected={navigationMode === 'BUS'}
          onSelect={() => setNavigationMode('BUS')}
        />
        <NavigationTransportCard
          mode="SHUTTLE"
          duration="N/A"
          isSelected={navigationMode === 'SHUTTLE'}
          onSelect={() => setNavigationMode('SHUTTLE')}
        />
      </View>

      {/* 2. Stats & Action Row */}
      <NavigationPathRow duration={getSelectedDuration()} handleGo={handleGo} />
    </BottomDrawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
    backgroundColor: '',
  },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '95%',
    paddingHorizontal: 5,
    marginBottom: 20,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
  },
});
