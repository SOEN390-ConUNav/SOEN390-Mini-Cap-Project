import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import CircleIconButton from '../components/CircleIconButton';

jest.mock('@expo/vector-icons', () => {
    const { View } = require('react-native');
    return {
        Ionicons: ({ name }: { name: string }) => (
            <View testID={`icon-${name}`} />
        ),
    };
});

describe('CircleIconButton', () => {
    const baseProps = {
        icon: 'add' as const,
        onPress: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { root } = render(<CircleIconButton {...baseProps} />);
        expect(root).toBeTruthy();
    });

    it('renders the correct icon', () => {
        const { getByTestId } = render(
            <CircleIconButton {...baseProps} icon="heart" />,
        );
        expect(getByTestId('icon-heart')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
        const { getByTestId } = render(<CircleIconButton {...baseProps} />);
        fireEvent.press(getByTestId('icon-add'));
        expect(baseProps.onPress).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onPress is undefined', () => {
        const { getByTestId } = render(<CircleIconButton icon="add" />);
        expect(() => fireEvent.press(getByTestId('icon-add'))).not.toThrow();
    });

    it('applies default size of 20 and computes diameter as 34', () => {
        const { root } = render(<CircleIconButton {...baseProps} />);
        const flat = StyleSheet.flatten(root.props.style);
        expect(flat.width).toBe(34);
        expect(flat.height).toBe(34);
        expect(flat.borderRadius).toBe(17);
    });

    it('computes correct diameter from a custom size', () => {
        const { root } = render(<CircleIconButton {...baseProps} size={30} />);
        const flat = StyleSheet.flatten(root.props.style);
        expect(flat.width).toBe(44);
        expect(flat.height).toBe(44);
        expect(flat.borderRadius).toBe(22);
    });

    it('applies custom backgroundColor', () => {
        const { root } = render(
            <CircleIconButton {...baseProps} backgroundColor="#ff0000" />,
        );
        const flat = StyleSheet.flatten(root.props.style);
        expect(flat.backgroundColor).toBe('#ff0000');
    });

    it('applies default backgroundColor', () => {
        const { root } = render(<CircleIconButton {...baseProps} />);
        const flat = StyleSheet.flatten(root.props.style);
        expect(flat.backgroundColor).toBe('rgba(128,0,32,0.10)');
    });

    it('merges custom style prop', () => {
        const { root } = render(
            <CircleIconButton {...baseProps} style={{ marginTop: 10 }} />,
        );
        const flat = StyleSheet.flatten(root.props.style);
        expect(flat.marginTop).toBe(10);
    });

    it('forwards hitSlop to Pressable', () => {
        const { root } = render(
            <CircleIconButton {...baseProps} hitSlop={16} />,
        );
        expect(root.props.hitSlop).toBe(16);
    });

    it('uses default hitSlop of 8', () => {
        const { root } = render(<CircleIconButton {...baseProps} />);
        expect(root.props.hitSlop).toBe(8);
    });
});
