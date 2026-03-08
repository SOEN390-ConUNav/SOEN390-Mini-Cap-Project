package com.soen390.backend.service.strategy;

public enum StairsAvoidedStrategy implements AccessibilityRoutingStrategy {
    INSTANCE;

    @Override
    public boolean allowsStairs() {
        return false;
    }

    @Override
    public boolean preferStairsForConnectors() {
        return false;
    }
}
