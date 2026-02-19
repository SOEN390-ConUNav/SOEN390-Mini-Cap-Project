import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import SearchPanel from '../components/SearchPanel';

jest.mock('../api', () => ({
  searchLocations: jest.fn(),
  getNearbyPlaces: jest.fn(),
  getAllOutdoorDirectionsInfo: jest.fn(),
}));

jest.mock('../utils/searchHistory', () => ({
  addSearchHistory: jest.fn(),
  getSearchHistory: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({status: 'granted'}),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({coords: {latitude: 45, longitude: -73}}),
}));

import {searchLocations} from '../api';
import {getSearchHistory} from '../utils/searchHistory';

describe('SearchPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects a search result and calls onSelectLocation and onClose', async () => {
    (getSearchHistory as jest.Mock).mockResolvedValue([]);
    (searchLocations as jest.Mock).mockResolvedValue([
      {id: '1', name: 'Place A', address: 'Addr', location: {latitude: 1, longitude: 2}},
    ]);

    const onSelectLocation = jest.fn();
    const onClose = jest.fn();

    const {getByPlaceholderText, findByText} = render(
      <SearchPanel visible onSelectLocation={onSelectLocation} onClose={onClose} />,
    );

    const input = getByPlaceholderText('Search');
    fireEvent.changeText(input, 'Place A');
    fireEvent(input, 'submitEditing', {nativeEvent: {text: 'Place A'}});

    const item = await findByText('Place A');
    fireEvent.press(item);

    await waitFor(() => {
      expect(onSelectLocation).toHaveBeenCalledWith({latitude: 1, longitude: 2, name: 'Place A'});
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('Close button triggers onClose', () => {
    const onSelectLocation = jest.fn();
    const onClose = jest.fn();

    const {getByText} = render(
      <SearchPanel visible onSelectLocation={onSelectLocation} onClose={onClose} />,
    );

    fireEvent.press(getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});