import React from 'react';
import { render } from '@testing-library/react-native';
import RouteRow from '../components/search-bar/RouteRow';

// react-native-reanimated is handled by src/__mocks__/react-native-reanimated.js
// @expo/vector-icons is globally mocked as plain View in jest.setup.js

jest.mock('react-native-gesture-handler', () => {
    const { View } = require('react-native');
    return {
        Gesture: {
            Pan: () => ({
                onBegin:    function () { return this; },
                onUpdate:   function () { return this; },
                onEnd:      function () { return this; },
                onFinalize: function () { return this; },
            }),
        },
        GestureDetector: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    };
});

const makeSharedValue = (init: number) => ({
    value: init,
    get: () => init,
    set: () => {},
    addListener: () => {},
    removeListener: () => {},
    modify: () => {},
    _isReanimatedSharedValue: true as const,
});

const baseProps = {
    label: 'From' as const,
    value: 'Hall Building',
    onSwap: jest.fn(),
    dragProgress: makeSharedValue(0),
    siblingDragProgress: makeSharedValue(0),
};

describe('RouteRow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { root } = render(<RouteRow {...baseProps} />);
        expect(root).toBeTruthy();
    });

    it('renders the "From" label', () => {
        const { getByText } = render(<RouteRow {...baseProps} label="From" />);
        expect(getByText('From')).toBeTruthy();
    });

    it('renders the "To" label', () => {
        const { getByText } = render(<RouteRow {...baseProps} label="To" />);
        expect(getByText('To')).toBeTruthy();
    });

    it('renders the value text', () => {
        const { getByText } = render(<RouteRow {...baseProps} value="Loyola Campus" />);
        expect(getByText('Loyola Campus')).toBeTruthy();
    });

    it('renders both label and value simultaneously', () => {
        const { getByText } = render(
            <RouteRow {...baseProps} label="To" value="Loyola Campus" />,
        );
        expect(getByText('To')).toBeTruthy();
        expect(getByText('Loyola Campus')).toBeTruthy();
    });

    it('renders updated value when prop changes', () => {
        const { getByText, rerender } = render(
            <RouteRow {...baseProps} value="Hall Building" />,
        );
        expect(getByText('Hall Building')).toBeTruthy();

        rerender(<RouteRow {...baseProps} value="Loyola Campus" />);
        expect(getByText('Loyola Campus')).toBeTruthy();
    });

    it('renders updated label when prop changes', () => {
        const { getByText, rerender } = render(<RouteRow {...baseProps} label="From" />);
        expect(getByText('From')).toBeTruthy();

        rerender(<RouteRow {...baseProps} label="To" />);
        expect(getByText('To')).toBeTruthy();
    });
});