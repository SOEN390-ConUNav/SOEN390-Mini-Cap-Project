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
        assertEquals(BuildingLocation.SC, BuildingLocation.fromId("SC"));
        assertEquals(BuildingLocation.AD, BuildingLocation.fromId("AD"));
        assertEquals(BuildingLocation.SP, BuildingLocation.fromId("SP"));
        assertEquals(BuildingLocation.HU, BuildingLocation.fromId("HU"));
        assertEquals(BuildingLocation.HB, BuildingLocation.fromId("HB"));
    }

    @Test
    void fromId_returnsCorrectEnumForPrefixes() {
        assertEquals(BuildingLocation.H, BuildingLocation.fromId("Hall-8"));
        assertEquals(BuildingLocation.LB, BuildingLocation.fromId("LB-204"));
        assertEquals(BuildingLocation.VL, BuildingLocation.fromId("VL-101"));
        assertEquals(BuildingLocation.SC, BuildingLocation.fromId("SC-123"));
        assertEquals(BuildingLocation.AD, BuildingLocation.fromId("AD-101"));
        assertEquals(BuildingLocation.SP, BuildingLocation.fromId("SP-101"));
        assertEquals(BuildingLocation.HU, BuildingLocation.fromId("HU-201"));
        assertEquals(BuildingLocation.HB, BuildingLocation.fromId("HB-131"));
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
        assertEquals("45.458899,-73.639073", BuildingLocation.VE.getDirectionsTarget());
        assertEquals("45.458899,-73.639073", BuildingLocation.SC.getDirectionsTarget());
        assertEquals("45.45793,-73.63957", BuildingLocation.AD.getDirectionsTarget());
        assertEquals("45.45793,-73.63957", BuildingLocation.CC.getDirectionsTarget());
        assertEquals("45.45778,-73.64104", BuildingLocation.SP.getDirectionsTarget());
        assertEquals("45.45839,-73.64151", BuildingLocation.HU.getDirectionsTarget());
        assertEquals("Hingston Hall B, Montreal, Quebec H4B, Canada", BuildingLocation.HB.getDirectionsTarget());
    }
}
