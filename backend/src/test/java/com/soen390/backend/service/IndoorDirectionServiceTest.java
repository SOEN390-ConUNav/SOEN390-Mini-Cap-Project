package com.soen390.backend.service;

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

}
