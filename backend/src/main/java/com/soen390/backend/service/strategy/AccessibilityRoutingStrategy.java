package com.soen390.backend.service.strategy;

public interface AccessibilityRoutingStrategy {

    boolean allowsStairs();

    default boolean preferStairsForConnectors() {
        return allowsStairs();
    }

    static AccessibilityRoutingStrategy fromAvoidStairs(boolean avoidStairs) {
        return avoidStairs ? StairsAvoidedStrategy.INSTANCE : StairsAllowedStrategy.INSTANCE;
    }
}
