package com.soen390.backend.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Room data is loaded from JSON files i
 */
public class FloorPlanData {

    private static final Logger log = LoggerFactory.getLogger(FloorPlanData.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private Map<String, Point> roomPoints;
    private Map<String, java.util.List<String>> roomEntranceGroups;
    private String buildingId;
    private String floor;

    public FloorPlanData(String buildingId, String floor) {
        this.buildingId = buildingId;
        this.floor = floor;
        this.roomPoints = new HashMap<>();
        this.roomEntranceGroups = new HashMap<>();

        loadRoomsFromJson(buildingId);
        buildRoomEntranceGroups();
    }

    /**
     * Load room coordinates from /floorplans/{buildingId}.json
     */
    private void loadRoomsFromJson(String buildingId) {
        String path = "floorplans/" + buildingId + ".json";
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                log.warn("No floor plan JSON found at {}", path);
                return;
            }
            JsonNode root = MAPPER.readTree(is);

            // Verify the floor matches what's in the JSON
            JsonNode floorNode = root.get("floor");
            if (floorNode != null && !floorNode.asText().equals(this.floor)) {
                log.warn("Floor mismatch: requested {} but JSON has {} in {}", this.floor, floorNode.asText(), path);
                return;
            }

            JsonNode roomsNode = root.get("rooms");
            if (roomsNode == null || !roomsNode.isObject()) {
                log.warn("No 'rooms' object in {}", path);
                return;
            }
            Iterator<Map.Entry<String, JsonNode>> fields = roomsNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String roomId = entry.getKey();
                JsonNode coords = entry.getValue();
                double x = coords.get("x").asDouble();
                double y = coords.get("y").asDouble();
                roomPoints.put(roomId, new Point(x, y));
            }
            log.info("Loaded {} rooms from {}", roomPoints.size(), path);
        } catch (Exception e) {
            log.error("Failed to load floor plan data from {}", path, e);
        }
    }

    /**
     * Groups rooms with multiple entrances (e.g. LB-261-1, LB-261-2 → LB-261)
     */
    private void buildRoomEntranceGroups() {
        for (String roomId : roomPoints.keySet()) {
            int lastDashIndex = roomId.lastIndexOf('-');
            if (lastDashIndex > 0) {
                String baseRoomId = roomId.substring(0, lastDashIndex);
                if (!baseRoomId.contains("-")) continue;
                String possibleSuffix = roomId.substring(lastDashIndex + 1);
                try {
                    Integer.parseInt(possibleSuffix);
                    roomEntranceGroups.computeIfAbsent(baseRoomId, k -> new java.util.ArrayList<>()).add(roomId);
                } catch (NumberFormatException e) {
                    // Not a numeric suffix — skip
                }
            }
        }

        for (String baseRoomId : new java.util.ArrayList<>(roomEntranceGroups.keySet())) {
            if (roomPoints.containsKey(baseRoomId)) {
                roomEntranceGroups.get(baseRoomId).add(0, baseRoomId);
            }
        }
    }

    public String getBaseRoomId(String roomId) {
        for (Map.Entry<String, java.util.List<String>> entry : roomEntranceGroups.entrySet()) {
            if (entry.getValue().contains(roomId)) {
                return entry.getKey();
            }
        }
        return roomId;
    }

    public java.util.Set<String> getBaseRoomIds() {
        java.util.Set<String> baseRoomIds = new java.util.HashSet<>();
        for (String roomId : roomPoints.keySet()) {
            baseRoomIds.add(getBaseRoomId(roomId));
        }
        return baseRoomIds;
    }

    /**
     * Resolve a base room ID to the closest entrance relative to a reference point.
     */
    public String resolveToClosestEntrance(String baseRoomId, double referenceX, double referenceY) {
        java.util.List<String> entrances = roomEntranceGroups.get(baseRoomId);
        if (entrances == null || entrances.isEmpty()) {
            return baseRoomId;
        }
        String closestEntrance = baseRoomId;
        double minDistance = Double.MAX_VALUE;
        Point referencePoint = new Point(referenceX, referenceY);

        for (String entranceId : entrances) {
            Point entrancePoint = roomPoints.get(entranceId);
            if (entrancePoint != null) {
                double distance = referencePoint.distanceTo(entrancePoint);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEntrance = entranceId;
                }
            }
        }
        return closestEntrance;
    }
    
    public Map<String, Point> getRoomPoints() {
        return roomPoints;
    }
    
    public String getBuildingId() {
        return buildingId;
    }
    
    public String getFloor() {
        return floor;
    }

    public Map<String, java.util.List<String>> getRoomEntranceGroups() {
        return roomEntranceGroups;
    }

    public static class Point {
        private double x;
        private double y;
        
        public Point(double x, double y) {
            this.x = x;
            this.y = y;
        }
        
        public double getX() { return x; }
        public double getY() { return y; }
        
        public double distanceTo(Point other) {
            double dx = x - other.x;
            double dy = y - other.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }
    
    public static class PointOfInterest {
        public final double x;
        public final double y;
        public final String id;
        public final String displayName;
        public final String type;

        public PointOfInterest(double x, double y, String id, String displayName, String type) {
            this.x = x; this.y = y; this.id = id; this.displayName = displayName; this.type = type;
        }
    }

    private static String getPoiType(String roomId) {
        String lower = roomId.toLowerCase();
        if (lower.startsWith("bathroom-men"))    return "bathroom-men";
        if (lower.startsWith("bathroom-women"))  return "bathroom-women";
        if (lower.startsWith("bathroom"))        return "bathroom-men";
        if (lower.startsWith("elevator"))        return "elevator";
        if (lower.startsWith("stairs-down"))     return "stairs-down";
        if (lower.startsWith("stairs-up"))       return "stairs-up";
        if (lower.startsWith("stairs-underground")) return "stairs";
        if (lower.startsWith("stairs"))          return "stairs";
        if (lower.startsWith("emergency-exit"))  return "emergency-exit";
        if (lower.startsWith("emergency-stairs"))return "emergency-exit";
        if (lower.startsWith("maisonneuve"))     return "emergency-exit";
        if (lower.startsWith("bishop"))          return "emergency-exit";
        if (lower.startsWith("mckay"))           return "emergency-exit";
        if (lower.startsWith("waterfountain"))   return "water-fountain";
        if (lower.startsWith("computer-station"))return "computer-station";
        if (lower.startsWith("computer-area"))   return "computer-station";
        if (lower.startsWith("study-area"))      return "study-area";
        if (lower.startsWith("sitting-area"))    return "study-area";
        if (lower.startsWith("tabling-area"))    return "study-area";
        if (lower.startsWith("entrance"))        return "entrance-exit";
        if (lower.startsWith("metro"))           return "entrance-exit";
        if (lower.startsWith("couch-area"))      return "study-area";
        if (lower.startsWith("stand"))           return "study-area";
        if (lower.startsWith("printer"))         return "printer";
        if (lower.startsWith("shelve"))          return "bookshelf";
        if (lower.startsWith("disability"))      return "entrance-exit";
        if (lower.startsWith("art-showcase"))    return "entrance-exit";
        if (lower.contains("emergency-exit"))    return "emergency-exit";
        if (lower.contains("bathroom-men"))      return "bathroom-men";
        if (lower.contains("bathroom-women"))    return "bathroom-women";
        if (lower.contains("bathroom"))          return "bathroom-men";
        if (lower.contains("elevator"))          return "elevator";
        if (lower.contains("stairs"))            return "stairs";
        return null;
    }

    /**
     * Returns all POIs for this floor.
     */
    public java.util.List<PointOfInterest> getPointsOfInterest() {
        java.util.List<PointOfInterest> pois = new java.util.ArrayList<>();
        for (Map.Entry<String, Point> entry : roomPoints.entrySet()) {
            String roomId = entry.getKey();
            String type = getPoiType(roomId);
            if (type == null) continue;
            String displayName = getBaseRoomId(roomId);
            Point p = entry.getValue();
            pois.add(new PointOfInterest(p.getX(), p.getY(), roomId, displayName, type));
        }
        return pois;
    }
}
