import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import IndoorSearchBar from '../components/IndoorSearchBar';

describe('IndoorSearchBar', () => {
  const baseProps = {
    startRoom: '',
    endRoom: '',
    isLoadingRoute: false,
    statusBarHeight: 0,
    onStartPress: jest.fn(),
    onEndPress: jest.fn(),
    onClearStart: jest.fn(),
    onClearEnd: jest.fn(),
    onSwap: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders building and floor info when floor is provided', () => {
    const { getByText } = render(
      <IndoorSearchBar {...baseProps} floor="8" />,
    );
    expect(getByText('Hall Building - Floor 8')).toBeTruthy();
  });

  it('calls start and end handlers when main sections are pressed', () => {
    const { getByText } = render(
      <IndoorSearchBar
        {...baseProps}
        buildingName="Hall Building"
        floor="9"
      />,
    );

    fireEvent.press(getByText('From'));
    fireEvent.press(getByText('To'));

    expect(baseProps.onStartPress).toHaveBeenCalledTimes(1);
    expect(baseProps.onEndPress).toHaveBeenCalledTimes(1);
  });

  it('calls clear handlers when room values exist', () => {
    const { getAllByText } = render(
      <IndoorSearchBar
        {...baseProps}
        startRoom="H-801"
        endRoom="H-820"
        buildingName="Hall Building"
        floor="8"
      />,
    );

    const clearButtons = getAllByText('✕');
    fireEvent(clearButtons[0], 'press', { stopPropagation: jest.fn() });
    fireEvent(clearButtons[1], 'press', { stopPropagation: jest.fn() });

    expect(baseProps.onClearStart).toHaveBeenCalledTimes(1);
    expect(baseProps.onClearEnd).toHaveBeenCalledTimes(1);
  });

  it('does not swap when one endpoint is missing', () => {
    const { getByText } = render(
      <IndoorSearchBar
        {...baseProps}
        startRoom="H-801"
        endRoom=""
      />,
    );

    fireEvent.press(getByText('⇄'));
    expect(baseProps.onSwap).not.toHaveBeenCalled();
  });

  it('swaps and shows loading indicator when route search is active', () => {
    const { getByText } = render(
      <IndoorSearchBar
        {...baseProps}
        startRoom="H-801"
        endRoom="H-820"
        isLoadingRoute={true}
      />,
    );

    fireEvent.press(getByText('⇄'));
    expect(baseProps.onSwap).toHaveBeenCalledTimes(1);
    expect(getByText('Finding route...')).toBeTruthy();
  });
});
