package com.soen390.backend.controller;

import com.soen390.backend.exception.IndoorResourceNotFoundException;
import com.soen390.backend.exception.InvalidIndoorRequestException;
import com.soen390.backend.object.IndoorDirectionResponse;
import com.soen390.backend.service.IndoorDirectionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/directions/indoor")
public class IndoorDirectionsController {

    private static final String PARAM_BUILDING_ID = "buildingId";
    private static final String FLOOR_LABEL = " floor '";

    private static final Set<String> VALID_BUILDING_PREFIXES = Set.of(
            "Hall-", "VL-", "LB-", "MB-", "CC-", "VE-" );
    private static final Set<String> VALID_SHORT_CODES = Set.of(
            "H", "VL", "LB", "MB", "CC", "VE");

    private final IndoorDirectionService indoorDirectionService;

    public IndoorDirectionsController(IndoorDirectionService indoorDirectionService) {
        this.indoorDirectionService = indoorDirectionService;
    }

    @GetMapping
    public IndoorDirectionResponse getIndoorDirections(
            @RequestParam String buildingId,
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(required = false) String originFloor,
            @RequestParam(required = false) String destinationFloor) {

        validateNotBlank(buildingId, PARAM_BUILDING_ID);
        validateNotBlank(origin, "origin");
        validateNotBlank(destination, "destination");
        validateBuildingId(buildingId);

        String safeBuildingId = sanitize(buildingId);
        String safeOrigin = sanitize(origin);
        String safeDestination = sanitize(destination);
        String safeOriginFloor = sanitize(originFloor);
        String safeDestFloor = sanitize(destinationFloor);

        if (safeOrigin.trim().equalsIgnoreCase(safeDestination.trim())) {
            throw new InvalidIndoorRequestException(
                    "origin and destination must be different.");
        }

        IndoorDirectionResponse response = indoorDirectionService.getIndoorDirections(
                safeBuildingId, safeOrigin, safeDestination, safeOriginFloor, safeDestFloor);

        if (response.getRoutePoints() == null || response.getRoutePoints().isEmpty()) {
            throw new IndoorResourceNotFoundException(
                    "No route found from '" + safeOrigin + "' to '" + safeDestination
                    + "' in building '" + safeBuildingId + "'.");
        }

        return response;
    }
    
    @GetMapping("/rooms")
    public List<String> getAvailableRooms(
            @RequestParam String buildingId,
            @RequestParam(required = false) String floor) {

        validateNotBlank(buildingId, PARAM_BUILDING_ID);
        validateBuildingId(buildingId);

        String safeBuildingId = sanitize(buildingId);
        String safeFloor = sanitize(floor);

        List<String> rooms = indoorDirectionService.getAvailableRooms(safeBuildingId, safeFloor);
        if (rooms.isEmpty()) {
            throw new IndoorResourceNotFoundException(
                    "No rooms found for building '" + safeBuildingId
                    + "'" + (safeFloor != null ? FLOOR_LABEL + safeFloor + "'" : "") + ".");
        }
        return rooms;
    }
    
    @GetMapping("/waypoints")
    public List<WaypointResponse> getWaypoints(
            @RequestParam String buildingId,
            @RequestParam(required = false) String floor) {

        validateNotBlank(buildingId, PARAM_BUILDING_ID);
        validateBuildingId(buildingId);

        String safeBuildingId = sanitize(buildingId);
        String safeFloor = sanitize(floor);

        List<WaypointResponse> waypoints = indoorDirectionService.getWaypoints(safeBuildingId, safeFloor);
        if (waypoints.isEmpty()) {
            throw new IndoorResourceNotFoundException(
                    "No waypoints found for building '" + safeBuildingId
                    + "'" + (safeFloor != null ? FLOOR_LABEL + safeFloor + "'" : "") + ".");
        }
        return waypoints;
    }
    
    @GetMapping("/room-points")
    public List<RoomPointResponse> getRoomPoints(
            @RequestParam String buildingId,
            @RequestParam(required = false) String floor) {

        validateNotBlank(buildingId, PARAM_BUILDING_ID);
        validateBuildingId(buildingId);

        String safeBuildingId = sanitize(buildingId);
        String safeFloor = sanitize(floor);

        List<RoomPointResponse> roomPoints = indoorDirectionService.getRoomPoints(safeBuildingId, safeFloor);
        if (roomPoints.isEmpty()) {
            throw new IndoorResourceNotFoundException(
                    "No room points found for building '" + safeBuildingId
                    + "'" + (safeFloor != null ? FLOOR_LABEL + safeFloor + "'" : "") + ".");
        }
        return roomPoints;
    }

    @GetMapping("/pois")
    public List<PoiResponse> getPointsOfInterest(
            @RequestParam String buildingId,
            @RequestParam(required = false) String floor) {

        validateNotBlank(buildingId, PARAM_BUILDING_ID);
        validateBuildingId(buildingId);

        return indoorDirectionService.getPointsOfInterest(sanitize(buildingId), sanitize(floor));
    }

    /** Strip newlines and control characters to prevent log injection. */
    private static String sanitize(String input) {
        if (input == null) return null;
        return input.replaceAll("[\\r\\n\\t]", "");
    }

    private void validateNotBlank(String value, String paramName) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidIndoorRequestException(
                    "'" + paramName + "' must not be blank.");
        }
    }

    private void validateBuildingId(String buildingId) {
        if (VALID_SHORT_CODES.contains(buildingId)) {
            return;
        }
        for (String prefix : VALID_BUILDING_PREFIXES) {
            if (buildingId.startsWith(prefix)) {
                return;
            }
        }
        throw new InvalidIndoorRequestException(
                "Unknown building ID '" + buildingId
                + "'. Valid prefixes: " + VALID_BUILDING_PREFIXES
                + ", valid short codes: " + VALID_SHORT_CODES + ".");
    }
    
    public static class PoiResponse {
        public double x;
        public double y;
        public String id;    // this id is to be able to differentiate between the different same name POIs     
        public String displayName; 
        public String type;       
        
        public PoiResponse(double x, double y, String id, String displayName, String type) {
            this.x = x;
            this.y = y;
            this.id = id;
            this.displayName = displayName;
            this.type = type;
        }
    }

    public static class WaypointResponse {
        public double x;
        public double y;
        public String id;
        
        public WaypointResponse(double x, double y, String id) {
            this.x = x;
            this.y = y;
            this.id = id;
        }
    }
    
    public static class RoomPointResponse {
        public double x;
        public double y;
        public String id;
        
        public RoomPointResponse(double x, double y, String id) {
            this.x = x;
            this.y = y;
            this.id = id;
        }
    }
}
