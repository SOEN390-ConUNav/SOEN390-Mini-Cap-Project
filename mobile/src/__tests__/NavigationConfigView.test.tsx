import React from 'react';
import { render } from '@testing-library/react-native';
import NavigationConfigView from '../components/navigation-config/NavigationConfigView';
import { OutdoorDirectionResponse } from '../api/outdoorDirectionsApi';

// Updated mock paths to match component location
jest.mock('../components/navigation-config/NavigationTransportCard', () => {
  const { Text } = require('react-native');
  return (props: any) => (
    <Text>
      {props.mode}: {props.duration}
    </Text>
  );
});

jest.mock('../components/navigation-config/NavigationPathRow', () => {
  const { Text } = require('react-native');
  return (props: any) => <Text>PathRow Duration: {props.duration}</Text>;
});

jest.mock('../components/BottomDrawer', () => {
  const { View } = require('react-native');
  return (props: any) => <View>{props.children}</View>;
});

const mockSetNavigationMode = jest.fn();
jest.mock('../hooks/useNavigationConfig', () => ({
  __esModule: true,
  default: () => ({
    navigationMode: 'WALK',
    setNavigationMode: mockSetNavigationMode,
  }),
}));

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
  it('renders with durations mapped correctly', () => {
    const { getByText } = render(
      <NavigationConfigView
        destinationName="Test Dest"
        destinationAddress="123 Test St"
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

  it('passes the selected mode duration to NavigationPathRow', () => {
    const { getByText } = render(
      <NavigationConfigView
        destinationName="Test Dest"
        destinationAddress="123 Test St"
        durations={mockDurations}
        visible={true}
        onClose={jest.fn()}
      />,
    );

    expect(getByText('PathRow Duration: 10 mins')).toBeTruthy();
  });
});
