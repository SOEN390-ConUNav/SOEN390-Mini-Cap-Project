package com.soen390.backend.service.strategy;

public enum StairsAllowedStrategy implements AccessibilityRoutingStrategy {
    INSTANCE;

    @Override
    public boolean allowsStairs() {
        return true;
    }

    @Override
    public boolean preferStairsForConnectors() {
        return true;
    }
}
