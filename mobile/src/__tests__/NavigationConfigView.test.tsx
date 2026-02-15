import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NavigationConfigView from '../components/navigation-config/NavigationConfigView';
import { OutdoorDirectionResponse } from '../api/outdoorDirectionsApi';

import useNavigationConfig from '../hooks/useNavigationConfig';

jest.mock('../components/navigation-config/NavigationTransportCard', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return (props: any) => (
    <TouchableOpacity onPress={props.onSelect} testID={`card-${props.mode}`}>
      <Text>
        {props.mode}: {props.duration}
      </Text>
    </TouchableOpacity>
  );
});

jest.mock('../components/navigation-config/NavigationPathRow', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return (props: any) => (
    <View>
      <Text>PathRow Duration: {props.duration}</Text>
      <TouchableOpacity onPress={props.handleGo} testID="go-button">
        <Text>GO</Text>
      </TouchableOpacity>
    </View>
  );
});

jest.mock('../components/BottomDrawer', () => {
  const { View } = require('react-native');
  return (props: any) => <View>{props.children}</View>;
});

jest.mock('../hooks/useNavigationConfig');
const mockedUseNavigationConfig = useNavigationConfig as unknown as jest.Mock;

const mockSetNavigationMode = jest.fn();

const mockDurations: OutdoorDirectionResponse[] = [
  {
    transportMode: 'walking',
    duration: '10 mins',
    distance: '1km',
    polyline: '',
    steps: [],
  },
  {
    transportMode: 'bicycling',
    duration: '5 mins',
    distance: '1km',
    polyline: '',
    steps: [],
  },
  {
    transportMode: 'transit',
    duration: '15 mins',
    distance: '5km',
    polyline: '',
    steps: [],
  },
];

describe('NavigationConfigView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigationConfig.mockReturnValue({
      navigationMode: 'WALK',
      setNavigationMode: mockSetNavigationMode,
    });
  });

  it('renders with durations mapped correctly', () => {
    const { getByText } = render(
      <NavigationConfigView
        durations={mockDurations}
        visible={true}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('WALK: 10 mins')).toBeTruthy();
    expect(getByText('BIKE: 5 mins')).toBeTruthy();
    expect(getByText('BUS: 15 mins')).toBeTruthy();
    expect(getByText('SHUTTLE: N/A')).toBeTruthy();
  });

  it('updates navigation mode when a card is pressed', () => {
    const { getByTestId } = render(
      <NavigationConfigView
        durations={mockDurations}
        visible={true}
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('card-BIKE'));
    expect(mockSetNavigationMode).toHaveBeenCalledWith('BIKE');

    fireEvent.press(getByTestId('card-SHUTTLE'));
    expect(mockSetNavigationMode).toHaveBeenCalledWith('SHUTTLE');
  });

  it('displays N/A for missing durations', () => {
    const { getByText } = render(
      <NavigationConfigView
        durations={[]}
        visible={true}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('WALK: N/A')).toBeTruthy();
  });

  it('passes the correctly selected duration to NavigationPathRow based on mode', () => {
    mockedUseNavigationConfig.mockReturnValue({
      navigationMode: 'BUS',
      setNavigationMode: mockSetNavigationMode,
    });

    const { getByText } = render(
      <NavigationConfigView
        durations={mockDurations}
        visible={true}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('PathRow Duration: 15 mins')).toBeTruthy();
  });

  it('falls back to walking duration if mode is not in TRANSPORT_MODE_API_MAP', () => {
    mockedUseNavigationConfig.mockReturnValue({
      navigationMode: 'UNKNOWN_MODE',
      setNavigationMode: mockSetNavigationMode,
    });

    const { getByText } = render(
      <NavigationConfigView
        durations={mockDurations}
        visible={true}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('PathRow Duration: 10 mins')).toBeTruthy();
  });

  it('executes handleGo when the go button is pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByTestId } = render(
      <NavigationConfigView
        durations={mockDurations}
        visible={true}
        onClose={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('go-button'));
    expect(consoleSpy).toHaveBeenCalledWith(
      'Start navigation with mode:',
      'WALK',
    );
    consoleSpy.mockRestore();
  });
});
