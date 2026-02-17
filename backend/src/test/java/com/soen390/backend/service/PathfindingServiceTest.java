package com.soen390.backend.service;

import com.soen390.backend.service.PathfindingService.Waypoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PathfindingServiceTest {

    private PathfindingService service;

    @BeforeEach
    void setUp() {
        service = new PathfindingService();
    }



    @ParameterizedTest
    @ValueSource(strings = {
        "Hall-8", "Hall-9", "Hall-1", "Hall-2",
        "VL-1", "VL-2",
        "LB-2", "LB-3", "LB-4", "LB-5",
        "MB-S2"
    })
    void waypointsExistForEveryBuilding(String buildingId) {
        List<Waypoint> wps = service.getWaypointsForBuilding(buildingId);
        assertNotNull(wps);
        assertFalse(wps.isEmpty(),
                buildingId + " should have waypoints defined");
    }

    @Test
    void waypointsForUnknownBuilding_returnsEmptyList() {
        List<Waypoint> wps = service.getWaypointsForBuilding("Unknown-99");
        assertNotNull(wps);
        assertTrue(wps.isEmpty());
    }



    @Test
    void findNearestWaypoint_returnsClosestForHall8() {
        service.setBuilding("Hall-8");
        List<Waypoint> wps = service.getWaypointsForBuilding("Hall-8");
        Waypoint first = wps.get(0);

        Waypoint nearest = service.findNearestWaypoint(first.x, first.y);
        assertNotNull(nearest);
        assertEquals(first.id, nearest.id);
    }

    @Test
    void findNearestWaypoint_returnsNullForEmptyBuilding() {
        service.setBuilding("Unknown-99");
        Waypoint nearest = service.findNearestWaypoint(100, 100);
        assertNull(nearest);
    }



    @Test
    void findWaypointById_findsExistingWaypoint() {
        service.setBuilding("Hall-8");
        Waypoint wp = service.findWaypointById("point-allowed-hallway1");
        assertNotNull(wp);
        assertEquals("point-allowed-hallway1", wp.id);
    }

    @Test
    void findWaypointById_returnsNullForNonExistent() {
        service.setBuilding("Hall-8");
        Waypoint wp = service.findWaypointById("does-not-exist");
        assertNull(wp);
    }


    @Test
    void findPath_hall8_returnsNonEmptyPath() {
        service.setBuilding("Hall-8");
        List<Waypoint> wps = service.getWaypointsForBuilding("Hall-8");

        Waypoint start = wps.get(0);
        Waypoint end = wps.get(wps.size() - 1);

        List<Waypoint> path = service.findPathThroughWaypoints(start, end);
        assertNotNull(path);
        assertFalse(path.isEmpty());
        assertEquals(start.id, path.get(0).id);
        assertEquals(end.id, path.get(path.size() - 1).id);
    }

    @Test
    void findPath_sameStartAndEnd_returnsSinglePoint() {
        service.setBuilding("Hall-8");
        List<Waypoint> wps = service.getWaypointsForBuilding("Hall-8");
        Waypoint wp = wps.get(0);

        List<Waypoint> path = service.findPathThroughWaypoints(wp, wp);
        assertNotNull(path);
        assertEquals(1, path.size());
        assertEquals(wp.id, path.get(0).id);
    }

    @Test
    void findPath_returnsEmptyForNullInput() {
        service.setBuilding("Hall-8");
        assertTrue(service.findPathThroughWaypoints(null, null).isEmpty());
    }

    @Test
    void findPath_returnsEmptyWhenGraphMissing() {
        service.setBuilding("Unknown-99");
        Waypoint fake = new Waypoint(0, 0, "fake");
        assertTrue(service.findPathThroughWaypoints(fake, fake).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "Hall-8", "Hall-9", "Hall-1", "Hall-2",
        "VL-1", "VL-2",
        "LB-2", "LB-3", "LB-4", "LB-5",
        "MB-S2"
    })
    void graphIsConnected_pathExistsBetweenFirstAndLast(String buildingId) {
        service.setBuilding(buildingId);
        List<Waypoint> wps = service.getWaypointsForBuilding(buildingId);
        if (wps.size() < 2) return;

        Waypoint start = wps.get(0);
        Waypoint end = wps.get(wps.size() - 1);

        List<Waypoint> path = service.findPathThroughWaypoints(start, end);
        assertNotNull(path,
                buildingId + " graph should be connected — path must exist");
        assertTrue(path.size() >= 2);
    }


    @Test
    void waypoint_distanceTo_isCorrect() {
        Waypoint a = new Waypoint(0, 0, "a");
        Waypoint b = new Waypoint(3, 4, "b");
        assertEquals(5.0, a.distanceTo(b), 0.0001);
        assertEquals(5.0, a.distanceTo(3, 4), 0.0001);
    }

    @Test
    void waypoint_equalsByIdOnly() {
        Waypoint a = new Waypoint(0, 0, "same-id");
        Waypoint b = new Waypoint(999, 999, "same-id");
        assertEquals(a, b);
        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void waypoint_notEqualDifferentId() {
        Waypoint a = new Waypoint(0, 0, "id1");
        Waypoint b = new Waypoint(0, 0, "id2");
        assertNotEquals(a, b);
    }

    @Test
    void waypoint_toString_containsIdAndCoords() {
        Waypoint wp = new Waypoint(10.5, 20.3, "test-wp");
        String str = wp.toString();
        assertTrue(str.contains("test-wp"));
        assertTrue(str.contains("10.5"));
        assertTrue(str.contains("20.3"));
    }

    @Test
    void waypoint_notEqualToNull() {
        Waypoint wp = new Waypoint(0, 0, "wp1");
        assertNotEquals(null, wp);
    }


    @Test
    void getAllWaypoints_returnsListForCurrentBuilding() {
        service.setBuilding("Hall-8");
        List<Waypoint> all = service.getAllWaypoints();
        assertNotNull(all);
        assertFalse(all.isEmpty());
    }

    @Test
    void findPath_lb2_returnsConnectedPath() {
        service.setBuilding("LB-2");
        List<Waypoint> wps = service.getWaypointsForBuilding("LB-2");
        Waypoint start = wps.get(0);
        Waypoint end = wps.get(wps.size() / 2);

        List<Waypoint> path = service.findPathThroughWaypoints(start, end);
        assertNotNull(path);
        assertFalse(path.isEmpty());
        assertEquals(start.id, path.get(0).id);
        assertEquals(end.id, path.get(path.size() - 1).id);
    }

}
