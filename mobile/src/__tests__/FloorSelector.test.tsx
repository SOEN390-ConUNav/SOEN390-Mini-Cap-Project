import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FloorSelector from '../components/FloorSelector';

describe('FloorSelector', () => {
  const mockOnFloorSelect = jest.fn();

  const defaultProps = {
    currentFloor: '8',
    availableFloors: ['1', '2', '8', '9'],
    onFloorSelect: mockOnFloorSelect,
    buildingName: 'Hall Building',
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns null when only one floor is available', () => {
    const { toJSON } = render(
      <FloorSelector {...defaultProps} availableFloors={['8']} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('renders the current floor label', () => {
    const { getByText } = render(<FloorSelector {...defaultProps} />);
    expect(getByText('Floor 8')).toBeTruthy();
  });

  it('opens modal when selector is pressed', () => {
    const { getByText } = render(<FloorSelector {...defaultProps} />);
    fireEvent.press(getByText('Floor 8'));

    expect(getByText('Hall Building - Select Floor')).toBeTruthy();
  });

  it('renders all available floors inside the modal', () => {
    const { getByText } = render(<FloorSelector {...defaultProps} />);
    fireEvent.press(getByText('Floor 8'));
    expect(getByText('Floor 1')).toBeTruthy();
    expect(getByText('Floor 2')).toBeTruthy();
    expect(getByText('Floor 9')).toBeTruthy();
  });

  it('calls onFloorSelect when a floor is selected', () => {
    const { getByText } = render(<FloorSelector {...defaultProps} />);
    fireEvent.press(getByText('Floor 8'));
    fireEvent.press(getByText('Floor 9'));
    expect(mockOnFloorSelect).toHaveBeenCalledWith('9');
  });

  it('uses "Building" as fallback title when buildingName is not provided', () => {
    const { getByText } = render(
      <FloorSelector {...defaultProps} buildingName={undefined} />,
    );
    fireEvent.press(getByText('Floor 8'));
    expect(getByText('Building - Select Floor')).toBeTruthy();
  });
});
