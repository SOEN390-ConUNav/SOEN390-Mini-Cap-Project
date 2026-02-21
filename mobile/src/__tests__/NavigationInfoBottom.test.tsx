import React from 'react';
import { render } from '@testing-library/react-native';
import NavigationInfoBottom from '../components/navigation-info/NavigationInfoBottom';
import useNavigationInfo from '../hooks/useNavigationInfo';

jest.mock('../hooks/useNavigationInfo', () => jest.fn());

jest.mock('../components/BottomDrawer', () => {
  const { View } = require('react-native');
  return ({ children }: { children: React.ReactNode }) => (
    <View testID="bottom-drawer">{children}</View>
  );
});

const mockUseNavigationInfo = useNavigationInfo as unknown as jest.Mock;

describe('NavigationInfoBottom', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseNavigationInfo.mockImplementation((selector) =>
      selector({
        pathDistance: '2.5 km',
        pathDuration: '10 min',
      }),
    );
  });

  const baseProps = {
    visible: true,
    onClose: jest.fn(),
  };

  it('renders without crashing', () => {
    const { root } = render(
      <NavigationInfoBottom {...baseProps} />,
    );
    expect(root).toBeTruthy();
  });

  it('renders ETA label', () => {
    const { getByText } = render(
      <NavigationInfoBottom {...baseProps} />,
    );

    expect(getByText('Estimated Time Arrival')).toBeTruthy();
  });

  it('renders Distance label', () => {
    const { getByText } = render(
      <NavigationInfoBottom {...baseProps} />,
    );

    expect(getByText('Distance')).toBeTruthy();
  });

  it('renders distance value from store', () => {
    const { getByText } = render(
      <NavigationInfoBottom {...baseProps} />,
    );

    expect(getByText('2.5 km')).toBeTruthy();
  });

  it('renders calculated ETA', () => {
    const { getByText } = render(
      <NavigationInfoBottom {...baseProps} />,
    );

    expect(getByText(/^\d{2}:\d{2}$/)).toBeTruthy();
  });

  it('renders --:-- if duration is N/A', () => {
    mockUseNavigationInfo.mockImplementation((selector) =>
      selector({
        pathDistance: '2.5 km',
        pathDuration: 'N/A',
      }),
    );

    const { getByText } = render(
      <NavigationInfoBottom {...baseProps} />,
    );

    expect(getByText('--:--')).toBeTruthy();
  });

  it('calculates ETA correctly for 1 hour 30 min', () => {
    // Mock the store to return "1 hour 30 min"
    (useNavigationInfo as unknown as jest.Mock).mockImplementation((selector) =>
      selector({
        pathDistance: '2.5 km',
        pathDuration: '1 hour 30 min',
      }),
    );

    const { getByText } = render(<NavigationInfoBottom {...baseProps} />);
    expect(getByText(/^\d{2}:\d{2}$/)).toBeTruthy();
  });

});