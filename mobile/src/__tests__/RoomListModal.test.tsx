import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RoomListModal from '../components/RoomListModal';

describe('RoomListModal', () => {
  const defaultProps = {
    visible: true,
    selectingFor: 'start' as const,
    searchQuery: '',
    filteredRooms: ['H-831', 'H-832', 'H-833'],
    onSearchChange: jest.fn(),
    onSelectRoom: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders title "Select Start Room" when selectingFor is start', () => {
    const { getByText } = render(<RoomListModal {...defaultProps} />);
    expect(getByText('Select Start Room')).toBeTruthy();
  });

  it('renders title "Select End Room" when selectingFor is end', () => {
    const { getByText } = render(
      <RoomListModal {...defaultProps} selectingFor="end" />,
    );
    expect(getByText('Select End Room')).toBeTruthy();
  });

  it('renders title "All Rooms" when selectingFor is null', () => {
    const { getByText } = render(
      <RoomListModal {...defaultProps} selectingFor={null} />,
    );
    expect(getByText('All Rooms')).toBeTruthy();
  });

  it('renders all filtered rooms', () => {
    const { getByText } = render(<RoomListModal {...defaultProps} />);
    expect(getByText('H-831')).toBeTruthy();
    expect(getByText('H-832')).toBeTruthy();
    expect(getByText('H-833')).toBeTruthy();
  });

  it('shows "No rooms found" when filteredRooms is empty', () => {
    const { getByText } = render(
      <RoomListModal {...defaultProps} filteredRooms={[]} />,
    );
    expect(getByText('No rooms found')).toBeTruthy();
  });

  it('calls onSelectRoom when a room is pressed', () => {
    const { getByText } = render(<RoomListModal {...defaultProps} />);
    fireEvent.press(getByText('H-831'));
    expect(defaultProps.onSelectRoom).toHaveBeenCalledWith('H-831');
  });

  it('calls onClose when Close button is pressed', () => {
    const { getByText } = render(<RoomListModal {...defaultProps} />);
    fireEvent.press(getByText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSearchChange when text is typed', () => {
    const { getByPlaceholderText } = render(
      <RoomListModal {...defaultProps} />,
    );
    fireEvent.changeText(getByPlaceholderText('Search rooms...'), 'H-83');
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('H-83');
  });
});
