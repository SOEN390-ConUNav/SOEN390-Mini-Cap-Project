package com.soen390.backend.service;

import com.soen390.backend.controller.IndoorDirectionsController;
import com.soen390.backend.model.FloorPlanData;
import com.soen390.backend.service.strategy.AccessibilityRoutingStrategy;
import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.object.IndoorRouteStep;
import com.soen390.backend.enums.IndoorManeuverType;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class IndoorDirectionService {

    private static final String PLACEHOLDER_DASH = "—";
    private static final String KEYWORD_STAIRS = "stairs";
    private static final String TRANSITION_TYPE_STAIRS = "STAIRS";
    private static final String KEYWORD_STAIRS_LOWER = "stairs";
    private static final String STR_ELEVATOR = "ELEVATOR";
    private static final String STR_ELEVATOR_LOWER = "elevator";
    private static final String STR_HELPER = "helper";
    private static final String PREFIX_HALL = "Hall-";
    private static final String MSG_STAIRS_UP = "You will need to go up the stairs to reach the main floor.";
    private static final String MSG_STAIRS_DOWN = "You will need to go down the stairs to reach the exit level.";
    private static final String MSG_STAIRS_UP_GENERIC = "You will need to go up the stairs.";
    private static final String MSG_STAIRS_DOWN_GENERIC = "You will need to go down the stairs.";
    private static final String MSG_STAIRS_INVOLVED = "This route involves stairs.";

    private static final double PIXELS_TO_METERS = 0.06d;
    private static final double TURN_THRESHOLD_DEG = 70d;
    private static final double UTURN_THRESHOLD_DEG = 150d;
    private static final double MIN_SEGMENT_PX = 12d;

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

        AccessibilityRoutingStrategy strategy = AccessibilityRoutingStrategy.fromAvoidStairs(avoidStairs);
        String buildingName = getBuildingName(buildingId);
        pathfindingService.setBuilding(buildingId);

        String startFloor = originFloor != null ? originFloor : "1";
        String endFloor = destinationFloor != null ? destinationFloor : startFloor;

        List<IndoorDirectionResponse.RoutePoint> routePoints;

        if (startFloor.equals(endFloor)) {
            routePoints = calculateRoute(buildingId, origin, destination, startFloor, strategy);
        } else {
            routePoints = calculateCrossFloorRoute(buildingId, origin, destination, startFloor, endFloor, strategy);
        }

        double exactDistance = calculatePreciseDistance(routePoints);
        String distance = formatFinalDistance(exactDistance);
        String duration = formatFinalDuration(exactDistance);

        String usedTransition = detectTransitionType(routePoints);
        List<IndoorRouteStep> steps = generateRealSteps(
                origin, destination, routePoints, startFloor, endFloor, usedTransition);

        IndoorDirectionResponse.BuildingInfo buildingInfo = new IndoorDirectionResponse.BuildingInfo(
                buildingName, buildingId, startFloor, endFloor);

        IndoorDirectionResponse response = new IndoorDirectionResponse(
                distance, duration, buildingInfo, steps, routePoints);

        String stairMsg = detectStairMessage(buildingId, origin, destination, startFloor);
        if (stairMsg == null) {
            stairMsg = detectStairMessageFromRoute(routePoints);
        }
        boolean routeUsedStairs = TRANSITION_TYPE_STAIRS.equals(usedTransition);

        if (stairMsg != null && routeUsedStairs) {
            response.setStairMessage(stairMsg);
        }

        return response;
    }

// --- OPTIMIZED ROUTING METHODS ---

    private List<IndoorDirectionResponse.RoutePoint> calculateCrossFloorRoute(
            String buildingId, String originRoomId, String destinationRoomId,
            String startFloor, String endFloor, AccessibilityRoutingStrategy strategy) {

        String startPlanId = convertBuildingIdForPathfinding(buildingId, startFloor);
        String endPlanId = convertBuildingIdForPathfinding(buildingId, endFloor);

        PathfindingService.Waypoint helper = new PathfindingService.Waypoint(0, 0, STR_HELPER);
        PathfindingService.Waypoint origin = resolvePoint(startPlanId, originRoomId);
        PathfindingService.Waypoint dest = resolvePoint(endPlanId, destinationRoomId);

        if (origin == null || dest == null) return new ArrayList<>();

        List<IndoorDirectionsController.PoiResponse> startConnectors = filterPois(helper.getPoisForBuilding(startPlanId), strategy);
        List<IndoorDirectionsController.PoiResponse> endConnectors = filterPois(helper.getPoisForBuilding(endPlanId), strategy);

        if (startConnectors.isEmpty() || endConnectors.isEmpty()) return new ArrayList<>();

        boolean avoidStairs = !strategy.preferStairsForConnectors();
        IndoorDirectionsController.PoiResponse[] bestConnectors = findBestTransitionConnectors(origin, dest, startConnectors, endConnectors, avoidStairs);
        if (bestConnectors == null) return new ArrayList<>();

        IndoorDirectionsController.PoiResponse bestStart = bestConnectors[0];
        IndoorDirectionsController.PoiResponse bestEnd = bestConnectors[1];

        List<IndoorDirectionResponse.RoutePoint> leg1 = buildRoute(
                startPlanId, new FloorPlanData.Point(origin.x, origin.y), new FloorPlanData.Point(bestStart.getX(), bestStart.getY()),
                originRoomId, bestStart.getId(), strategy
        );

        List<IndoorDirectionResponse.RoutePoint> leg2 = buildRoute(
                endPlanId, new FloorPlanData.Point(bestEnd.getX(), bestEnd.getY()), new FloorPlanData.Point(dest.x, dest.y),
                bestEnd.getId(), destinationRoomId, strategy
        );

        List<IndoorDirectionResponse.RoutePoint> fullRoute = new ArrayList<>(leg1);
        String type = (bestStart.getType() != null && bestStart.getType().toUpperCase().contains(STR_ELEVATOR)) ? STR_ELEVATOR : TRANSITION_TYPE_STAIRS;

        fullRoute.add(new IndoorDirectionResponse.RoutePoint(bestStart.getX(), bestStart.getY(), "TRANSITION_" + type + "_TO_" + endFloor));

        if (!leg2.isEmpty()) {
            fullRoute.addAll(leg2);
        }

        return fullRoute;
    }

    private IndoorDirectionsController.PoiResponse[] findBestTransitionConnectors(
            PathfindingService.Waypoint origin, PathfindingService.Waypoint dest,
            List<IndoorDirectionsController.PoiResponse> startConnectors,
            List<IndoorDirectionsController.PoiResponse> endConnectors,
            boolean avoidStairs) {

        IndoorDirectionsController.PoiResponse[] best = null;

        if (!avoidStairs) {
            best = getClosestConnectorPair(origin, dest, startConnectors, endConnectors, KEYWORD_STAIRS_LOWER);
        }

        if (best == null) {
            best = getClosestConnectorPair(origin, dest, startConnectors, endConnectors, STR_ELEVATOR_LOWER);
        }

        return best;
    }

    private IndoorDirectionsController.PoiResponse[] getClosestConnectorPair(
            PathfindingService.Waypoint origin, PathfindingService.Waypoint dest,
            List<IndoorDirectionsController.PoiResponse> startConnectors,
            List<IndoorDirectionsController.PoiResponse> endConnectors,
            String type) {

        IndoorDirectionsController.PoiResponse bestStart = null;
        IndoorDirectionsController.PoiResponse bestEnd = null;
        double minDistance = Double.MAX_VALUE;

        for (var s : startConnectors) {
            if (s.getType() == null || !s.getType().toLowerCase().contains(type)) continue;
            for (var e : endConnectors) {
                if (e.getType() == null || !e.getType().toLowerCase().contains(type)) continue;

                double d1 = Math.hypot(s.getX() - origin.x, s.getY() - origin.y);
                double d2 = Math.hypot(dest.x - e.getX(), dest.y - e.getY());
                if (d1 + d2 < minDistance) {
                    minDistance = d1 + d2;
                    bestStart = s;
                    bestEnd = e;
                }
            }
        }
        return (bestStart != null && bestEnd != null) ? new IndoorDirectionsController.PoiResponse[]{bestStart, bestEnd} : null;
    }

    private List<IndoorDirectionsController.PoiResponse> filterPois(
            List<IndoorDirectionsController.PoiResponse> all,
            AccessibilityRoutingStrategy strategy
    ) {
        if (all == null || all.isEmpty()) return Collections.emptyList();

        List<IndoorDirectionsController.PoiResponse> valid = new ArrayList<>();

        for (IndoorDirectionsController.PoiResponse p : all) {
            String type = (p == null || p.getType() == null) ? "" : p.getType().toLowerCase();

            if (type.contains(STR_ELEVATOR_LOWER)
                    || (strategy.allowsStairs() && type.contains(KEYWORD_STAIRS_LOWER))) {
                valid.add(p);
            }
        }
        return valid;
    }

    private List<IndoorDirectionResponse.RoutePoint> calculateRoute(
            String buildingId, String originRoomId,
            String destinationRoomId, String floor, AccessibilityRoutingStrategy strategy) {

        String planId = convertBuildingIdForPathfinding(buildingId, floor);

        PathfindingService.Waypoint sCoord = resolvePoint(planId, originRoomId);
        PathfindingService.Waypoint eCoord = resolvePoint(planId, destinationRoomId);

        if (sCoord == null || eCoord == null) return new ArrayList<>();

        return buildRoute(planId,
                new FloorPlanData.Point(sCoord.x, sCoord.y),
                new FloorPlanData.Point(eCoord.x, eCoord.y),
                originRoomId, destinationRoomId,
                strategy);
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
            String origin,
            String destination,
            List<IndoorDirectionResponse.RoutePoint> routePoints,
            String originFloor,
            String destinationFloor,
            String usedTransition
    ) {
        List<IndoorRouteStep> steps = new ArrayList<>();
        if (routePoints == null || routePoints.size() < 2) return steps;

        int transitionIndex = findTransitionIndex(routePoints);

        if (transitionIndex >= 0) {
            List<IndoorDirectionResponse.RoutePoint> firstLeg = new ArrayList<>(routePoints.subList(0, transitionIndex));
            List<IndoorDirectionResponse.RoutePoint> secondLeg = new ArrayList<>(routePoints.subList(
                    Math.min(transitionIndex + 1, routePoints.size() - 1), routePoints.size()));

            addMovementSteps(steps, firstLeg, originFloor, origin, false);
            steps.add(createTransitionStep(originFloor, destinationFloor, usedTransition));
            addMovementSteps(steps, secondLeg, destinationFloor, destination, true);
        } else {
            addMovementSteps(steps, routePoints, originFloor, origin, false);
        }

        steps.add(new IndoorRouteStep(
                "Arrive at " + destination,
                "0 m",
                "0 sec",
                IndoorManeuverType.ENTER_ROOM,
                destinationFloor,
                destination,
                null
        ));

        return steps;
    }

    private void addMovementSteps(
            List<IndoorRouteStep> steps,
            List<IndoorDirectionResponse.RoutePoint> routePoints,
            String floor,
            String referenceLabel,
            boolean afterTransition
    ) {
        if (routePoints == null || routePoints.size() < 2) return;

        List<Integer> decisionIndices = new ArrayList<>();
        List<IndoorManeuverType> decisionManeuvers = new ArrayList<>();
        decisionIndices.add(0);
        decisionManeuvers.add(IndoorManeuverType.STRAIGHT);

        findDecisionPoints(routePoints, decisionIndices, decisionManeuvers);
        createStepsFromDecisions(steps, routePoints, decisionIndices, decisionManeuvers, floor, referenceLabel, afterTransition);
    }

    private void findDecisionPoints(
            List<IndoorDirectionResponse.RoutePoint> routePoints,
            List<Integer> decisionIndices,
            List<IndoorManeuverType> decisionManeuvers) {

        int anchorIdx = 0;
        for (int i = 1; i < routePoints.size() - 1; i++) {
            double segDist = sumSegmentDistance(routePoints, anchorIdx, i);
            if (segDist >= MIN_SEGMENT_PX) {
                IndoorManeuverType turn = classifyTurnAtPoint(
                        routePoints.get(anchorIdx),
                        routePoints.get(i),
                        routePoints.get(i + 1));

                boolean isNewDecision = turn != IndoorManeuverType.STRAIGHT
                        && (decisionManeuvers.isEmpty()
                                || decisionManeuvers.get(decisionManeuvers.size() - 1) != turn);
                if (isNewDecision) {
                    decisionIndices.add(i);
                    decisionManeuvers.add(turn);
                    anchorIdx = i;
                }
            }
        }
    }

    private void createStepsFromDecisions(
            List<IndoorRouteStep> steps,
            List<IndoorDirectionResponse.RoutePoint> routePoints,
            List<Integer> decisionIndices,
            List<IndoorManeuverType> decisionManeuvers,
            String floor,
            String referenceLabel,
            boolean afterTransition) {

        for (int i = 0; i < decisionIndices.size(); i++) {
            int segStart = decisionIndices.get(i);
            int segEnd = (i + 1 < decisionIndices.size())
                    ? decisionIndices.get(i + 1)
                    : routePoints.size() - 1;

            double pxDist = sumSegmentDistance(routePoints, segStart, segEnd);
            if (pxDist <= 0.5d) continue;

            double meters = pxDist * PIXELS_TO_METERS;
            boolean isFirst = (i == 0);
            IndoorManeuverType maneuver = decisionManeuvers.get(i);

            String instruction = buildMovementInstruction(
                    maneuver, referenceLabel, isFirst, afterTransition);

            steps.add(new IndoorRouteStep(
                    instruction,
                    formatFinalDistance(meters),
                    formatFinalDuration(meters),
                    maneuver, floor, null, null));
        }

        if (steps.isEmpty()) {
            double totalPx = sumSegmentDistance(routePoints, 0, routePoints.size() - 1);
            if (totalPx > 0.5d) {
                double meters = totalPx * PIXELS_TO_METERS;
                steps.add(new IndoorRouteStep(
                        afterTransition
                                ? "Walk straight down the hallway"
                                : "Walk straight to " + referenceLabel,
                        formatFinalDistance(meters),
                        formatFinalDuration(meters),
                        IndoorManeuverType.STRAIGHT, floor, null, null));
            }
        }
    }

    private IndoorRouteStep createTransitionStep(
            String originFloor,
            String destinationFloor,
            String usedTransition
    ) {
        boolean goingUp = parseFloorNumber(destinationFloor) > parseFloorNumber(originFloor);
        boolean useElevator = STR_ELEVATOR.equals(usedTransition);

        IndoorManeuverType maneuver;
        if (useElevator && goingUp) {
            maneuver = IndoorManeuverType.ELEVATOR_UP;
        } else if (useElevator) {
            maneuver = IndoorManeuverType.ELEVATOR_DOWN;
        } else if (goingUp) {
            maneuver = IndoorManeuverType.STAIRS_UP;
        } else {
            maneuver = IndoorManeuverType.STAIRS_DOWN;
        }

        String instruction;
        if (useElevator) {
            instruction = goingUp
                    ? "Take the elevator up to floor " + destinationFloor
                    : "Take the elevator down to floor " + destinationFloor;
        } else {
            instruction = goingUp
                    ? "Take the stairs up to floor " + destinationFloor
                    : "Take the stairs down to floor " + destinationFloor;
        }

        return new IndoorRouteStep(
                instruction,
                "0 m",
                "30 sec",
                maneuver,
                originFloor,
                null,
                null
        );
    }

    private String buildMovementInstruction(
            IndoorManeuverType maneuver,
            String referenceLabel,
            boolean isFirstInstruction,
            boolean afterTransition
    ) {
        if (isFirstInstruction) {
            if (afterTransition) {
                return "Walk straight down the hallway";
            }
            return "Walk straight to " + referenceLabel;
        }

        return switch (maneuver) {
            case TURN_LEFT -> "Turn left and continue";
            case TURN_RIGHT -> "Turn right and continue";
            case TURN_AROUND -> "Turn around";
            default -> "Walk straight";
        };
    }

    private int findTransitionIndex(List<IndoorDirectionResponse.RoutePoint> routePoints) {
        if (routePoints == null) return -1;
        for (int i = 0; i < routePoints.size(); i++) {
            IndoorDirectionResponse.RoutePoint point = routePoints.get(i);
            if (point.getLabel() != null && point.getLabel().startsWith("TRANSITION_")) {
                return i;
            }
        }
        return -1;
    }

    private double sumSegmentDistance(
            List<IndoorDirectionResponse.RoutePoint> routePoints,
            int startSegment,
            int endSegmentExclusive
    ) {
        double distance = 0d;
        for (int i = startSegment; i < endSegmentExclusive; i++) {
            IndoorDirectionResponse.RoutePoint start = routePoints.get(i);
            IndoorDirectionResponse.RoutePoint end = routePoints.get(i + 1);
            double dx = end.getX() - start.getX();
            double dy = end.getY() - start.getY();
            distance += Math.sqrt((dx * dx) + (dy * dy));
        }
        return distance;
    }

    private IndoorManeuverType classifyTurnAtPoint(
            IndoorDirectionResponse.RoutePoint previous,
            IndoorDirectionResponse.RoutePoint current,
            IndoorDirectionResponse.RoutePoint next
    ) {
        double ax = current.getX() - previous.getX();
        double ay = current.getY() - previous.getY();
        double bx = next.getX() - current.getX();
        double by = next.getY() - current.getY();

        double lenA = Math.sqrt(ax * ax + ay * ay);
        double lenB = Math.sqrt(bx * bx + by * by);
        if (lenA < 0.001d || lenB < 0.001d) return IndoorManeuverType.STRAIGHT;

        double dot = ax * bx + ay * by;
        double cosAngle = Math.max(-1d, Math.min(1d, dot / (lenA * lenB)));
        double angleDeg = Math.toDegrees(Math.acos(cosAngle));

        if (angleDeg < TURN_THRESHOLD_DEG) return IndoorManeuverType.STRAIGHT;

        double cross = ax * by - ay * bx;

        if (angleDeg >= UTURN_THRESHOLD_DEG) return IndoorManeuverType.TURN_AROUND;
        if (cross > 0) return IndoorManeuverType.TURN_RIGHT;
        return IndoorManeuverType.TURN_LEFT;
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
        if ("H".equals(buildingId) || PREFIX_HALL.equals(buildingId)) {
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
        return new ArrayList<>(getRoomPoints(bId, f).stream().map(r -> r.getId()).toList());
    }

    public List<IndoorDirectionsController.WaypointResponse> getWaypoints(String bId, String f) {
        String pId = convertBuildingIdForPathfinding(bId, f);
        return pathfindingService.getWaypointsForBuilding(pId).stream()
                .map(w -> new IndoorDirectionsController.WaypointResponse(w.x, w.y, w.id)).toList();
    }

    public List<IndoorDirectionsController.RoomPointResponse> getRoomPoints(String bId, String f) {
        String pId = convertBuildingIdForPathfinding(bId, f);
        PathfindingService.Waypoint helper = new PathfindingService.Waypoint(0, 0, STR_HELPER);
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
        return new PathfindingService.Waypoint(0,0,STR_HELPER).getPoisForBuilding(pId);
    }

    private List<IndoorDirectionResponse.RoutePoint> buildRoute(
            String pathfindingBuildingId,
            FloorPlanData.Point originPoint, FloorPlanData.Point destPoint,
            String originId, String destId, AccessibilityRoutingStrategy strategy) {

        pathfindingService.setBuilding(pathfindingBuildingId);
        PathfindingService.Waypoint startWp = pathfindingService.findNearestWaypoint(originPoint.getX(), originPoint.getY());
        PathfindingService.Waypoint endWp = pathfindingService.findNearestWaypoint(destPoint.getX(), destPoint.getY());

        if (startWp == null || endWp == null) return new ArrayList<>();

        List<PathfindingService.Waypoint> waypointPath =
                pathfindingService.findPathThroughWaypoints(startWp, endWp, strategy);

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
        try { return Integer.parseInt(floor.replaceAll("[^0-9-]", "")); } catch (Exception e) { return 0; }
    }

    private PathfindingService.Waypoint resolvePoint(String planId, String id) {
        if (id == null) return null;

        PathfindingService.Waypoint helper = new PathfindingService.Waypoint(0, 0, STR_HELPER);

        // 1) Try rooms
        PathfindingService.Waypoint w = helper.getRoomCoordinate(planId, id);
        if (w != null) return w;

        // 2) Try POIs
        List<IndoorDirectionsController.PoiResponse> pois = helper.getPoisForBuilding(planId);
        for (IndoorDirectionsController.PoiResponse p : pois) {
            if (p != null && p.getId() != null && p.getId().equals(id)) {
                return new PathfindingService.Waypoint(p.getX(), p.getY(), p.getId());
            }
        }

        return null;
    }

    private String detectTransitionType(List<IndoorDirectionResponse.RoutePoint> routePoints) {
        if (routePoints == null) return null;

        for (IndoorDirectionResponse.RoutePoint rp : routePoints) {
            String label = rp.getLabel();
            if (label == null) continue;

            if (label.startsWith("TRANSITION_ELEVATOR")) return STR_ELEVATOR;
            if (label.startsWith("TRANSITION_STAIRS"))   return TRANSITION_TYPE_STAIRS;
        }
        return null;
    }
}