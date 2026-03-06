package com.soen390.backend.service;

import com.soen390.backend.controller.IndoorDirectionsController;
import com.soen390.backend.model.FloorPlanData;
import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.object.IndoorRouteStep;
import com.soen390.backend.enums.IndoorManeuverType;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IndoorDirectionService {

    private static final String KEYWORD_STAIRS = "stairs";
    private static final String PREFIX_HALL = "Hall-";
    private static final String MSG_STAIRS_UP = "You will need to go up the stairs to reach the main floor.";
    private static final String MSG_STAIRS_DOWN = "You will need to go down the stairs to reach the exit level.";
    private static final String MSG_STAIRS_UP_GENERIC = "You will need to go up the stairs.";
    private static final String MSG_STAIRS_DOWN_GENERIC = "You will need to go down the stairs.";
    private static final String MSG_STAIRS_INVOLVED = "This route involves stairs.";

    private final PathfindingService pathfindingService;

    public IndoorDirectionService(PathfindingService pathfindingService) {
        this.pathfindingService = pathfindingService;
    }

    private String detectStairMessageFromRoute(List<IndoorDirectionResponse.RoutePoint> routePoints) {
        if (routePoints == null) return null;
        for (IndoorDirectionResponse.RoutePoint rp : routePoints) {
            if (rp.getLabel() != null && rp.getLabel().toLowerCase().contains(KEYWORD_STAIRS)) {
                return MSG_STAIRS_INVOLVED;
            }
        }
        return null;
    }

    public IndoorDirectionResponse getIndoorDirections(
            String buildingId,
            String origin,
            String destination,
            String originFloor,
            String destinationFloor,
            boolean avoidStairs) {

        String buildingName = getBuildingName(buildingId);
        pathfindingService.setBuilding(buildingId);

        String startFloor = originFloor != null ? originFloor : "1";
        String endFloor = destinationFloor != null ? destinationFloor : startFloor;

        List<IndoorDirectionResponse.RoutePoint> routePoints;

        if (startFloor.equals(endFloor)) {
            routePoints = calculateRoute(buildingId, origin, destination, startFloor, avoidStairs);
        } else {
            routePoints = calculateCrossFloorRoute(buildingId, origin, destination, startFloor, endFloor, avoidStairs);
        }

        double exactDistance = calculatePreciseDistance(routePoints);
        String distance = formatFinalDistance(exactDistance);
        String duration = formatFinalDuration(exactDistance);

        String usedTransition = detectTransitionType(routePoints);
        List<IndoorRouteStep> steps = generateRealSteps(destination, startFloor, endFloor, usedTransition);

        IndoorDirectionResponse.BuildingInfo buildingInfo = new IndoorDirectionResponse.BuildingInfo(
                buildingName, buildingId, startFloor, endFloor);

        IndoorDirectionResponse response = new IndoorDirectionResponse(
                distance, duration, buildingInfo, steps, routePoints);

        String stairMsg = detectStairMessage(buildingId, origin, destination, startFloor);
        if (stairMsg == null) {
            stairMsg = detectStairMessageFromRoute(routePoints);
        }
        boolean routeUsedStairs = "STAIRS".equals(usedTransition);

        if (stairMsg != null && routeUsedStairs) {
            response.setStairMessage(stairMsg);
        }

        return response;
    }

// --- OPTIMIZED ROUTING METHODS ---

    private List<IndoorDirectionResponse.RoutePoint> calculateCrossFloorRoute(
            String buildingId, String originRoomId, String destinationRoomId,
            String startFloor, String endFloor, boolean avoidStairs) {

        String startPlanId = convertBuildingIdForPathfinding(buildingId, startFloor);
        String endPlanId = convertBuildingIdForPathfinding(buildingId, endFloor);

        PathfindingService.Waypoint helper = new PathfindingService.Waypoint(0, 0, "helper");
        PathfindingService.Waypoint origin = resolvePoint(startPlanId, originRoomId);
        PathfindingService.Waypoint dest = resolvePoint(endPlanId, destinationRoomId);

        if (origin == null || dest == null) return new ArrayList<>();

        List<IndoorDirectionsController.PoiResponse> startConnectors = filterPois(helper.getPoisForBuilding(startPlanId), avoidStairs);
        List<IndoorDirectionsController.PoiResponse> endConnectors = filterPois(helper.getPoisForBuilding(endPlanId), avoidStairs);

        if (startConnectors.isEmpty() || endConnectors.isEmpty()) return new ArrayList<>();

        IndoorDirectionsController.PoiResponse bestStart = null;
        IndoorDirectionsController.PoiResponse bestEnd = null;
        double minDistance = Double.MAX_VALUE;
        boolean foundStairs = false;

        // PRIORITY 1: Force Stairs (if the user didn't click avoid stairs)
        if (!avoidStairs) {
            for (var s : startConnectors) {
                for (var e : endConnectors) {
                    if (s.type != null && e.type != null &&
                            s.type.toLowerCase().contains("stairs") && e.type.toLowerCase().contains("stairs")) {

                        double d1 = Math.hypot(s.x - origin.x, s.y - origin.y);
                        double d2 = Math.hypot(dest.x - e.x, dest.y - e.y);
                        if (d1 + d2 < minDistance) {
                            minDistance = d1 + d2;
                            bestStart = s;
                            bestEnd = e;
                            foundStairs = true;
                        }
                    }
                }
            }
        }

        // PRIORITY 2: Fallback to Elevators (if avoidStairs is true, OR if one floor was missing stairs)
        if (!foundStairs) {
            minDistance = Double.MAX_VALUE; // Reset distance tracker
            for (var s : startConnectors) {
                for (var e : endConnectors) {
                    if (s.type != null && e.type != null &&
                            s.type.toLowerCase().contains("elevator") && e.type.toLowerCase().contains("elevator")) {

                        double d1 = Math.hypot(s.x - origin.x, s.y - origin.y);
                        double d2 = Math.hypot(dest.x - e.x, dest.y - e.y);
                        if (d1 + d2 < minDistance) {
                            minDistance = d1 + d2;
                            bestStart = s;
                            bestEnd = e;
                        }
                    }
                }
            }
        }

        if (bestStart == null || bestEnd == null) return new ArrayList<>();

        List<IndoorDirectionResponse.RoutePoint> leg1 = buildRoute(
                startPlanId, new FloorPlanData.Point(origin.x, origin.y), new FloorPlanData.Point(bestStart.x, bestStart.y),
                originRoomId, bestStart.id, avoidStairs
        );

        List<IndoorDirectionResponse.RoutePoint> leg2 = buildRoute(
                endPlanId, new FloorPlanData.Point(bestEnd.x, bestEnd.y), new FloorPlanData.Point(dest.x, dest.y),
                bestEnd.id, destinationRoomId, avoidStairs
        );

        List<IndoorDirectionResponse.RoutePoint> fullRoute = new ArrayList<>(leg1);
        String type = bestStart.type.toUpperCase().contains("ELEVATOR") ? "ELEVATOR" : "STAIRS";

        fullRoute.add(new IndoorDirectionResponse.RoutePoint(bestStart.x, bestStart.y, "TRANSITION_" + type + "_TO_" + endFloor));

        if (!leg2.isEmpty()) {
            fullRoute.addAll(leg2);
        }

        return fullRoute;
    }

    private List<IndoorDirectionsController.PoiResponse> filterPois(
            List<IndoorDirectionsController.PoiResponse> all,
            boolean avoidStairs
    ) {
        if (all == null || all.isEmpty()) return Collections.emptyList();

        List<IndoorDirectionsController.PoiResponse> valid = new ArrayList<>();

        for (IndoorDirectionsController.PoiResponse p : all) {
            String type = (p == null || p.type == null) ? "" : p.type.toLowerCase();

            // Elevators are always allowed
            if (type.contains("elevator")) {
                valid.add(p);
            }
            // Stairs are only allowed if avoidStairs is false
            else if (!avoidStairs && type.contains("stairs")) {
                valid.add(p);
            }
        }
        return valid;
    }


    private List<IndoorDirectionResponse.RoutePoint> calculateRoute(
            String buildingId, String originRoomId,
            String destinationRoomId, String floor, boolean avoidStairs) {

        String planId = convertBuildingIdForPathfinding(buildingId, floor);
        PathfindingService.Waypoint helper = new PathfindingService.Waypoint(0, 0, "helper");

        PathfindingService.Waypoint sCoord = resolvePoint(planId, originRoomId);
        PathfindingService.Waypoint eCoord = resolvePoint(planId, destinationRoomId);

        if (sCoord == null || eCoord == null) return new ArrayList<>();

        return buildRoute(planId,
                new FloorPlanData.Point(sCoord.x, sCoord.y),
                new FloorPlanData.Point(eCoord.x, eCoord.y),
                originRoomId, destinationRoomId,
                avoidStairs);
    }


    private double calculatePreciseDistance(List<IndoorDirectionResponse.RoutePoint> pts) {
        if (pts == null || pts.size() < 2) return 0d;
        double sum = 0d;
        for (int i = 1; i < pts.size(); i++) {
            double dx = pts.get(i).getX() - pts.get(i - 1).getX();
            double dy = pts.get(i).getY() - pts.get(i - 1).getY();
            sum += Math.sqrt((dx * dx) + (dy * dy));
        }
        return sum;
    }

    private String formatFinalDistance(double exactDistance) {
        return String.format("%.0f m", exactDistance);
    }

    private String formatFinalDuration(double exactDistance) {
        if (exactDistance <= 0) return "0 sec";
        double seconds = exactDistance / 1.4d;
        int m = (int) (seconds / 60);
        int s = (int) (seconds % 60);
        return m > 0 ? m + " min " + s + " sec" : s + " sec";
    }

    private List<IndoorRouteStep> generateRealSteps(
            String destination,
            String originFloor,
            String destinationFloor,
            String usedTransition
    ) {
        List<IndoorRouteStep> steps = new ArrayList<>();
        steps.add(new IndoorRouteStep("Follow the path", "0 m", "0 sec",
                IndoorManeuverType.STRAIGHT, originFloor, null, null));

        if (!originFloor.equals(destinationFloor)) {
            boolean goingUp = parseFloorNumber(destinationFloor) > parseFloorNumber(originFloor);

            IndoorManeuverType maneuver;
            if ("ELEVATOR".equals(usedTransition)) {
                maneuver = goingUp ? IndoorManeuverType.ELEVATOR_UP : IndoorManeuverType.ELEVATOR_DOWN;
            } else {
                maneuver = goingUp ? IndoorManeuverType.STAIRS_UP : IndoorManeuverType.STAIRS_DOWN;
            }

            steps.add(new IndoorRouteStep(
                    "Transition to floor " + destinationFloor,
                    "0 m",
                    "30 sec",
                    maneuver,
                    originFloor,
                    null,
                    null
            ));
        }

        steps.add(new IndoorRouteStep("Arrive at " + destination, "0 m", "0 sec",
                IndoorManeuverType.ENTER_ROOM, destinationFloor, destination, null));

        return steps;
    }

    private String detectStairMessage(String buildingId, String origin, String destination, String floor) {
        String lo = origin.toLowerCase();
        String ld = destination.toLowerCase();
        String hallStairMsg = detectHallSecondFloorStairs(buildingId, floor, lo, ld);
        if (hallStairMsg != null) return hallStairMsg;
        return detectGenericStairs(lo, ld);
    }

    private String detectHallSecondFloorStairs(String buildingId, String floor, String lo, String ld) {
        boolean isHall = "H".equals(buildingId) || (buildingId != null && buildingId.startsWith(PREFIX_HALL));
        boolean isSecondFloor = "2".equals(floor) || (buildingId != null && buildingId.endsWith("-2"));
        if (!isHall || !isSecondFloor) return null;
        if (isHallEntrance(lo) && !isHallEntrance(ld)) return MSG_STAIRS_UP;
        if (!isHallEntrance(lo) && isHallEntrance(ld)) return MSG_STAIRS_DOWN;
        return null;
    }

    private static boolean isHallEntrance(String label) {
        return label.contains("maisonneuve") || label.contains("bishop") || label.contains("mckay") || label.contains("underground");
    }

    private String detectGenericStairs(String lo, String ld) {
        if (!lo.contains(KEYWORD_STAIRS) && !ld.contains(KEYWORD_STAIRS)) return null;
        if (lo.contains("stairs-up") || ld.contains("stairs-up")) return MSG_STAIRS_UP_GENERIC;
        if (lo.contains("stairs-down") || ld.contains("stairs-down")) return MSG_STAIRS_DOWN_GENERIC;
        return MSG_STAIRS_INVOLVED;
    }

    private String getBuildingName(String buildingId) {
        if ("H".equals(buildingId) || (buildingId != null && buildingId.startsWith(PREFIX_HALL)))
            return "Hall Building";
        if (buildingId != null && buildingId.startsWith("VL-")) return "Vanier Library Building";
        if (buildingId != null && buildingId.startsWith("LB-")) return "Webster Library Building";
        if (buildingId != null && buildingId.startsWith("MB-")) return "John Molson School of Business";
        if (buildingId != null && buildingId.startsWith("CC-")) return "Central Building";
        if (buildingId != null && buildingId.startsWith("VE-") || "VE".equals(buildingId)) return "Engineering/Visual Arts Building";
        return "Building " + buildingId;
    }

    private String convertBuildingIdForPathfinding(String buildingId, String floor) {
        if (buildingId == null || floor == null) return buildingId;
        if ("H".equals(buildingId) || "Hall-".equals(buildingId)) {
            return PREFIX_HALL + floor;
        }
        if (buildingId.startsWith(PREFIX_HALL)
                || buildingId.startsWith("VL-")
                || buildingId.startsWith("LB-")
                || buildingId.startsWith("MB-")
                || buildingId.startsWith("CC-")
                || buildingId.startsWith("VE-")) {
            return buildingId;
        }
        if ("VL".equals(buildingId)) return "VL-" + floor;
        if ("LB".equals(buildingId)) return "LB-" + floor;
        if ("MB".equals(buildingId)) return "MB-" + floor;
        if ("CC".equals(buildingId)) return "CC-" + floor;
        if ("VE".equals(buildingId)) return "VE-" + floor;
        return buildingId;
    }

    public List<String> getAvailableRooms(String bId, String f) {
        return new ArrayList<>(getRoomPoints(bId, f).stream().map(r -> r.id).toList());
    }

    public List<IndoorDirectionsController.WaypointResponse> getWaypoints(String bId, String f) {
        String pId = convertBuildingIdForPathfinding(bId, f);
        return pathfindingService.getWaypointsForBuilding(pId).stream()
                .map(w -> new IndoorDirectionsController.WaypointResponse(w.x, w.y, w.id)).toList();
    }

    public List<IndoorDirectionsController.RoomPointResponse> getRoomPoints(String bId, String f) {
        String pId = convertBuildingIdForPathfinding(bId, f);
        PathfindingService.Waypoint helper = new PathfindingService.Waypoint(0, 0, "helper");
        Map<String, PathfindingService.Waypoint> coords = helper.getRoomCoordinateMap(pId);
        List<IndoorDirectionsController.RoomPointResponse> response = new ArrayList<>();
        if(coords != null) {
            for (Map.Entry<String, PathfindingService.Waypoint> entry : coords.entrySet()) {
                response.add(new IndoorDirectionsController.RoomPointResponse(entry.getValue().x, entry.getValue().y, entry.getKey()));
            }
        }
        return response;
    }

    public List<IndoorDirectionsController.PoiResponse> getPointsOfInterest(String bId, String f) {
        String pId = convertBuildingIdForPathfinding(bId, f);
        return new PathfindingService.Waypoint(0,0,"helper").getPoisForBuilding(pId);
    }

    private List<IndoorDirectionResponse.RoutePoint> buildRoute(
            String pathfindingBuildingId,
            FloorPlanData.Point originPoint, FloorPlanData.Point destPoint,
            String originId, String destId, boolean avoidStairs) {

        pathfindingService.setBuilding(pathfindingBuildingId);
        PathfindingService.Waypoint startWp = pathfindingService.findNearestWaypoint(originPoint.getX(), originPoint.getY());
        PathfindingService.Waypoint endWp = pathfindingService.findNearestWaypoint(destPoint.getX(), destPoint.getY());

        if (startWp == null || endWp == null) return new ArrayList<>();

        List<PathfindingService.Waypoint> waypointPath =
                pathfindingService.findPathThroughWaypoints(startWp, endWp, avoidStairs);

        if (waypointPath.isEmpty()) return new ArrayList<>();

        List<IndoorDirectionResponse.RoutePoint> routePoints = new ArrayList<>();
        routePoints.add(new IndoorDirectionResponse.RoutePoint(originPoint.getX(), originPoint.getY(), originId));
        for (PathfindingService.Waypoint wp : waypointPath) {
            routePoints.add(new IndoorDirectionResponse.RoutePoint(wp.x, wp.y, wp.id));
        }
        routePoints.add(new IndoorDirectionResponse.RoutePoint(destPoint.getX(), destPoint.getY(), destId));
        return routePoints;
    }

    private int parseFloorNumber(String floor) {
        try {
            String formattedFloor = floor.toUpperCase().replace("S", "-");
            return Integer.parseInt(formattedFloor.replaceAll("[^0-9-]", ""));
        } catch (Exception e) {
            return 0;
        }
    }



    private PathfindingService.Waypoint resolvePoint(String planId, String id) {
        if (id == null) return null;

        PathfindingService.Waypoint helper = new PathfindingService.Waypoint(0, 0, "helper");

        // 1) Try rooms
        PathfindingService.Waypoint w = helper.getRoomCoordinate(planId, id);
        if (w != null) return w;

        // 2) Try POIs
        List<IndoorDirectionsController.PoiResponse> pois = helper.getPoisForBuilding(planId);
        for (IndoorDirectionsController.PoiResponse p : pois) {
            if (p != null && p.id != null && p.id.equals(id)) {
                return new PathfindingService.Waypoint(p.x, p.y, p.id);
            }
        }

        return null;
    }

    private String detectTransitionType(List<IndoorDirectionResponse.RoutePoint> routePoints) {
        if (routePoints == null) return null;

        for (IndoorDirectionResponse.RoutePoint rp : routePoints) {
            String label = rp.getLabel();
            if (label == null) continue;

            if (label.startsWith("TRANSITION_ELEVATOR")) return "ELEVATOR";
            if (label.startsWith("TRANSITION_STAIRS"))   return "STAIRS";
        }
        return null;
    }
}