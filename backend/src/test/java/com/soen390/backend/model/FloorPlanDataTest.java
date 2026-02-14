package com.soen390.backend.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class FloorPlanDataTest {



    @ParameterizedTest
    @CsvSource({
        "Hall-8,  8",
        "Hall-9,  9",
        "Hall-1,  1",
        "Hall-2,  2",
        "VL-1,    1",
        "VL-2,    2",
        "LB-2,    2",
        "LB-3,    3",
        "LB-4,    4",
        "LB-5,    5",
        "MB-S2,   S2"
    })
    void constructor_loadsRoomsForEveryFloor(String buildingId, String floor) {
        FloorPlanData data = new FloorPlanData(buildingId, floor);
        assertFalse(data.getRoomPoints().isEmpty(),
                buildingId + "/" + floor + " should have room data");
    }

    @Test
    void constructor_unknownBuildingReturnsEmptyRooms() {
        FloorPlanData data = new FloorPlanData("Unknown-99", "1");
        assertTrue(data.getRoomPoints().isEmpty());
    }

    @Test
    void constructor_wrongFloorForBuildingReturnsEmptyRooms() {
        FloorPlanData data = new FloorPlanData("Hall-8", "9");
        assertTrue(data.getRoomPoints().isEmpty());
    }

    @Test
    void getters_returnCorrectMetadata() {
        FloorPlanData data = new FloorPlanData("Hall-8", "8");
        assertEquals("Hall-8", data.getBuildingId());
        assertEquals("8", data.getFloor());
    }

  

    @Test
    void buildRoomEntranceGroups_groupsMultiEntranceRoom() {
        FloorPlanData data = new FloorPlanData("LB-2", "2");
        Map<String, List<String>> groups = data.getRoomEntranceGroups();

        assertTrue(groups.containsKey("LB-261"),
                "LB-261 should be a grouped base room");
        List<String> entrances = groups.get("LB-261");
        assertTrue(entrances.contains("LB-261-1"));
        assertTrue(entrances.contains("LB-261-2"));
    }

    @Test
    void getBaseRoomId_returnsGroupNameForEntrance() {
        FloorPlanData data = new FloorPlanData("LB-2", "2");
        assertEquals("LB-261", data.getBaseRoomId("LB-261-1"));
        assertEquals("LB-261", data.getBaseRoomId("LB-261-2"));
    }

    @Test
    void getBaseRoomId_returnsSameIdWhenNotGrouped() {
        FloorPlanData data = new FloorPlanData("LB-2", "2");
        assertEquals("LB-204", data.getBaseRoomId("LB-204"));
    }

    @Test
    void getBaseRoomIds_returnsUniqueBaseNames() {
        FloorPlanData data = new FloorPlanData("LB-2", "2");
        var ids = data.getBaseRoomIds();
        assertTrue(ids.contains("LB-261"));
        assertFalse(ids.contains("LB-261-1"));
        assertFalse(ids.contains("LB-261-2"));
    }



    @Test
    void resolveToClosestEntrance_choosesNearerDoor() {
        FloorPlanData data = new FloorPlanData("LB-2", "2");
        FloorPlanData.Point room1 = data.getRoomPoints().get("LB-261-1");
        FloorPlanData.Point room2 = data.getRoomPoints().get("LB-261-2");

        String closest = data.resolveToClosestEntrance("LB-261",
                room2.getX(), room2.getY());
        assertEquals("LB-261-2", closest);

        
        closest = data.resolveToClosestEntrance("LB-261",
                room1.getX(), room1.getY());
        assertEquals("LB-261-1", closest);
    }

    @Test
    void resolveToClosestEntrance_returnsOriginalWhenNoGroup() {
        FloorPlanData data = new FloorPlanData("LB-2", "2");
        String result = data.resolveToClosestEntrance("LB-204", 0, 0);
        assertEquals("LB-204", result);
    }

    @Test
    void resolveToClosestEntrance_returnsOriginalForUnknownRoom() {
        FloorPlanData data = new FloorPlanData("LB-2", "2");
        String result = data.resolveToClosestEntrance("DOES-NOT-EXIST", 0, 0);
        assertEquals("DOES-NOT-EXIST", result);
    }


    @Test
    void getPointsOfInterest_detectsBathroomsAndElevators() {
        FloorPlanData data = new FloorPlanData("LB-2", "2");
        var pois = data.getPointsOfInterest();

        boolean hasBathroom = pois.stream().anyMatch(p -> p.type.contains("bathroom"));
        boolean hasElevator = pois.stream().anyMatch(p -> p.type.equals("elevator"));

        assertTrue(hasBathroom, "LB-2 should contain bathroom POIs");
        assertTrue(hasElevator, "LB-2 should contain elevator POIs");
    }

    @Test
    void getPointsOfInterest_doesNotIncludeRegularRooms() {
        FloorPlanData data = new FloorPlanData("Hall-8", "8");
        var pois = data.getPointsOfInterest();

        boolean containsRegularRoom = pois.stream()
                .anyMatch(p -> p.id.equals("H8-843"));
        assertFalse(containsRegularRoom,
                "Regular rooms should not appear in POI list");
    }

    @Test
    void getPointsOfInterest_returnsEmptyForEmptyFloor() {
        FloorPlanData data = new FloorPlanData("Unknown-99", "1");
        assertTrue(data.getPointsOfInterest().isEmpty());
    }

  

    @Test
    void point_distanceTo_calculatesCorrectly() {
        FloorPlanData.Point a = new FloorPlanData.Point(0, 0);
        FloorPlanData.Point b = new FloorPlanData.Point(3, 4);
        assertEquals(5.0, a.distanceTo(b), 0.0001);
    }

    @Test
    void point_distanceTo_samePointIsZero() {
        FloorPlanData.Point a = new FloorPlanData.Point(42, 42);
        assertEquals(0.0, a.distanceTo(a), 0.0001);
    }

}
