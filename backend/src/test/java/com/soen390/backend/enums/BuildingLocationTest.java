package com.soen390.backend.enums;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BuildingLocationTest {

    @Test
    void fromId_returnsCorrectEnumForExactMatches() {
        assertEquals(BuildingLocation.H, BuildingLocation.fromId("H"));
        assertEquals(BuildingLocation.MB, BuildingLocation.fromId("MB"));
        assertEquals(BuildingLocation.LB, BuildingLocation.fromId("LB"));
        assertEquals(BuildingLocation.VL, BuildingLocation.fromId("VL"));
    }

    @Test
    void fromId_returnsCorrectEnumForPrefixes() {
        assertEquals(BuildingLocation.H, BuildingLocation.fromId("Hall-8"));
        assertEquals(BuildingLocation.LB, BuildingLocation.fromId("LB-204"));
        assertEquals(BuildingLocation.VL, BuildingLocation.fromId("VL-101"));
    }

    @Test
    void fromId_handlesNullAndUnknownIds() {
        assertEquals(BuildingLocation.H, BuildingLocation.fromId(null), "Null should default to H");
        assertEquals(BuildingLocation.H, BuildingLocation.fromId("UNKNOWN-123"), "Unknown IDs should default to H");
    }

    @Test
    void enumValues_containCorrectCampusAndAddress() {
        assertEquals("SGW", BuildingLocation.H.campus);
        assertEquals("LOY", BuildingLocation.VL.campus);
        assertNotNull(BuildingLocation.H.address);
        assertNotNull(BuildingLocation.VL.address);
    }
}