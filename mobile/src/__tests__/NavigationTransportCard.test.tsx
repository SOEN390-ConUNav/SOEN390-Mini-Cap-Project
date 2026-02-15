import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NavigationTransportCard from '../components/navigation-config/NavigationTransportCard';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('NavigationTransportCard', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correct label and duration', () => {
    const { getByText } = render(
      <NavigationTransportCard
        mode="WALK"
        duration="10 mins"
        isSelected={false}
        onSelect={mockOnSelect}
      />,
    );

    expect(getByText('Walk')).toBeTruthy();
    expect(getByText('10 mins')).toBeTruthy();
  });

  it('calls onSelect when pressed', () => {
    const { getByText } = render(
      <NavigationTransportCard
        mode="BIKE"
        duration="5 mins"
        isSelected={false}
        onSelect={mockOnSelect}
      />,
    );

    fireEvent.press(getByText('Bike'));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when isSelected is true', () => {
    const { getByText } = render(
      <NavigationTransportCard
        mode="BUS"
        duration="8 mins"
        isSelected={true}
        onSelect={mockOnSelect}
      />,
    );

    const label = getByText('Bus');
    expect(label.props.style).toContainEqual({ color: '#FFFFFF' });
  });
});
