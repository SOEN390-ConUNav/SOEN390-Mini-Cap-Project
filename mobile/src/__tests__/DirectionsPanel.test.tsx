import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DirectionsPanel from '../components/DirectionsPanel';
import { IndoorDirectionResponse } from '../types/indoorDirections';

describe('DirectionsPanel', () => {
  const mockOnClose = jest.fn();

  const routeData: IndoorDirectionResponse = {
    distance: '120m',
    duration: '2 min',
    buildingName: 'Hall Building',
    buildingId: 'Hall-8',
    startFloor: '8',
    endFloor: '8',
    steps: [
      { instruction: 'Head north', distance: '30m', duration: '30s', floor: '8' },
      { instruction: 'Turn left', distance: '20m', duration: '20s', floor: '8' },
    ],
    polyline: '',
    routePoints: [],
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns null when routeData is null', () => {
    const { toJSON } = render(
      <DirectionsPanel routeData={null} onClose={mockOnClose} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('returns null when steps array is empty', () => {
    const empty = { ...routeData, steps: [] };
    const { toJSON } = render(
      <DirectionsPanel routeData={empty} onClose={mockOnClose} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('renders the header title', () => {
    const { getByText } = render(
      <DirectionsPanel routeData={routeData} onClose={mockOnClose} />,
    );
    expect(getByText('Step-by-Step Directions')).toBeTruthy();
  });

  it('renders all steps with numbered badges', () => {
    const { getByText } = render(
      <DirectionsPanel routeData={routeData} onClose={mockOnClose} />,
    );
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Head north')).toBeTruthy();
    expect(getByText('Turn left')).toBeTruthy();
  });

  it('renders distance and duration metadata', () => {
    const { getByText } = render(
      <DirectionsPanel routeData={routeData} onClose={mockOnClose} />,
    );
    expect(getByText('30m • 30s')).toBeTruthy();
    expect(getByText('20m • 20s')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByText } = render(
      <DirectionsPanel routeData={routeData} onClose={mockOnClose} />,
    );
    fireEvent.press(getByText('✕'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
