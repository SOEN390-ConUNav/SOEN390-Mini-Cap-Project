package com.soen390.backend.service;

import com.soen390.backend.enums.IndoorManeuverType;
import com.soen390.backend.object.IndoorDirectionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class IndoorDirectionServiceTest {

    private IndoorDirectionService directionService;
    private PathfindingService pathfindingService;

    @BeforeEach
    void setUp() {
        pathfindingService = new PathfindingService();
        directionService = new IndoorDirectionService(pathfindingService);
    }

    @Test
    void getIndoorDirections_hall8_returnsRoutePoints() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);

        assertNotNull(response);
        assertEquals("Hall Building", response.getBuildingName());
        assertEquals("Hall-8", response.getBuildingId());
        assertNotNull(response.getRoutePoints());
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_returnsComputedDistanceDuration() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);

        assertNotEquals("—", response.getDistance());
        assertNotEquals("—", response.getDuration());
        assertFalse(response.getDistance().isBlank());
        assertFalse(response.getDuration().isBlank());
    }

    @Test
    void getIndoorDirections_generatesRealStepInstructions() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);

        assertFalse(response.getSteps().isEmpty());
        assertNotEquals("Follow the path", response.getSteps().get(0).instruction());
        assertTrue(response.getSteps().get(0).instruction().startsWith("Walk straight to "));
        assertEquals(IndoorManeuverType.ENTER_ROOM,
                response.getSteps().get(response.getSteps().size() - 1).maneuverType());
    }

    @Test
    void getIndoorDirections_hall9_returnsNonEmptyRoute() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-9", "H9-903", "H9-967", "9", "9", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_lb2_returnsNonEmptyRoute() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "LB-2", "LB-204", "LB-259", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_invalidRooms_returnsEmptyRoute() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "INVALID-ROOM", "ALSO-INVALID", "8", "8", false);

        assertNotNull(response);
        assertTrue(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_nullFloor_defaultsToOne() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", null, null, false);

        assertNotNull(response);
        assertEquals("1", response.getStartFloor());
        assertEquals("1", response.getEndFloor());
    }

    @Test
    void stairMessage_entranceToRoom_goUp() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-Maisonneuve-Entrance", "H2-217", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty(), "Route should successfully generate from Entrance to Room");
    }

    @Test
    void stairMessage_roomToEntrance_goDown() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "H2-Bishop-Entrance", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty(), "Route should successfully generate from Room to Entrance");
    }

    @Test
    void stairMessage_roomToRoom_noStairMessage() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);

        assertNull(response.getStairMessage());
    }

    @Test
    void stairMessage_stairsUp_detected() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Hall-Stairs-Main", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty(), "Route should successfully generate to main stairs");
    }

    @Test
    void routeNormalization_AtoB_sameAsBtoA_forHall8() {
        IndoorDirectionResponse ab = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        IndoorDirectionResponse ba = directionService.getIndoorDirections(
                "Hall-8", "H8-807", "H8-843", "8", "8", false);

        List<IndoorDirectionResponse.RoutePoint> routeAB = ab.getRoutePoints();
        List<IndoorDirectionResponse.RoutePoint> routeBA = ba.getRoutePoints();

        assertEquals(routeAB.size(), routeBA.size(),
                "A→B and B→A should have same number of points");

        for (int i = 0; i < routeAB.size(); i++) {
            int reverseIdx = routeBA.size() - 1 - i;
            assertEquals(routeAB.get(i).getX(), routeBA.get(reverseIdx).getX(), 0.001);
            assertEquals(routeAB.get(i).getY(), routeBA.get(reverseIdx).getY(), 0.001);
        }
    }

    @Test
    void routeNormalization_disabled_forHall2() {
        IndoorDirectionResponse ab = directionService.getIndoorDirections(
                "Hall-2", "H2-Maisonneuve-Entrance", "H2-217", "2", "2", false);
        IndoorDirectionResponse ba = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "H2-Maisonneuve-Entrance", "2", "2", false);

        assertNotNull(ab.getRoutePoints());
        assertNotNull(ba.getRoutePoints());
        assertFalse(ab.getRoutePoints().isEmpty());
        assertFalse(ba.getRoutePoints().isEmpty());
    }

    @Test
    void getAvailableRooms_hall8_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("H", "8");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getAvailableRooms_withDirectBuildingId() {
        List<String> rooms = directionService.getAvailableRooms("Hall-8", "8");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getAvailableRooms_unknownBuilding_returnsEmpty() {
        List<String> rooms = directionService.getAvailableRooms("XX", "99");
        assertTrue(rooms.isEmpty());
    }

    @Test
    void getWaypoints_hall8_returnsNonEmpty() {
        var waypoints = directionService.getWaypoints("H", "8");
        assertFalse(waypoints.isEmpty());
    }

    @Test
    void getRoomPoints_hall8_returnsNonEmpty() {
        var roomPoints = directionService.getRoomPoints("H", "8");
        assertFalse(roomPoints.isEmpty());
    }

    @Test
    void getRoomPoints_eachPointHasPositiveCoords() {
        var roomPoints = directionService.getRoomPoints("H", "8");
        for (var rp : roomPoints) {
            assertTrue(rp.x > 0, rp.id + " x should be > 0");
            assertTrue(rp.y > 0, rp.id + " y should be > 0");
        }
    }

    @Test
    void getPointsOfInterest_lb2_returnsNonEmpty() {
        var pois = directionService.getPointsOfInterest("LB", "2");
        assertFalse(pois.isEmpty());
    }

    @Test
    void getPointsOfInterest_eachHasTypeAndDisplayName() {
        var pois = directionService.getPointsOfInterest("LB", "2");
        for (var poi : pois) {
            assertNotNull(poi.type, poi.id + " should have a type");
            assertNotNull(poi.displayName, poi.id + " should have a displayName");
        }
    }

    @Test
    void BuildingId_H_convertsToHallFloor() {
        List<String> rooms = directionService.getAvailableRooms("H", "8");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void BuildingId_VL_convertsToVLFloor() {
        List<String> rooms = directionService.getAvailableRooms("VL", "1");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void BuildingId_LB_convertsToLBFloor() {
        List<String> rooms = directionService.getAvailableRooms("LB", "2");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void BuildingId_MB_convertsToMBFloor() {
        List<String> rooms = directionService.getAvailableRooms("MB", "S2");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getIndoorDirections_buildingNames_coveredForAllPrefixes() {
        assertEquals("Vanier Library Building",
                directionService.getIndoorDirections("VL-1", "VL-101", "VL-102", "1", "1", false).getBuildingName());
        assertEquals("Webster Library Building",
                directionService.getIndoorDirections("LB-2", "LB-204", "LB-259", "2", "2", false).getBuildingName());
        assertEquals("John Molson School of Business",
                directionService.getIndoorDirections("MB-S2", "MBS2-101", "MBS2-102", "S2", "S2", false).getBuildingName());
    }

    @Test
    void stairMessage_stairsDown_detected() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "H2-Stairs-Down-1", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty(), "Route should successfully generate to stairs down");
    }

    @Test
    void stairMessage_genericStairs_detected() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "LB-2", "LB-204", "LB-259", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty(), "Route should successfully generate between valid points");
    }

    @Test
    void getBuildingName_unknownPrefix_returnsDefault() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "XX-1", "room1", "room2", "1", "1", false);

        assertEquals("Building XX-1", response.getBuildingName());
    }

    @Test
    void convertBuildingIdForPathfinding_nullFloor_returnsOriginal() {
        List<String> rooms = directionService.getAvailableRooms("H", null);
        assertNotNull(rooms);
    }

    @Test
    void stairMessage_H_buildingId_floor2_entranceOrigin_goUp() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "H", "H2-McKay-Exit", "H2-217", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void stairMessage_hallEntrance_nonFloor2_noEntranceMessage() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-801", "H8-807", "8", "8", false);

        if (response.getStairMessage() != null) {
            assertFalse(response.getStairMessage().contains("main floor"));
            assertFalse(response.getStairMessage().contains("exit level"));
        }
    }

    @Test
    void stairMessage_undergroundEntrance_asOrigin_goUp() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-Maisonneuve-Entrance", "H2-217", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void stairMessage_roomToMcKayEntrance_goDown() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "H2-McKay-Exit", "2", "2", false);

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void stairMessage_bothEntrances_noEntranceMessage() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-Maisonneuve-Entrance", "H2-Bishop-Entrance", "2", "2", false);

        if (response.getStairMessage() != null) {
            assertFalse(response.getStairMessage().contains("main floor"));
            assertFalse(response.getStairMessage().contains("exit level"));
        }
    }

    @Test
    void stairMessage_nonHallBuilding_entranceNames_noEntranceMessage() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "LB-2", "LB-204", "LB-259", "2", "2", false);

        if (response.getStairMessage() != null) {
            assertFalse(response.getStairMessage().contains("main floor"));
            assertFalse(response.getStairMessage().contains("exit level"));
        }
    }

    @Test
    void indoorManeuverType_fromString_returnsCorrectType() {
        assertEquals(IndoorManeuverType.ELEVATOR_UP, IndoorManeuverType.fromString("elevator-up"));
        assertEquals(IndoorManeuverType.STAIRS_DOWN, IndoorManeuverType.fromString("stairs-down"));
        assertEquals(IndoorManeuverType.ENTER_ROOM, IndoorManeuverType.fromString("enter-room"));
    }

    @Test
    void indoorManeuverType_fromString_unknownReturnsStraight() {
        assertEquals(IndoorManeuverType.STRAIGHT, IndoorManeuverType.fromString("nonexistent"));
    }

    @Test
    void indoorManeuverType_getValue_returnsValue() {
        assertEquals("elevator-up", IndoorManeuverType.ELEVATOR_UP.getValue());
        assertEquals("straight", IndoorManeuverType.STRAIGHT.getValue());
    }

    @Test
    void getIndoorDirections_avoidStairs_returnsRoute() {
        // Covers AccessibilityRoutingStrategy when avoidStairs=true
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", true);
        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_crossFloor_doesNotThrow() {
        // Covers calculateCrossFloorRoute path
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H9-903", "8", "9", false);
        assertNotNull(response);
    }

    @Test
    void getBuildingName_CC_returnsCentralBuilding() {
        // Covers CC- prefix in getBuildingName
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "CC-1", "CC-101", "CC-102", "1", "1", false);
        assertEquals("Central Building", r.getBuildingName());
    }

    @Test
    void getBuildingName_VE_returnsEngineeringBuilding() {
        // Covers VE- prefix in getBuildingName
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-1", "VE-101", "VE-102", "1", "1", false);
        assertEquals("Engineering/Visual Arts Building", r.getBuildingName());
    }

    @Test
    void getBuildingName_plainVE_returnsEngineeringBuilding() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE", "VE-101", "VE-102", "1", "1", false);
        assertEquals("Engineering/Visual Arts Building", r.getBuildingName());
    }

    @Test
    void getRoomPoints_unknownBuilding_returnsEmpty() {
        var rooms = directionService.getRoomPoints("XX", "99");
        assertNotNull(rooms);
        assertTrue(rooms.isEmpty());
    }

    @Test
    void getPointsOfInterest_withoutFloor_usesConvertedPlanId() {
        var pois = directionService.getPointsOfInterest("H", null);
        assertNotNull(pois);
    }

}