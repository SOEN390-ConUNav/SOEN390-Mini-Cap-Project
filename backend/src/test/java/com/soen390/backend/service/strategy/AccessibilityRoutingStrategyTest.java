package com.soen390.backend.service.strategy;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AccessibilityRoutingStrategyTest {

    @Test
    void stairsAllowedStrategy_allowsStairs() {
        AccessibilityRoutingStrategy strategy = StairsAllowedStrategy.INSTANCE;
        assertTrue(strategy.allowsStairs());
        assertTrue(strategy.preferStairsForConnectors());
    }

    @Test
    void stairsAvoidedStrategy_doesNotAllowStairs() {
        AccessibilityRoutingStrategy strategy = StairsAvoidedStrategy.INSTANCE;
        assertFalse(strategy.allowsStairs());
        assertFalse(strategy.preferStairsForConnectors());
    }

    @Test
    void fromAvoidStairs_false_returnsStairsAllowed() {
        AccessibilityRoutingStrategy strategy = AccessibilityRoutingStrategy.fromAvoidStairs(false);
        assertTrue(strategy.allowsStairs());
    }

    @Test
    void fromAvoidStairs_true_returnsStairsAvoided() {
        AccessibilityRoutingStrategy strategy = AccessibilityRoutingStrategy.fromAvoidStairs(true);
        assertFalse(strategy.allowsStairs());
    }

    @Test
    void fromAvoidStairs_result_preferStairsForConnectors_matchesAllowsStairs() {
        assertTrue(AccessibilityRoutingStrategy.fromAvoidStairs(false).preferStairsForConnectors());
        assertFalse(AccessibilityRoutingStrategy.fromAvoidStairs(true).preferStairsForConnectors());
    }
}
