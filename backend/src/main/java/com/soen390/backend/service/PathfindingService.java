package com.soen390.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jgrapht.Graph;
import org.jgrapht.GraphPath;
import org.jgrapht.alg.connectivity.ConnectivityInspector;
import org.jgrapht.alg.shortestpath.DijkstraShortestPath;
import org.jgrapht.graph.DefaultWeightedEdge;
import org.jgrapht.graph.SimpleWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;

/**
 * Indoor pathfinding service using JGraphT.
 *
 * Each floor is modeled as a weighted graph where:
 *   - Vertices = pre-defined waypoints loaded from JSON floor plan files
 *   - Edges    = valid walkable connections constrained to corridor-like movement
 *   - Weights  = Euclidean distance between waypoints
 *
 */
@Service
public class PathfindingService {
    
    private static final Logger log = LoggerFactory.getLogger(PathfindingService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Map<String, List<Waypoint>> WAYPOINTS = new HashMap<>();
    private static final Map<String, BuildingConfig> CONFIGS = new HashMap<>();

   
    private static final String[] FLOOR_PLAN_IDS = {
        "Hall-8", "Hall-9", "Hall-2", "Hall-1",
        "VL-1", "VL-2", "VE-1","VE-2",
        "LB-2", "LB-3", "LB-4", "LB-5",
        "MB-S2", "MB-1", "CC-1"
    };

    static {
        for (String buildingId : FLOOR_PLAN_IDS) {
            loadBuildingFromJson(buildingId);
        }
    }

    /**
     * Load waypoints and pathfinding config from /floorplans/{buildingId}.json
     */
    private static void loadBuildingFromJson(String buildingId) {
        String path = "floorplans/" + buildingId + ".json";
        try (InputStream is = PathfindingService.class.getClassLoader().getResourceAsStream(path)) {
            if (is == null) {
                log.warn("No floor plan JSON found at {}", path);
                return;
            }
            JsonNode root = MAPPER.readTree(is);

            // Load waypoints
            JsonNode waypointsNode = root.get("waypoints");
            if (waypointsNode != null && waypointsNode.isArray()) {
                List<Waypoint> waypoints = new ArrayList<>();
                for (JsonNode wp : waypointsNode) {
                    double x = wp.get("x").asDouble();
                    double y = wp.get("y").asDouble();
                    String id = wp.get("id").asText();
                    waypoints.add(new Waypoint(x, y, id));
                }
                WAYPOINTS.put(buildingId, waypoints);
                log.info("Loaded {} waypoints for {}", waypoints.size(), buildingId);
            }

            // Load pathfinding config
            JsonNode configNode = root.get("pathfindingConfig");
            if (configNode != null) {
                double searchRadius = configNode.get("searchRadius").asDouble();
                double alignThreshold = configNode.get("alignThreshold").asDouble();
                int maxNeighbors = configNode.get("maxNeighbors").asInt();
                boolean strictAlignment = configNode.get("strictAlignment").asBoolean();
                CONFIGS.put(buildingId, new BuildingConfig(searchRadius, alignThreshold, maxNeighbors, strictAlignment));
            }
        } catch (Exception e) {
            log.error("Failed to load floor plan data from {}", path, e);
        }
    }

    private record BuildingConfig(
            double searchRadius,
            double alignThreshold,
            int maxNeighbors,
            boolean strictAlignment
    ) {
        static BuildingConfig forBuilding(String buildingId) {
            BuildingConfig config = CONFIGS.get(buildingId);
            if (config != null) return config;
           
            return new BuildingConfig(150.0, 20.0, 0, false);
        }
    }

    private enum Alignment {
        PERFECT(0, 250.0),
        NEAR_PERFECT(1, 250.0),
        MOSTLY(2, 400.0),
        LOOSE(3, 400.0),
        INVALID(-1, 0);

        final int priority;
        final double maxDist;

        Alignment(int priority, double maxDist) {
            this.priority = priority;
            this.maxDist = maxDist;
        }
    }

    private String currentBuildingId = "";
    private final Map<String, Graph<Waypoint, DefaultWeightedEdge>> graphs = new HashMap<>();

    public PathfindingService() {
        for (String id : WAYPOINTS.keySet()) {
            graphs.put(id, buildGraph(id));
        }
    }

    public void setBuilding(String buildingId) {
        this.currentBuildingId = buildingId;
    }
    
    public Waypoint findNearestWaypoint(double x, double y) {
        List<Waypoint> wps = WAYPOINTS.getOrDefault(currentBuildingId, List.of());
        Waypoint nearest = null;
        double minDist = Double.MAX_VALUE;
        for (Waypoint wp : wps) {
            double d = wp.distanceTo(x, y);
            if (d < minDist) {
                minDist = d;
                nearest = wp;
            }
        }
        return nearest;
    }

    /** Strip newlines and control characters to prevent log injection. */
    private static String sanitize(String input) {
        if (input == null) return "null";
        return input.replaceAll("[\\r\\n\\t]", "_");
    }

    public List<Waypoint> findPathThroughWaypoints(Waypoint start, Waypoint end) {
        if (start == null || end == null) return Collections.emptyList();

        Graph<Waypoint, DefaultWeightedEdge> graph = graphs.get(currentBuildingId);
        if (graph == null || !graph.containsVertex(start) || !graph.containsVertex(end)) {
            log.error("Graph missing or vertices not found for {}", sanitize(currentBuildingId));
            return Collections.emptyList();
        }

        GraphPath<Waypoint, DefaultWeightedEdge> path =
                new DijkstraShortestPath<>(graph).getPath(start, end);

        if (path == null) {
            log.error("No path found between waypoints: {} -> {}", sanitize(start.id), sanitize(end.id));
            return Collections.emptyList();
        }

        return path.getVertexList();
    }

    public List<Waypoint> getAllWaypoints() {
        return new ArrayList<>(WAYPOINTS.getOrDefault(currentBuildingId, List.of()));
    }

    public List<Waypoint> getWaypointsForBuilding(String buildingId) {
        return new ArrayList<>(WAYPOINTS.getOrDefault(buildingId, List.of()));
    }

    public Waypoint findWaypointById(String waypointId) {
        List<Waypoint> wps = WAYPOINTS.getOrDefault(currentBuildingId, List.of());
        for (Waypoint wp : wps) {
            if (wp.id.equals(waypointId)) return wp;
        }
        return null;
    }

    private Graph<Waypoint, DefaultWeightedEdge> buildGraph(String buildingId) {
        SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph =
                new SimpleWeightedGraph<>(DefaultWeightedEdge.class);
        List<Waypoint> waypoints = WAYPOINTS.getOrDefault(buildingId, List.of());
        BuildingConfig config = BuildingConfig.forBuilding(buildingId);

        waypoints.forEach(graph::addVertex);

        for (Waypoint wp : waypoints) {
            addEdgesFor(graph, wp, waypoints, config);
        }

        ensureConnectivity(graph, config);

        return graph;
    }

    /**
     * Add edges from a waypoint to valid neighbors.
     * LB buildings use tiered alignment with max-neighbor limit;
     * other buildings use basic horizontal/vertical alignment.
     */
    record Candidate(Waypoint target, double dist, int priority) {}

    private void addEdgesFor(
            SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph,
            Waypoint wp, List<Waypoint> all, BuildingConfig config) {

        List<Candidate> candidates = findCandidates(graph, wp, all, config);

        candidates.sort(Comparator.comparingInt(Candidate::priority)
                .thenComparingDouble(Candidate::dist));

        int limit = config.maxNeighbors > 0 ? config.maxNeighbors : candidates.size();
        addTopCandidateEdges(graph, wp, candidates, limit);
    }

    private List<Candidate> findCandidates(
            SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph,
            Waypoint wp, List<Waypoint> all, BuildingConfig config) {

        List<Candidate> candidates = new ArrayList<>();
        for (Waypoint other : all) {
            if (wp.equals(other) || graph.containsEdge(wp, other)) continue;
            Candidate c = config.strictAlignment
                    ? evaluateStrict(wp, other, config)
                    : evaluateFlexible(wp, other, config);
            if (c != null) {
                candidates.add(c);
            }
        }
        return candidates;
    }

    private Candidate evaluateStrict(Waypoint wp, Waypoint other, BuildingConfig config) {
        double dist = wp.distanceTo(other);
        double dx = Math.abs(wp.x - other.x);
        double dy = Math.abs(wp.y - other.y);
        Alignment align = classify(dx, dy, config.alignThreshold);
        if (align != Alignment.INVALID && dist <= align.maxDist) {
            return new Candidate(other, dist, align.priority);
        }
        return null;
    }

    private Candidate evaluateFlexible(Waypoint wp, Waypoint other, BuildingConfig config) {
        double dist = wp.distanceTo(other);
        if (dist > config.searchRadius) return null;
        double dx = Math.abs(wp.x - other.x);
        double dy = Math.abs(wp.y - other.y);
        boolean horiz = dy <= config.alignThreshold && dx > config.alignThreshold;
        boolean vert = dx <= config.alignThreshold && dy > config.alignThreshold;
        return (horiz || vert) ? new Candidate(other, dist, 0) : null;
    }

    private void addTopCandidateEdges(
            SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph,
            Waypoint wp, List<Candidate> candidates, int limit) {

        int added = 0;
        for (Candidate c : candidates) {
            if (added >= limit) break;
            if (graph.containsEdge(wp, c.target)) continue;
            DefaultWeightedEdge edge = graph.addEdge(wp, c.target);
            if (edge != null) {
                graph.setEdgeWeight(edge, c.dist);
                added++;
            }
        }
    }

    private static Alignment classify(double dx, double dy, double strict) {
        Alignment result = classifyAxis(dx, dy, strict);
        if (result != Alignment.INVALID) {
            return result;
        }
        return classifyAxis(dy, dx, strict);
    }

    /** Check if the minor axis is within tolerance and the major axis is dominant enough. */
    private static Alignment classifyAxis(double minor, double major, double strict) {
        if (minor <= strict && major > strict)                      return Alignment.PERFECT;
        if (minor <= 10 && major > minor * 3 && major > strict)    return Alignment.NEAR_PERFECT;
        if (minor <= 25 && major > minor * 5 && major > strict)    return Alignment.MOSTLY;
        if (minor <= 40 && major > minor * 3 && major > strict)    return Alignment.LOOSE;
        return Alignment.INVALID;
    }

    private void ensureConnectivity(
            SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph, BuildingConfig config) {

        ConnectivityInspector<Waypoint, DefaultWeightedEdge> inspector =
                new ConnectivityInspector<>(graph);
        List<Set<Waypoint>> components = inspector.connectedSets();
        if (components.size() <= 1) return;

        Set<Waypoint> main = new HashSet<>(components.get(0));
        for (int i = 1; i < components.size(); i++) {
            bridgeComponents(graph, main, components.get(i), config);
            main.addAll(components.get(i));
        }
    }

    private void bridgeComponents(
            SimpleWeightedGraph<Waypoint, DefaultWeightedEdge> graph,
            Set<Waypoint> comp1, Set<Waypoint> comp2, BuildingConfig config) {

        double maxBridge = config.strictAlignment ? 400.0 : config.searchRadius * 3;
        Waypoint[] best = findAlignedBridge(comp1, comp2, config, maxBridge);

        if (best == null) {
            best = findClosestBridge(comp1, comp2);
        }

        if (best != null && !graph.containsEdge(best[0], best[1])) {
            DefaultWeightedEdge edge = graph.addEdge(best[0], best[1]);
            if (edge != null) {
                graph.setEdgeWeight(edge, best[0].distanceTo(best[1]));
            }
        }
    }

    
    private Waypoint[] findAlignedBridge(
            Set<Waypoint> comp1, Set<Waypoint> comp2, BuildingConfig config, double maxBridge) {

        Waypoint best1 = null;
        Waypoint best2 = null;
        double bestDist = Double.MAX_VALUE;

        for (Waypoint a : comp1) {
            for (Waypoint b : comp2) {
                double dist = a.distanceTo(b);
                if (dist > maxBridge || dist >= bestDist) continue;
                if (isValidBridgeAlignment(a, b, config)) {
                    bestDist = dist;
                    best1 = a;
                    best2 = b;
                }
            }
        }
        return best1 != null ? new Waypoint[]{best1, best2} : null;
    }

    private boolean isValidBridgeAlignment(Waypoint a, Waypoint b, BuildingConfig config) {
        double dx = Math.abs(a.x - b.x);
        double dy = Math.abs(a.y - b.y);
        if (config.strictAlignment) {
            return classify(dx, dy, config.alignThreshold) != Alignment.INVALID;
        }
        return dy <= config.alignThreshold || dx <= config.alignThreshold;
    }

    /** Fallback: find the absolute closest pair of waypoints across two components. */
    private Waypoint[] findClosestBridge(Set<Waypoint> comp1, Set<Waypoint> comp2) {
        Waypoint best1 = null;
        Waypoint best2 = null;
        double bestDist = Double.MAX_VALUE;

        for (Waypoint a : comp1) {
            for (Waypoint b : comp2) {
                double d = a.distanceTo(b);
                if (d < bestDist) {
                    bestDist = d;
                    best1 = a;
                    best2 = b;
                }
            }
        }
        return best1 != null ? new Waypoint[]{best1, best2} : null;
    }
    
    public static class Waypoint {
        public final double x;
        public final double y;
        public final String id;
        
        public Waypoint(double x, double y, String id) {
            this.x = x;
            this.y = y;
            this.id = id;
        }
        
        public double distanceTo(Waypoint other) {
            return distanceTo(other.x, other.y);
        }

        public double distanceTo(double ox, double oy) {
            double dx = x - ox;
            double dy = y - oy;
            return Math.sqrt(dx * dx + dy * dy);
        }

        @Override
        public boolean equals(Object o) {
            return this == o || (o instanceof Waypoint w && id.equals(w.id));
        }

        @Override
        public int hashCode() {
            return id.hashCode();
        }

        @Override
        public String toString() {
            return id + "(" + x + ", " + y + ")";
        }
    }
}
