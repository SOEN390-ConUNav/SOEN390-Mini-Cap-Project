package com.soen390.backend.service;

import com.soen390.backend.controller.IndoorDirectionsController;
import com.soen390.backend.model.FloorPlanData;
import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.object.IndoorRouteStep;
import com.soen390.backend.enums.IndoorManeuverType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IndoorDirectionService {

    @Autowired
    private PathfindingService pathfindingService;

    public IndoorDirectionResponse getIndoorDirections(
            String buildingId,
            String origin,
            String destination,
            String originFloor,
            String destinationFloor) {

        List<IndoorRouteStep> steps = generatePlaceholderSteps(
                origin, destination, originFloor, destinationFloor);

        String buildingName = getBuildingName(buildingId);
        pathfindingService.setBuilding(buildingId);

        List<IndoorDirectionResponse.RoutePoint> routePoints = calculateRoute(
                buildingId, origin, destination,
                originFloor != null ? originFloor : "1");

        String distance = calculateDistance(routePoints);
        String duration = calculateDuration(routePoints);

        IndoorDirectionResponse response = new IndoorDirectionResponse(
                distance, duration, buildingName, buildingId,
                originFloor != null ? originFloor : "1",
                destinationFloor != null ? destinationFloor : "1",
                steps, routePoints);

        String stairMsg = detectStairMessage(buildingId, origin, destination);
        if (stairMsg != null) {
            response.setStairMessage(stairMsg);
        }

        return response;
    }

    /**
     * Detect if the route involves stairs and return an appropriate message.
     */
    private String detectStairMessage(String buildingId, String origin, String destination) {
        String lo = origin.toLowerCase();
        String ld = destination.toLowerCase();

        if ("H".equals(buildingId) || (buildingId != null && buildingId.startsWith("Hall-"))) {
            boolean originIsEntrance = lo.contains("maisonneuve") || lo.contains("bishop")
                || lo.contains("mckay") || lo.contains("underground");
            boolean destIsEntrance = ld.contains("maisonneuve") || ld.contains("bishop")
                || ld.contains("mckay") || ld.contains("underground");

            if (originIsEntrance && !destIsEntrance) {
                return "You will need to go up the stairs to reach the main floor.";
            }
            if (!originIsEntrance && destIsEntrance) {
                return "You will need to go down the stairs to reach the exit level.";
            }
        }

        boolean originIsStairs = lo.contains("stairs");
        boolean destIsStairs = ld.contains("stairs");
        if (originIsStairs || destIsStairs) {
            if (lo.contains("stairs-up") || ld.contains("stairs-up")
                || lo.contains("stairs-to")) {
                return "You will need to go up the stairs.";
            }
            if (lo.contains("stairs-down") || ld.contains("stairs-down")
                || lo.contains("stairs-coming") || lo.contains("stairs-from")) {
                return "You will need to go down the stairs.";
            }
            return "This route involves stairs.";
        }

        return null;
    }

    /**
     *  placeholder step-by-step text directions.
     */
    private List<IndoorRouteStep> generatePlaceholderSteps(
            String origin, String destination,
            String originFloor, String destinationFloor) {

        List<IndoorRouteStep> steps = new ArrayList<>();

        if (originFloor != null && destinationFloor != null
                && !originFloor.equals(destinationFloor)) {
            int originFloorNum = Integer.parseInt(originFloor);
            int destFloorNum = Integer.parseInt(destinationFloor);
            IndoorManeuverType elevatorType = destFloorNum > originFloorNum
                    ? IndoorManeuverType.ELEVATOR_UP
                    : IndoorManeuverType.ELEVATOR_DOWN;
            steps.add(new IndoorRouteStep(
                    "Take elevator to floor " + destinationFloor,
                    "0 m", "30 sec", elevatorType,
                    originFloor, null, "Elevator"));
        }

        String floorLabel = destinationFloor != null ? destinationFloor : originFloor;
        steps.add(new IndoorRouteStep(
                "Walk straight down the hallway",
                "20 m", "30 sec", IndoorManeuverType.STRAIGHT,
                floorLabel, null, "Main hallway"));
        steps.add(new IndoorRouteStep(
                "Turn right",
                "0 m", "0 sec", IndoorManeuverType.TURN_RIGHT,
                floorLabel, null, null));
        steps.add(new IndoorRouteStep(
                "Enter " + destination,
                "10 m", "15 sec", IndoorManeuverType.ENTER_ROOM,
                floorLabel, destination, null));

        return steps;
    }

    private String getBuildingName(String buildingId) {
        if (buildingId != null && buildingId.startsWith("Hall-")) {
            return "Hall Building";
        } else if (buildingId != null && buildingId.startsWith("VL-")) {
            return "Vanier Library Building";
        } else if (buildingId != null && buildingId.startsWith("LB-")) {
            return "Webster Library Building";
        } else if (buildingId != null && buildingId.startsWith("MB-")) {
            return "John Molson School of Business";
        }
        return "Building " + buildingId;
    }

    /**
     * Convert building ID from frontend format to pathfinding service format.
     */
    private String convertBuildingIdForPathfinding(String buildingId, String floor) {
        if (buildingId == null || floor == null) {
            return buildingId;
        }
        if (buildingId.startsWith("Hall-") || buildingId.startsWith("VL-")
                || buildingId.startsWith("MB-")) {
            return buildingId;
        }
        if ("H".equals(buildingId))  return "Hall-" + floor;
        if ("VL".equals(buildingId)) return "VL-" + floor;
        if ("LB".equals(buildingId)) return "LB-" + floor;
        if ("MB".equals(buildingId)) return "MB-" + floor;
        return buildingId;
    }

    /**
     * Get list of available rooms for a building/floor.
     */
    public List<String> getAvailableRooms(String buildingId, String floor) {
        String pathfindingBuildingId = convertBuildingIdForPathfinding(buildingId, floor);
        FloorPlanData floorPlan = new FloorPlanData(pathfindingBuildingId, floor);
        return new ArrayList<>(floorPlan.getRoomPoints().keySet());
    }

    /**
     * Get all waypoints for a building/floor.
     */
    public List<IndoorDirectionsController.WaypointResponse> getWaypoints(String buildingId, String floor) {
        String pathfindingBuildingId = convertBuildingIdForPathfinding(buildingId, floor);
        List<PathfindingService.Waypoint> waypoints = pathfindingService.getWaypointsForBuilding(pathfindingBuildingId);
        List<IndoorDirectionsController.WaypointResponse> response = new ArrayList<>();
        for (PathfindingService.Waypoint wp : waypoints) {
            response.add(new IndoorDirectionsController.WaypointResponse(wp.x, wp.y, wp.id));
        }
        return response;
    }

    /**
     * Get all room points (coordinates) for a building/floor.
     */
    public List<IndoorDirectionsController.RoomPointResponse> getRoomPoints(String buildingId, String floor) {
        String pathfindingBuildingId = convertBuildingIdForPathfinding(buildingId, floor);
        FloorPlanData floorPlan = new FloorPlanData(pathfindingBuildingId, floor);
        Map<String, FloorPlanData.Point> roomPoints = floorPlan.getRoomPoints();
        List<IndoorDirectionsController.RoomPointResponse> response = new ArrayList<>();
        for (Map.Entry<String, FloorPlanData.Point> entry : roomPoints.entrySet()) {
            response.add(new IndoorDirectionsController.RoomPointResponse(
                entry.getValue().getX(), entry.getValue().getY(), entry.getKey()));
        }
        return response;
    }

    /**
     * Get all Points of Interest for a building/floor.
     */
    public List<IndoorDirectionsController.PoiResponse> getPointsOfInterest(String buildingId, String floor) {
        String pathfindingBuildingId = convertBuildingIdForPathfinding(buildingId, floor);
        FloorPlanData floorPlan = new FloorPlanData(pathfindingBuildingId, floor);
        List<FloorPlanData.PointOfInterest> pois = floorPlan.getPointsOfInterest();
        List<IndoorDirectionsController.PoiResponse> response = new ArrayList<>();
        for (FloorPlanData.PointOfInterest poi : pois) {
            response.add(new IndoorDirectionsController.PoiResponse(
                poi.x, poi.y, poi.id, poi.displayName, poi.type));
        }
        return response;
    }

    /**
     * Calculate route between two rooms using pathfinding.
     * Normalizes origin/destination ordering to ensure A→B is the reverse of B→A,
     * except for Hall-2 where up/down stairs differ so direction matters.
     */
    private List<IndoorDirectionResponse.RoutePoint> calculateRoute(
            String buildingId, String originRoomId,
            String destinationRoomId, String floor) {

        String pathfindingBuildingId = convertBuildingIdForPathfinding(buildingId, floor);

        // Hall-2 has different up/down stairs, so A→B and B→A can differ — skip normalization
        boolean isHall2 = "Hall-2".equals(pathfindingBuildingId);
        boolean shouldReverse = !isHall2 && originRoomId.compareTo(destinationRoomId) > 0;
        String normalizedOrigin = shouldReverse ? destinationRoomId : originRoomId;
        String normalizedDest = shouldReverse ? originRoomId : destinationRoomId;

        FloorPlanData floorPlan = new FloorPlanData(pathfindingBuildingId, floor);
        String resolvedOriginId = normalizedOrigin;
        String resolvedDestId = normalizedDest;

        // Resolve multi-entrance rooms to closest entrance
        FloorPlanData.Point tempOriginPoint = floorPlan.getRoomPoints().get(normalizedOrigin);
        if (tempOriginPoint == null) {
            FloorPlanData.Point tempDestPoint = floorPlan.getRoomPoints().get(normalizedDest);
            if (tempDestPoint == null) {
                java.util.List<String> destEntrances = floorPlan.getRoomEntranceGroups().get(normalizedDest);
                if (destEntrances != null && !destEntrances.isEmpty()) {
                    String firstDestEntrance = destEntrances.get(0);
                    FloorPlanData.Point firstDestPoint = floorPlan.getRoomPoints().get(firstDestEntrance);
                    if (firstDestPoint != null) {
                        resolvedOriginId = floorPlan.resolveToClosestEntrance(normalizedOrigin,
                            firstDestPoint.getX(), firstDestPoint.getY());
                    }
                }
            } else {
                resolvedOriginId = floorPlan.resolveToClosestEntrance(normalizedOrigin,
                    tempDestPoint.getX(), tempDestPoint.getY());
            }
        }

        FloorPlanData.Point resolvedOriginPoint = floorPlan.getRoomPoints().get(resolvedOriginId);
        if (resolvedOriginPoint != null) {
            resolvedDestId = floorPlan.resolveToClosestEntrance(normalizedDest,
                resolvedOriginPoint.getX(), resolvedOriginPoint.getY());
        }

        FloorPlanData.Point originPoint = floorPlan.getRoomPoints().get(resolvedOriginId);
        FloorPlanData.Point destPoint = floorPlan.getRoomPoints().get(resolvedDestId);

        if (originPoint == null || destPoint == null) {
            return new ArrayList<>();
        }

        pathfindingService.setBuilding(pathfindingBuildingId);

        PathfindingService.Waypoint startWaypoint = pathfindingService.findNearestWaypoint(
                originPoint.getX(), originPoint.getY());
        PathfindingService.Waypoint endWaypoint = pathfindingService.findNearestWaypoint(
                destPoint.getX(), destPoint.getY());

        if (startWaypoint == null || endWaypoint == null) {
            return new ArrayList<>();
        }

        List<PathfindingService.Waypoint> waypointPath = pathfindingService.findPathThroughWaypoints(
                startWaypoint, endWaypoint);

        if (waypointPath == null || waypointPath.isEmpty()) {
            return new ArrayList<>();
        }

        // Build route: origin room → waypoints → destination room
        List<IndoorDirectionResponse.RoutePoint> routePoints = new ArrayList<>();
        routePoints.add(new IndoorDirectionResponse.RoutePoint(
                originPoint.getX(), originPoint.getY(), resolvedOriginId));
        for (PathfindingService.Waypoint waypoint : waypointPath) {
            routePoints.add(new IndoorDirectionResponse.RoutePoint(
                    waypoint.x, waypoint.y, waypoint.id));
        }
        routePoints.add(new IndoorDirectionResponse.RoutePoint(
                destPoint.getX(), destPoint.getY(), resolvedDestId));

        if (shouldReverse) {
            java.util.Collections.reverse(routePoints);
        }

        return routePoints;
    }

    private String calculateDistance(List<IndoorDirectionResponse.RoutePoint> routePoints) {
        return "—";
    }

    private String calculateDuration(List<IndoorDirectionResponse.RoutePoint> routePoints) {
        return "—";
    }
}
