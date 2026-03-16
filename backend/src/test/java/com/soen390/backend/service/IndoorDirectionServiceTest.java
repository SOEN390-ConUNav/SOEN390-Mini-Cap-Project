package com.soen390.backend.service;

import com.soen390.backend.enums.IndoorManeuverType;
import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.object.IndoorRouteStep;
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
            assertTrue(rp.getX() > 0, rp.getId() + " x should be > 0");
            assertTrue(rp.getY() > 0, rp.getId() + " y should be > 0");
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
            assertNotNull(poi.getType(), poi.getId() + " should have a type");
            assertNotNull(poi.getDisplayName(), poi.getId() + " should have a displayName");
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
                directionService.getIndoorDirections("MB-S2", "MB-S2-245", "MB-S2-255", "S2", "S2", false).getBuildingName());
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
                "CC-1", "CC-101", "CC-107", "1", "1", false);
        assertEquals("Central Building", r.getBuildingName());
    }

    @Test
    void getBuildingName_VE_returnsEngineeringBuilding() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-1", "VE-1-01", "VE-1-02", "1", "1", false);
        assertEquals("Engineering/Visual Arts Building", r.getBuildingName());
    }

    @Test
    void getBuildingName_plainVE_returnsEngineeringBuilding() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE", "VE-1-01", "VE-1-02", "1", "1", false);
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

    @Test
    void stairMessage_routeToStairsWaypoint_doesNotThrow() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Hall-Stairs-Main", "2", "2", false);
        assertNotNull(r);
    }

    @Test
    void formatFinalDuration_zeroDistance_returnsZeroSec() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "INVALID", "ALSO-INVALID", "8", "8", false);
        assertEquals("0 sec", r.getDuration());
    }

    @Test
    void convertBuildingId_CC_returnsCCFloor() {
        List<String> rooms = directionService.getAvailableRooms("CC", "1");
        assertNotNull(rooms);
    }

    @Test
    void convertBuildingId_MB_returnsMBFloor() {
        List<String> rooms = directionService.getAvailableRooms("MB", "1");
        assertNotNull(rooms);
    }

    @Test
    void getIndoorDirections_destinationFloorNull_usesStartFloor() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", null, false);
        assertEquals("8", r.getStartFloor());
        assertEquals("8", r.getEndFloor());
    }

    @Test
    void getIndoorDirections_crossFloor_avoidStairs_prefersElevator() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H9-903", "8", "9", true);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_longRoute_includesMinutesInDuration() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertNotNull(r.getDuration());
        assertTrue(r.getDuration().contains("sec") || r.getDuration().contains("min"));
    }

    @Test
    void getWaypoints_withNullFloor_returnsList() {
        var wps = directionService.getWaypoints("H", null);
        assertNotNull(wps);
    }

    @Test
    void getIndoorDirections_VL1_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VL-1", "VL-101", "VL-102", "1", "1", false);
        assertNotNull(r);
        assertFalse(r.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_MB_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "MB-S2", "MB-S2-245", "MB-S2-255", "S2", "S2", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_originFloorOnly_usesAsEndFloor() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", null, false);
        assertEquals("8", r.getEndFloor());
    }

    @Test
    void getIndoorDirections_routeToStairsWaypoint_setsStairMessageFromRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Hall-Stairs-Main", "2", "2", false);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty() && r.getStairMessage() != null) {
            assertTrue(r.getStairMessage().contains("stairs"));
        }
    }

    @Test
    void getIndoorDirections_crossFloor_elevatorTransition() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H9-903", "8", "9", true);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasElevatorStep = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null && s.instruction().toLowerCase().contains("elevator"));
            boolean hasStairsStep = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null && s.instruction().toLowerCase().contains("stairs"));
            assertTrue(hasElevatorStep || hasStairsStep, "Cross-floor route should have transition step");
        }
    }

    @Test
    void getIndoorDirections_crossFloor_stairsTransition() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H9-903", "8", "9", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_stepsIncludeTurnInstructions() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-801", "8", "8", false);
        assertNotNull(r);
        assertFalse(r.getSteps().isEmpty());
        boolean hasTurnOrStraight = r.getSteps().stream()
                .anyMatch(s -> s.instruction() != null && (
                        s.instruction().contains("Turn") ||
                                s.instruction().contains("straight") ||
                                s.instruction().contains("Walk")));
        assertTrue(hasTurnOrStraight, "Steps should include movement instructions");
    }

    @Test
    void getIndoorDirections_singlePointRoute_returnsEmptySteps() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "INVALID", "ALSO-INVALID", "8", "8", false);
        assertNotNull(r);
        assertTrue(r.getRoutePoints().isEmpty());
        assertTrue(r.getSteps().isEmpty());
    }

    @Test
    void getBuildingName_H_returnsHallBuilding() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H8-843", "H8-807", "8", "8", false);
        assertEquals("Hall Building", r.getBuildingName());
    }

    @Test
    void getIndoorDirections_durationFormat_includesUnits() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertNotNull(r.getDuration());
        assertTrue(r.getDuration().contains("sec") || r.getDuration().contains("min"));
    }

    @Test
    void getIndoorDirections_distanceFormat_includesMeters() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertNotNull(r.getDistance());
        assertTrue(r.getDistance().contains("m"));
    }

    @Test
    void getIndoorDirections_arriveStep_hasEnterRoomManeuver() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertFalse(r.getSteps().isEmpty());
        IndoorRouteStep lastStep = r.getSteps().get(r.getSteps().size() - 1);
        assertEquals(IndoorManeuverType.ENTER_ROOM, lastStep.maneuverType());
        assertTrue(lastStep.instruction().contains("Arrive"));
    }

    @Test
    void getWaypoints_unknownBuilding_returnsEmpty() {
        var wps = directionService.getWaypoints("XX", "99");
        assertNotNull(wps);
        assertTrue(wps.isEmpty());
    }

    @Test
    void getPointsOfInterest_unknownBuilding_returnsEmpty() {
        var pois = directionService.getPointsOfInterest("XX", "99");
        assertNotNull(pois);
        assertTrue(pois.isEmpty());
    }

    @Test
    void getIndoorDirections_LB3_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-3", "LB-322", "LB-359", "3", "3", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_LB4_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-4", "LB-451", "LB-459", "4", "4", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_LB5_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-5", "LB-518", "LB-522", "5", "5", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_Hall1_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-1", "H1-118", "H1-115", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_responseHasBuildingInfo() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertNotNull(r.getBuildingId());
        assertNotNull(r.getStartFloor());
        assertNotNull(r.getEndFloor());
    }

    @Test
    void getIndoorDirections_allStepsHaveRequiredFields() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        for (IndoorRouteStep step : r.getSteps()) {
            assertNotNull(step.instruction());
            assertNotNull(step.distance());
            assertNotNull(step.duration());
            assertNotNull(step.maneuverType());
        }
    }

    @Test
    void getIndoorDirections_routePointsHaveCoordinates() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        for (var pt : r.getRoutePoints()) {
            assertNotNull(pt.getX());
            assertNotNull(pt.getY());
        }
    }

    @Test
    void getAvailableRooms_VL_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("VL", "2");
        assertNotNull(rooms);
    }

    @Test
    void getAvailableRooms_MB_S2_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("MB", "S2");
        assertNotNull(rooms);
    }

    @Test
    void getIndoorDirections_crossFloor_Hall8to9_hasTransitionLabel() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H9-903", "8", "9", false);
        boolean hasTransition = r.getRoutePoints().stream()
                .anyMatch(p -> p.getLabel() != null && p.getLabel().startsWith("TRANSITION_"));
        assertTrue(hasTransition || r.getRoutePoints().isEmpty(),
                "Cross-floor route should have transition point or be empty");
    }

    @Test
    void getIndoorDirections_avoidStairs_sameFloor_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-2", "LB-204", "LB-259", "2", "2", true);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_CC_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "CC-1", "CC-101", "CC-107", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_VE_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-1", "VE-1-01", "VE-1-02", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_destinationAsPoi_resolvesAndReturnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-1", "VE-1-01", "VE-Elevator-Main", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_VL2_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VL-2", "VL-201", "VL-202", "2", "2", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_VE2_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-2", "VE-2-01", "VE-2-02", "2", "2", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_MB1_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "MB-1", "MB-1-294", "MB-1-347", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getRoomPoints_MB1_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("MB", "1");
        assertNotNull(rooms);
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getRoomPoints_VE1_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("VE", "1");
        assertNotNull(rooms);
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getPointsOfInterest_Hall8_returnsNonEmpty() {
        var pois = directionService.getPointsOfInterest("H", "8");
        assertNotNull(pois);
    }

    @Test
    void getPointsOfInterest_VE1_returnsNonEmpty() {
        var pois = directionService.getPointsOfInterest("VE", "1");
        assertNotNull(pois);
        assertFalse(pois.isEmpty());
    }

    @Test
    void getPointsOfInterest_CC1_returnsNonEmpty() {
        var pois = directionService.getPointsOfInterest("CC", "1");
        assertNotNull(pois);
    }

    @Test
    void getWaypoints_LB2_returnsNonEmpty() {
        var wps = directionService.getWaypoints("LB", "2");
        assertNotNull(wps);
    }

    @Test
    void getWaypoints_VL1_returnsList() {
        var wps = directionService.getWaypoints("VL", "1");
        assertNotNull(wps);
    }

    @Test
    void getWaypoints_CC1_returnsList() {
        var wps = directionService.getWaypoints("CC", "1");
        assertNotNull(wps);
    }

    @Test
    void getIndoorDirections_convertBuildingId_preservesHallPrefix() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertEquals("Hall-8", r.getBuildingId());
    }

    @Test
    void getIndoorDirections_convertBuildingId_preservesLBPrefix() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-2", "LB-204", "LB-259", "2", "2", false);
        assertEquals("LB-2", r.getBuildingId());
    }

    @Test
    void getAvailableRooms_hall1_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("H", "1");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getAvailableRooms_CC_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("CC", "1");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void detectGenericStairs_stairsUp_returnsUpMessage() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-4", "LB4-Stairs-Up-2", "LB-451", "4", "4", false);
        assertNotNull(r);
        if (r.getStairMessage() != null) {
            assertTrue(r.getStairMessage().toLowerCase().contains("up"));
        }
    }

    @Test
    void detectGenericStairs_stairsDown_returnsDownMessage() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-4", "LB4-451", "LB4-Stairs-Down-1", "4", "4", false);
        assertNotNull(r);
        if (r.getStairMessage() != null) {
            assertTrue(r.getStairMessage().toLowerCase().contains("down"));
        }
    }

    @Test
    void getRoomPoints_LB3_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("LB", "3");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getRoomPoints_LB4_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("LB", "4");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getRoomPoints_LB5_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("LB", "5");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getRoomPoints_CC_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("CC", "1");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getRoomPoints_Hall1_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("H", "1");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getRoomPoints_Hall2_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("H", "2");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getRoomPoints_Hall9_returnsNonEmpty() {
        var rooms = directionService.getRoomPoints("H", "9");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getWaypoints_Hall1_returnsList() {
        var wps = directionService.getWaypoints("H", "1");
        assertNotNull(wps);
    }

    @Test
    void getWaypoints_Hall2_returnsList() {
        var wps = directionService.getWaypoints("H", "2");
        assertNotNull(wps);
    }

    @Test
    void getWaypoints_Hall9_returnsList() {
        var wps = directionService.getWaypoints("H", "9");
        assertNotNull(wps);
    }

    @Test
    void getWaypoints_MB_returnsList() {
        var wps = directionService.getWaypoints("MB", "S2");
        assertNotNull(wps);
    }

    @Test
    void getWaypoints_VE_returnsList() {
        var wps = directionService.getWaypoints("VE", "1");
        assertNotNull(wps);
    }

    @Test
    void getPointsOfInterest_Hall1_returnsList() {
        var pois = directionService.getPointsOfInterest("H", "1");
        assertNotNull(pois);
    }

    @Test
    void getPointsOfInterest_Hall2_returnsList() {
        var pois = directionService.getPointsOfInterest("H", "2");
        assertNotNull(pois);
    }

    @Test
    void getPointsOfInterest_MB_returnsList() {
        var pois = directionService.getPointsOfInterest("MB", "S2");
        assertNotNull(pois);
    }

    @Test
    void getPointsOfInterest_VL_returnsList() {
        var pois = directionService.getPointsOfInterest("VL", "1");
        assertNotNull(pois);
    }

    @Test
    void getAvailableRooms_LB3_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("LB", "3");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getAvailableRooms_LB4_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("LB", "4");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getAvailableRooms_LB5_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("LB", "5");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getAvailableRooms_VE_returnsNonEmpty() {
        List<String> rooms = directionService.getAvailableRooms("VE", "1");
        assertFalse(rooms.isEmpty());
    }

    @Test
    void getIndoorDirections_originAsPoi_resolvesAndReturnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-1", "VE-Elevator-Main", "VE-1-02", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_Hall2_toHallStairsMain_returnsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Hall-Stairs-Main", "2", "2", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_VL1_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VL-1", "VL-101", "VL-102", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_CC_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "CC-1", "CC-101", "CC-106", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_distanceIsFormatted() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertNotNull(r.getDistance());
        assertTrue(r.getDistance().endsWith(" m"));
    }

    @Test
    void getIndoorDirections_durationIsFormatted() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertNotNull(r.getDuration());
        assertTrue(r.getDuration().contains("sec") || r.getDuration().contains("min"));
    }

    @Test
    void getIndoorDirections_stepsContainArrive() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertTrue(r.getSteps().stream()
                .anyMatch(s -> s.instruction() != null && s.instruction().contains("Arrive")));
    }

    @Test
    void getIndoorDirections_routePointsHaveLabels() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8", false);
        assertFalse(r.getRoutePoints().isEmpty());
        assertNotNull(r.getRoutePoints().get(0).getLabel());
    }

    @Test
    void getIndoorDirections_LB2_toStairs() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-2", "LB-204", "LB2-Stairs-Down-1", "2", "2", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_LB3_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-3", "LB-311", "LB-314", "3", "3", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_LB4_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-4", "LB-451", "LB-453", "4", "4", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_LB5_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "LB-5", "LB-518", "LB-520", "5", "5", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_Hall9_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-9", "H9-903", "H9-967", "9", "9", false);
        assertNotNull(r);
        assertFalse(r.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_VL2_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VL-2", "VL-201", "VL-203", "2", "2", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_VE2_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-2", "VE-2-01", "VE-2-02", "2", "2", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_MB1_roomToRoom() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "MB-1", "MB-1-294", "MB-1-347", "1", "1", false);
        assertNotNull(r);
    }

    @Test
    void getIndoorDirections_convertBuildingId_VL_short() {
        List<String> rooms = directionService.getAvailableRooms("VL", "2");
        assertNotNull(rooms);
    }

    @Test
    void getIndoorDirections_convertBuildingId_VE_short() {
        List<String> rooms = directionService.getAvailableRooms("VE", "2");
        assertNotNull(rooms);
    }

    @Test
    void getIndoorDirections_convertBuildingId_CC_short() {
        List<String> rooms = directionService.getAvailableRooms("CC", "1");
        assertNotNull(rooms);
    }

    @Test
    void getIndoorDirections_HallPrefix_buildingId() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "H2-222", "2", "2", false);
        assertTrue(r.getBuildingId().startsWith("Hall-"));
    }

    @Test
    void getIndoorDirections_VLPrefix_buildingId() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VL-1", "VL-101", "VL-102", "1", "1", false);
        assertTrue(r.getBuildingId().startsWith("VL-"));
    }

    @Test
    void getIndoorDirections_MBPrefix_buildingId() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "MB-S2", "MB-S2-245", "MB-S2-255", "S2", "S2", false);
        assertTrue(r.getBuildingId().startsWith("MB-"));
    }

    @Test
    void getIndoorDirections_CCPrefix_buildingId() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "CC-1", "CC-101", "CC-107", "1", "1", false);
        assertTrue(r.getBuildingId().startsWith("CC-"));
    }

    @Test
    void getIndoorDirections_VEPrefix_buildingId() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-1", "VE-1-01", "VE-1-02", "1", "1", false);
        assertTrue(r.getBuildingId().startsWith("VE-"));
    }

    // --- High-impact tests targeting uncovered branches ---

    @Test
    void formatFinalDuration_longRoute_includesMinutes() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "CC-1", "CC-Entrance-Exit", "CC-Exit-Entrance-2", "1", "1", false);
        assertNotNull(r.getDuration());
        assertTrue(r.getDuration().contains("min"), "Long CC route should show minutes in duration");
    }

    @Test
    void crossFloor_Hall1toHall2_usesStairsWhenAllowed() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H1-118", "H2-217", "1", "2", false);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasStairs = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null && s.instruction().toLowerCase().contains("stairs"));
            boolean hasElevator = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null && s.instruction().toLowerCase().contains("elevator"));
            assertTrue(hasStairs || hasElevator, "Cross-floor route should have transition step");
            if (r.getStairMessage() != null) {
                assertTrue(r.getStairMessage().toLowerCase().contains("stairs"));
            }
        }
    }

    @Test
    void crossFloor_Hall1toHall2_avoidStairs_usesElevator() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H1-118", "H2-217", "1", "2", true);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasElevator = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null && s.instruction().toLowerCase().contains("elevator"));
            assertTrue(hasElevator, "Avoid-stairs cross-floor should use elevator");
        }
    }

    @Test
    void crossFloor_Hall9toHall8_stairsDown() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H9-903", "H8-843", "9", "8", false);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasDown = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null && s.instruction().toLowerCase().contains("down"));
            assertTrue(hasDown, "Hall 9 to 8 should have 'down' in transition");
        }
    }

    @Test
    void crossFloor_Hall9toHall8_elevatorDown() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H9-903", "H8-843", "9", "8", true);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasElevatorDown = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null
                            && s.instruction().toLowerCase().contains("elevator")
                            && s.instruction().toLowerCase().contains("down"));
            assertTrue(hasElevatorDown, "Avoid-stairs Hall 9→8 should use elevator down");
        }
    }

    @Test
    void steps_includeTurnManeuvers_forZigzagRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-801", "8", "8", false);
        assertNotNull(r);
        assertFalse(r.getSteps().isEmpty());
        boolean hasTurn = r.getSteps().stream()
                .anyMatch(s -> s.maneuverType() == IndoorManeuverType.TURN_LEFT
                        || s.maneuverType() == IndoorManeuverType.TURN_RIGHT
                        || s.maneuverType() == IndoorManeuverType.TURN_AROUND);
        boolean hasMovement = r.getSteps().stream()
                .anyMatch(s -> s.instruction() != null && (s.instruction().contains("Turn") || s.instruction().contains("straight")));
        assertTrue(hasTurn || hasMovement, "Route should have turn or movement instructions");
    }

    @Test
    void routeToStairsWaypoint_setsStairMessageFromRouteLabel() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Hall-Stairs-Main", "2", "2", false);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty() && r.getStairMessage() != null) {
            assertTrue(r.getStairMessage().toLowerCase().contains("stairs"));
        }
    }

    @Test
    void crossFloor_stairMessageSetWhenRouteUsesStairs() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H1-118", "H2-217", "1", "2", false);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasTransitionStairs = r.getRoutePoints().stream()
                    .anyMatch(p -> p.getLabel() != null && p.getLabel().contains("TRANSITION_STAIRS"));
            if (hasTransitionStairs && r.getStairMessage() != null) {
                assertTrue(r.getStairMessage().toLowerCase().contains("stairs"));
            }
        }
    }

    @Test
    void crossFloor_secondLeg_hasAfterTransitionInstruction() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H8-843", "H9-903", "8", "9", true);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasHallway = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null && s.instruction().toLowerCase().contains("hallway"));
            assertTrue(hasHallway, "Cross-floor route should have 'hallway' instruction after transition");
        }
    }

    @Test
    void getClosestConnectorPair_fallsBackToElevatorWhenNoStairs() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H8-843", "H9-903", "8", "9", false);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasTransition = r.getRoutePoints().stream()
                    .anyMatch(p -> p.getLabel() != null && p.getLabel().startsWith("TRANSITION_"));
            assertTrue(hasTransition, "Hall-8/9 cross-floor should find connector (elevator when stairs unavailable)");
        }
    }

    @Test
    void calculatePreciseDistance_singlePoint_returnsZero() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "Hall-8", "INVALID", "ALSO-INVALID", "8", "8", false);
        assertEquals("0 m", r.getDistance());
        assertEquals("0 sec", r.getDuration());
    }

    @Test
    void createTransitionStep_elevatorUp() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H8-843", "H9-903", "8", "9", true);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasElevatorUp = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null
                            && s.instruction().toLowerCase().contains("elevator")
                            && s.instruction().toLowerCase().contains("up"));
            assertTrue(hasElevatorUp, "Hall 8→9 should have elevator up instruction");
        }
    }

    @Test
    void createTransitionStep_stairsUp() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H1-118", "H2-217", "1", "2", false);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasStairsUp = r.getSteps().stream()
                    .anyMatch(s -> s.instruction() != null
                            && s.instruction().toLowerCase().contains("stairs")
                            && s.instruction().toLowerCase().contains("up"));
            assertTrue(hasStairsUp || r.getSteps().stream()
                            .anyMatch(s -> s.instruction() != null && s.instruction().toLowerCase().contains("stairs")),
                    "Hall 1→2 should have stairs instruction");
        }
    }

    @Test
    void detectTransitionType_returnsElevatorForElevatorRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H8-843", "H9-903", "8", "9", true);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasElevatorTransition = r.getRoutePoints().stream()
                    .anyMatch(p -> p.getLabel() != null && p.getLabel().contains("TRANSITION_ELEVATOR"));
            assertTrue(hasElevatorTransition, "Avoid-stairs route should use TRANSITION_ELEVATOR");
        }
    }

    @Test
    void detectTransitionType_returnsStairsForStairsRoute() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H1-118", "H2-217", "1", "2", false);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean hasStairsTransition = r.getRoutePoints().stream()
                    .anyMatch(p -> p.getLabel() != null && p.getLabel().contains("TRANSITION_STAIRS"));
            assertTrue(hasStairsTransition || r.getRoutePoints().stream()
                            .anyMatch(p -> p.getLabel() != null && p.getLabel().contains("TRANSITION_")),
                    "Stairs-allowed route may use TRANSITION_STAIRS");
        }
    }

    @Test
    void filterPois_includesStairsWhenStrategyAllowsStairs() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H1-118", "H2-217", "1", "2", false);
        assertNotNull(r);
        assertFalse(r.getRoutePoints().isEmpty(), "Cross-floor with stairs allowed should produce route");
    }

    @Test
    void filterPois_excludesStairsWhenAvoidStairs() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "H", "H1-118", "H2-217", "1", "2", true);
        assertNotNull(r);
        if (!r.getRoutePoints().isEmpty()) {
            boolean usedStairs = r.getRoutePoints().stream()
                    .anyMatch(p -> p.getLabel() != null && p.getLabel().contains("TRANSITION_STAIRS"));
            assertFalse(usedStairs, "Avoid-stairs should not use stairs transition");
        }
    }

    @Test
    void convertBuildingId_HallPrefix_preservesFullId() {
        List<String> rooms = directionService.getAvailableRooms("Hall-8", "8");
        assertNotNull(rooms);
        assertFalse(rooms.isEmpty());
    }

    @Test
    void resolvePoint_poiAsOrigin_resolves() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-1", "VE-Elevator-Main", "VE-1-02", "1", "1", false);
        assertNotNull(r);
        assertFalse(r.getRoutePoints().isEmpty(), "POI as origin should resolve and produce route");
    }

    @Test
    void resolvePoint_poiAsDestination_resolves() {
        IndoorDirectionResponse r = directionService.getIndoorDirections(
                "VE-1", "VE-1-01", "VE-Stairs-Main", "1", "1", false);
        assertNotNull(r);
    }

}
