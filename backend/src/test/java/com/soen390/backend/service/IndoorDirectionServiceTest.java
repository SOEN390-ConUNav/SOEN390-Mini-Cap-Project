package com.soen390.backend.service;

import com.soen390.backend.enums.IndoorManeuverType;
import com.soen390.backend.object.IndoorDirectionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class IndoorDirectionServiceTest {

    private IndoorDirectionService directionService;
    private PathfindingService pathfindingService;

    @BeforeEach
    void setUp() {
        pathfindingService = new PathfindingService();
        directionService = new IndoorDirectionService();
        ReflectionTestUtils.setField(directionService, "pathfindingService", pathfindingService);
    }


    @Test
    void getIndoorDirections_hall8_returnsRoutePoints() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8");

        assertNotNull(response);
        assertEquals("Hall Building", response.getBuildingName());
        assertEquals("Hall-8", response.getBuildingId());
        assertNotNull(response.getRoutePoints());
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_returnsPlaceholderDistanceDuration() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8");

        assertEquals("—", response.getDistance());
        assertEquals("—", response.getDuration());
    }

    @Test
    void getIndoorDirections_hall9_returnsNonEmptyRoute() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-9", "H9-903", "H9-967", "9", "9");

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_lb2_returnsNonEmptyRoute() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "LB-2", "LB-204", "LB-259", "2", "2");

        assertNotNull(response);
        assertFalse(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_invalidRooms_returnsEmptyRoute() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "INVALID-ROOM", "ALSO-INVALID", "8", "8");

        assertNotNull(response);
        assertTrue(response.getRoutePoints().isEmpty());
    }

    @Test
    void getIndoorDirections_nullFloor_defaultsToOne() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", null, null);

        assertNotNull(response);
        assertEquals("1", response.getStartFloor());
        assertEquals("1", response.getEndFloor());
    }

   

    @Test
    void stairMessage_entranceToRoom_goUp() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "Maisonneuve-Entrance", "H2-217", "2", "2");

        assertNotNull(response.getStairMessage());
        assertTrue(response.getStairMessage().toLowerCase().contains("up"));
    }

    @Test
    void stairMessage_roomToEntrance_goDown() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Bishop-Entrance", "2", "2");

        assertNotNull(response.getStairMessage());
        assertTrue(response.getStairMessage().toLowerCase().contains("down"));
    }

    @Test
    void stairMessage_roomToRoom_noStairMessage() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8");

        assertNull(response.getStairMessage());
    }

    @Test
    void stairMessage_stairsUp_detected() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Stairs-Up-1", "2", "2");

        assertNotNull(response.getStairMessage());
        assertTrue(response.getStairMessage().toLowerCase().contains("stairs"));
    }



    @Test
    void routeNormalization_AtoB_sameAsBtoA_forHall8() {
        IndoorDirectionResponse ab = directionService.getIndoorDirections(
                "Hall-8", "H8-843", "H8-807", "8", "8");
        IndoorDirectionResponse ba = directionService.getIndoorDirections(
                "Hall-8", "H8-807", "H8-843", "8", "8");

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
                "Hall-2", "Maisonneuve-Entrance", "H2-217", "2", "2");
        IndoorDirectionResponse ba = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Maisonneuve-Entrance", "2", "2");

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
                directionService.getIndoorDirections("VL-1", "VL-101", "VL-102", "1", "1").getBuildingName());
        assertEquals("Webster Library Building",
                directionService.getIndoorDirections("LB-2", "LB-204", "LB-259", "2", "2").getBuildingName());
        assertEquals("John Molson School of Business",
                directionService.getIndoorDirections("MB-S2", "MBS2-101", "MBS2-102", "S2", "S2").getBuildingName());
    }

    @Test
    void stairMessage_stairsDown_detected() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "Stairs-Down-1", "2", "2");

        assertNotNull(response.getStairMessage());
        assertTrue(response.getStairMessage().toLowerCase().contains("stairs"));
    }

    @Test
    void stairMessage_genericStairs_detected() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "LB-2", "LB-204", "Arrival-Stairs", "2", "2");

        assertNotNull(response.getStairMessage());
        assertTrue(response.getStairMessage().toLowerCase().contains("stairs"));
    }



    @Test
    void getBuildingName_unknownPrefix_returnsDefault() {
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "XX-1", "room1", "room2", "1", "1");

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
                "H", "McKay-Entrance", "H2-217", "2", "2");

        assertNotNull(response.getStairMessage());
        assertTrue(response.getStairMessage().contains("up"),
                "McKay entrance → room in 'H' building floor 2 should say go up");
    }

    @Test
    void stairMessage_hallEntrance_nonFloor2_noEntranceMessage() {

        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-8", "McKay-Entrance", "H8-807", "8", "8");

        if (response.getStairMessage() != null) {
            assertFalse(response.getStairMessage().contains("main floor"),
                    "Hall floor 8 should not produce entrance stair message");
            assertFalse(response.getStairMessage().contains("exit level"),
                    "Hall floor 8 should not produce entrance stair message");
        }
    }

    @Test
    void stairMessage_undergroundEntrance_asOrigin_goUp() {
     
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "Underground-Entrance", "H2-217", "2", "2");

        assertNotNull(response.getStairMessage());
        assertTrue(response.getStairMessage().contains("up"),
                "Underground entrance → room should say go up");
    }

    @Test
    void stairMessage_roomToMcKayEntrance_goDown() {
 
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "H2-217", "McKay-Entrance", "2", "2");

        assertNotNull(response.getStairMessage());
        assertTrue(response.getStairMessage().contains("down"),
                "Room → McKay entrance should say go down");
    }

    @Test
    void stairMessage_bothEntrances_noEntranceMessage() {
    
        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "Hall-2", "Maisonneuve-Entrance", "Bishop-Entrance", "2", "2");

      
        if (response.getStairMessage() != null) {
            assertFalse(response.getStairMessage().contains("main floor"),
                    "Entrance→Entrance should not say 'reach the main floor'");
            assertFalse(response.getStairMessage().contains("exit level"),
                    "Entrance→Entrance should not say 'reach the exit level'");
        }
    }

    @Test
    void stairMessage_nonHallBuilding_entranceNames_noEntranceMessage() {

        IndoorDirectionResponse response = directionService.getIndoorDirections(
                "LB-2", "Maisonneuve-Entrance", "LB-204", "2", "2");


        if (response.getStairMessage() != null) {
            assertFalse(response.getStairMessage().contains("main floor"),
                    "Non-Hall building should not produce Hall entrance message");
            assertFalse(response.getStairMessage().contains("exit level"),
                    "Non-Hall building should not produce Hall entrance message");
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

}
