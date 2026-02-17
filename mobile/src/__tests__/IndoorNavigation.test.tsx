import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import IndoorNavigation from '../app/indoor-navigation';
import {
  getAvailableRooms,
  getIndoorDirections,
  getPointsOfInterest,
  getRoomPoints,
} from '../api/indoorDirectionsApi';

const mockSetParams = jest.fn();
const mockDrawRoute = jest.fn();
const mockClearRoute = jest.fn();

let mockParams: { buildingId?: string; floor?: string } = {
  buildingId: 'H',
  floor: '8',
};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    setParams: mockSetParams,
  }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('../api/indoorDirectionsApi', () => ({
  getIndoorDirections: jest.fn(),
  getAvailableRooms: jest.fn(),
  getRoomPoints: jest.fn(),
  getPointsOfInterest: jest.fn(),
}));

jest.mock('../components/FloorPlanWebView', () => {
  const ReactLocal = require('react');
  const { View } = require('react-native');

  const MockFloorPlan = ReactLocal.forwardRef((_props: any, ref: any) => {
    ReactLocal.useImperativeHandle(ref, () => ({
      drawRoute: mockDrawRoute,
      clearRoute: mockClearRoute,
    }));

    return <View testID="floor-plan-webview" />;
  });

  return {
    __esModule: true,
    default: MockFloorPlan,
  };
});

jest.mock('../components/IndoorSearchBar', () => {
  const { View, Text, Pressable } = require('react-native');
  return (props: any) => (
    <View>
      <Text testID="start-room-value">{props.startRoom}</Text>
      <Text testID="end-room-value">{props.endRoom}</Text>
      <Pressable testID="open-start" onPress={props.onStartPress}>
        <Text>Open Start</Text>
      </Pressable>
      <Pressable testID="open-end" onPress={props.onEndPress}>
        <Text>Open End</Text>
      </Pressable>
      <Pressable testID="swap-locations" onPress={props.onSwap}>
        <Text>Swap</Text>
      </Pressable>
      <Pressable testID="clear-start" onPress={props.onClearStart}>
        <Text>Clear Start</Text>
      </Pressable>
      <Pressable testID="clear-end" onPress={props.onClearEnd}>
        <Text>Clear End</Text>
      </Pressable>
    </View>
  );
});

jest.mock('../components/RoomListModal', () => {
  const { View, Text, Pressable } = require('react-native');
  return (props: any) => {
    if (!props.visible) return null;

    return (
      <View>
        <Text testID="selecting-for">{props.selectingFor}</Text>
        <Pressable
          testID="pick-room-first"
          onPress={() => props.onSelectRoom(props.filteredRooms[0] || 'H-801')}
        >
          <Text>Pick First Room</Text>
        </Pressable>
        <Pressable
          testID="pick-room-second"
          onPress={() => props.onSelectRoom(props.filteredRooms[1] || 'H-820')}
        >
          <Text>Pick Second Room</Text>
        </Pressable>
      </View>
    );
  };
});

jest.mock('../components/FloorSelector', () => {
  const { Pressable, Text } = require('react-native');
  return (props: any) => (
    <Pressable
      testID="change-floor"
      onPress={() => props.onFloorSelect('9')}
    >
      <Text>Change Floor</Text>
    </Pressable>
  );
});

jest.mock('../components/BottomPanel', () => {
  const { View, Text, Pressable } = require('react-native');
  return (props: any) => (
    <View>
      <Text testID="bottom-start">{props.startRoom}</Text>
      <Text testID="bottom-end">{props.endRoom}</Text>
      <Pressable testID="toggle-directions" onPress={props.onToggleDirections}>
        <Text>Toggle Directions</Text>
      </Pressable>
    </View>
  );
});

jest.mock('../components/DirectionsPanel', () => {
  const { Text } = require('react-native');
  return (props: any) => (
    <Text testID="directions-panel">
      Steps: {props.routeData?.steps?.length ?? 0}
    </Text>
  );
});

describe('IndoorNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { buildingId: 'H', floor: '8' };

    (getAvailableRooms as jest.Mock).mockResolvedValue(['H-801', 'H-820']);
    (getRoomPoints as jest.Mock).mockResolvedValue([{ id: 'H-801', x: 1, y: 2 }]);
    (getPointsOfInterest as jest.Mock).mockResolvedValue([
      { id: 'POI-1', x: 4, y: 5, displayName: 'Cafe', type: 'food' },
    ]);
  });

  it('loads indoor data and draws a route after selecting start and end rooms', async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: '25m',
      duration: '2 min',
      buildingName: 'Hall Building',
      buildingId: 'Hall-8',
      startFloor: '8',
      endFloor: '8',
      steps: [{ instruction: 'Go straight', distance: '10m', duration: '30s' }],
      polyline: '',
      routePoints: [{ x: 10, y: 20 }],
      stairMessage: 'Use stairs between sections',
    });

    const { getByTestId, getByText } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getAvailableRooms).toHaveBeenCalledWith('H', '8');
      expect(getRoomPoints).toHaveBeenCalledWith('H', '8');
      expect(getPointsOfInterest).toHaveBeenCalledWith('H', '8');
    });

    fireEvent.press(getByTestId('open-start'));
    fireEvent.press(getByTestId('pick-room-first'));

    fireEvent.press(getByTestId('open-end'));
    fireEvent.press(getByTestId('pick-room-second'));

    await waitFor(() => {
      expect(getIndoorDirections).toHaveBeenCalledWith(
        'Hall-8',
        'H-801',
        'H-820',
        '8',
        '8',
      );
      expect(mockDrawRoute).toHaveBeenCalledWith([{ x: 10, y: 20 }]);
    });

    expect(getByText('🚶 Use stairs between sections')).toBeTruthy();
  });

  it('changes floor, clears route, and updates route params', async () => {
    (getIndoorDirections as jest.Mock).mockResolvedValue({
      distance: '10m',
      duration: '1 min',
      buildingName: 'Hall Building',
      buildingId: 'Hall-9',
      startFloor: '9',
      endFloor: '9',
      steps: [],
      polyline: '',
      routePoints: [],
      stairMessage: null,
    });

    const { getByTestId } = render(<IndoorNavigation />);

    await waitFor(() => {
      expect(getAvailableRooms).toHaveBeenCalledWith('H', '8');
    });

    fireEvent.press(getByTestId('change-floor'));

    await waitFor(() => {
      expect(mockSetParams).toHaveBeenCalledWith({ floor: '9' });
      expect(mockClearRoute).toHaveBeenCalled();
    });
  });
});
