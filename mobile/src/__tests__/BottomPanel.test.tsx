import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import BottomPanel from '../components/BottomPanel';
import { IndoorDirectionResponse } from '../types/indoorDirections';

describe('BottomPanel', () => {
  const onToggleDirections = jest.fn();

  const baseProps = {
    startRoom: '',
    endRoom: '',
    routeData: null as IndoorDirectionResponse | null,
    isLoadingRoute: false,
    showDirections: false,
    onToggleDirections,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows default guidance when no rooms are selected', () => {
    const { getByText } = render(<BottomPanel {...baseProps} />);
    expect(
      getByText('Select a starting point and destination above'),
    ).toBeTruthy();
  });

  it('shows destination prompt when only start room is set', () => {
    const { getByText } = render(
      <BottomPanel {...baseProps} startRoom="H-801" />,
    );
    expect(getByText('Select a destination')).toBeTruthy();
  });

  it('shows route loading prompt when waiting for route', () => {
    const { getByText } = render(
      <BottomPanel
        {...baseProps}
        startRoom="H-801"
        endRoom="H-820"
        isLoadingRoute={true}
      />,
    );
    expect(getByText('Finding route...')).toBeTruthy();
  });

  it('renders route summary and toggles directions', () => {
    const routeData: IndoorDirectionResponse = {
      distance: '25m',
      duration: '2 min',
      buildingName: 'Hall Building',
      buildingId: 'Hall-8',
      startFloor: '8',
      endFloor: '8',
      steps: [{ instruction: 'Head straight' }],
      polyline: '',
      routePoints: [{ x: 10, y: 10 }],
      stairMessage: null,
    };

    const { getByText } = render(
      <BottomPanel
        {...baseProps}
        startRoom="H-801"
        endRoom="H-820"
        routeData={routeData}
      />,
    );

    expect(getByText('From')).toBeTruthy();
    expect(getByText('To')).toBeTruthy();
    fireEvent.press(getByText('Show Directions'));
    expect(onToggleDirections).toHaveBeenCalledTimes(1);
  });
});
