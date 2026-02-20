import React from 'react';
import { View } from 'react-native';

const Animated = {
    View: ({ children, style }: { children?: React.ReactNode; style?: any }) =>
        React.createElement(View, { style }, children),
};

export default Animated;
export const useSharedValue = (init: number) => ({ value: init });
export const useAnimatedStyle = (fn: () => object) => fn();
export const withTiming = (val: number) => val;
export const withSpring = (val: number) => val;
export const interpolate = (_val: number, _input: number[], output: number[]) => output[0];
export const runOnJS = (fn: (...args: any[]) => void) => fn;
export const Easing = {
    inOut: (_fn: unknown) => _fn,
    ease: (t: number) => t,
    in: (_fn: unknown) => _fn,
    out: (_fn: unknown) => _fn,
    linear: (t: number) => t,
    quad: (t: number) => t,
    cubic: (t: number) => t,
};