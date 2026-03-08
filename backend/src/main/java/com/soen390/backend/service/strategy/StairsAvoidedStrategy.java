package com.soen390.backend.service.strategy;

public final class StairsAvoidedStrategy implements AccessibilityRoutingStrategy {

    public static final StairsAvoidedStrategy INSTANCE = new StairsAvoidedStrategy();

    private StairsAvoidedStrategy() {
    }

    public static StairsAvoidedStrategy getInstance() {
        return INSTANCE;
    }

    @Override
    public boolean allowsStairs() {
        return false;
    }

    @Override
    public boolean preferStairsForConnectors() {
        return false;
    }
}
