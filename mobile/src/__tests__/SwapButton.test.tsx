import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import SwapButton from '../components/SwapButton';

const baseProps = {
    onPress: jest.fn(),
};

describe('SwapButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { root } = render(<SwapButton {...baseProps} />);
        expect(root).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const { root } = render(<SwapButton {...baseProps} />);
        fireEvent.press(root);
        expect(baseProps.onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPress only once per press', () => {
        const { root } = render(<SwapButton {...baseProps} />);
        fireEvent.press(root);
        fireEvent.press(root);
        expect(baseProps.onPress).toHaveBeenCalledTimes(2);
    });

    it('forwards hitSlop to Pressable', () => {
        const { root } = render(<SwapButton {...baseProps} />);
        expect(root.props.hitSlop).toBe(8);
    });

    it('applies correct dimensions and border radius', () => {
        const { root } = render(<SwapButton {...baseProps} />);
        const flat = StyleSheet.flatten(root.props.style);
        expect(flat.width).toBe(28);
        expect(flat.height).toBe(28);
        expect(flat.borderRadius).toBe(14);
    });

    it('applies default background color', () => {
        const { root } = render(<SwapButton {...baseProps} />);
        const flat = StyleSheet.flatten(root.props.style);
        expect(flat.backgroundColor).toBe('rgba(128,0,32,0.10)');
    });
});