package com.soen390.backend.service.strategy;

public final class StairsAllowedStrategy implements AccessibilityRoutingStrategy {

    public static final StairsAllowedStrategy INSTANCE = new StairsAllowedStrategy();

    private StairsAllowedStrategy() {
    }

    public static StairsAllowedStrategy getInstance() {
        return INSTANCE;
    }

    @Override
    public boolean allowsStairs() {
        return true;
    }

    @Override
    public boolean preferStairsForConnectors() {
        return true;
    }
}
