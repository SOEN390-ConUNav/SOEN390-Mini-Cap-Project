# Pathfinding Logic Guide

This document describes where all the key logic is located for indoor pathfinding.

---

## Architecture Overview

The pathfinding system uses **JGraphT** (Dijkstra's algorithm) on a weighted graph where:
- **Vertices** = pre-defined waypoints extracted from SVG floor plans
- **Edges** = valid walkable connections constrained to corridor-like movement
- **Weights** = Euclidean distance between waypoints

The graph is built once at startup for every building/floor. Pathfinding is a single JGraphT call.

---

## File Locations

| File | Purpose |
|------|---------|
| `PathfindingService.java` | Graph construction, pathfinding, waypoint definitions |
| `IndoorDirectionService.java` | Route orchestration, room resolution, waypoint trimming |
| `FloorPlanData.java` | Room/POI coordinates, entrance grouping |
| `IndoorDirectionsController.java` | REST API endpoints |
| `FloorPlanWebView.tsx` | SVG rendering, route drawing, coordinate transforms |
| `indoor-navigation.tsx` | UI screen, state management, API calls |
| `indoorDirectionsApi.ts` | Frontend API functions |

---

## 1. WAYPOINT DEFINITIONS

**File:** `PathfindingService.java`  
**Location:** Lines 30–377 (static block)

Each building/floor has a hardcoded list of waypoints with exact `cx`/`cy` coordinates from SVG files:

```java
private static final Map<String, List<Waypoint>> WAYPOINTS = new HashMap<>();
static {
    // Hall-8, VL-1, VL-2, LB-2, LB-3, LB-4, LB-5, Hall-9
    List<Waypoint> h8 = new ArrayList<>();
    h8.add(new Waypoint(143.7811, 337.55194, "point-allowed-hallway1"));
    // ...
    WAYPOINTS.put("Hall-8", h8);
}
```

**Supported buildings:** `Hall-8`, `Hall-9`, `VL-1`, `VL-2`, `LB-2`, `LB-3`, `LB-4`, `LB-5`

---

## 2. BUILDING CONFIGURATION

**File:** `PathfindingService.java`  
**Location:** Lines 385–400

Each building has a `BuildingConfig` that controls graph construction:

```java
private record BuildingConfig(
    double searchRadius,     // Max distance to search for neighbors
    double alignThreshold,   // Strict alignment threshold (pixels)
    int maxNeighbors,        // Max neighbors per vertex (0 = unlimited)
    boolean strictAlignment  // Use tiered alignment rules (LB buildings)
) {
    static BuildingConfig forBuilding(String buildingId) {
        if (buildingId.startsWith("LB-"))
            return new BuildingConfig(400.0, 6.0, 4, true);
        if ("Hall-9".equals(buildingId))
            return new BuildingConfig(500.0, 30.0, 0, false);
        if (buildingId.startsWith("VL-"))
            return new BuildingConfig(300.0, 20.0, 0, false);
        return new BuildingConfig(150.0, 20.0, 0, false);  // Hall-8 default
    }
}
```

| Building | searchRadius | alignThreshold | maxNeighbors | strictAlignment |
|----------|-------------|---------------|-------------|----------------|
| LB-* | 400px | 6px | 4 | ✅ Tiered |
| Hall-9 | 500px | 30px | Unlimited | ❌ Basic |
| VL-* | 300px | 20px | Unlimited | ❌ Basic |
| Hall-8 | 150px | 20px | Unlimited | ❌ Basic |

---

## 3. ALIGNMENT CLASSIFICATION (LB Buildings)

**File:** `PathfindingService.java`  
**Location:** Lines 402–417 (enum) + Lines 585–599 (classify method)

LB buildings use tiered alignment to allow different connection qualities:

```java
private enum Alignment {
    PERFECT(0, 250.0),        // Within strict threshold (6px)
    NEAR_PERFECT(1, 250.0),   // ≤10px offset, 3× axis dominance
    MOSTLY(2, 400.0),         // ≤25px offset, 5× axis dominance
    LOOSE(3, 400.0),          // ≤40px offset, 3× axis dominance
    INVALID(-1, 0);
}
```

The `classify(dx, dy, strict)` method determines which tier a connection falls into:

| Tier | Condition | Max Distance |
|------|-----------|-------------|
| PERFECT | `dy ≤ 6px` (or `dx ≤ 6px`) | 250px |
| NEAR_PERFECT | `dy ≤ 10px` AND `dx > dy × 3` | 250px |
| MOSTLY | `dy ≤ 25px` AND `dx > dy × 5` | 400px |
| LOOSE | `dy ≤ 40px` AND `dx > dy × 3` | 400px |
| INVALID | None of the above | — (rejected) |

---

## 4. GRAPH CONSTRUCTION

**File:** `PathfindingService.java`  
**Location:** Lines 507–582

### 4.1 `buildGraph(String buildingId)` — Lines 507–527

Entry point. Creates a `SimpleWeightedGraph`, adds all waypoints as vertices, then adds edges:

```java
private Graph<Waypoint, DefaultWeightedEdge> buildGraph(String buildingId) {
    SimpleWeightedGraph<...> graph = new SimpleWeightedGraph<>(...);
    waypoints.forEach(graph::addVertex);           // 1. Add vertices
    for (Waypoint wp : waypoints)
        addEdgesFor(graph, wp, waypoints, config);  // 2. Add edges
    ensureConnectivity(graph, config);              // 3. Bridge disconnected components
    return graph;
}
```

### 4.2 `addEdgesFor(...)` — Lines 534–582

Adds edges from a waypoint to valid neighbors.

**For LB buildings** (`strictAlignment = true`):
1. Classify each potential neighbor using `classify(dx, dy, threshold)`
2. Reject `INVALID` connections
3. Reject connections exceeding the tier's `maxDist`
4. Sort candidates: best alignment first, then shortest distance
5. Limit to `maxNeighbors` (4 for LB buildings)

**For other buildings** (`strictAlignment = false`):
1. Reject connections exceeding `searchRadius`
2. Check strict horizontal OR vertical alignment only:
   - Horizontal: `dy ≤ threshold` AND `dx > threshold`
   - Vertical: `dx ≤ threshold` AND `dy > threshold`
3. No diagonal connections allowed (prevents paths cutting through rooms)
4. No neighbor limit (unlimited connections)

### 4.3 Edge Weights

All edges use **Euclidean distance** as weight. No penalties or bonuses — JGraphT Dijkstra finds the true shortest path by distance.

---

## 5. CONNECTIVITY

**File:** `PathfindingService.java`  
**Location:** Lines 606–679

### `ensureConnectivity(...)` — Lines 606–622

Uses JGraphT's `ConnectivityInspector` to detect disconnected components. If found, bridges them by finding the best edge between components.

### `bridgeComponents(...)` — Lines 625–679

1. **First pass:** Find the shortest *aligned* connection between two components (within `maxBridge` distance)
   - LB: uses `classify()` to check alignment
   - Others: checks `dx ≤ threshold` or `dy ≤ threshold`
2. **Fallback:** If no aligned connection exists, use the absolute closest pair to prevent unreachable waypoints

```java
double maxBridge = config.strictAlignment ? 400.0 : config.searchRadius * 3;
```

---

## 6. PATHFINDING

**File:** `PathfindingService.java`  
**Location:** Lines 460–490

Uses **JGraphT's DijkstraShortestPath** — a single call:

```java
public List<Waypoint> findPathThroughWaypoints(Waypoint start, Waypoint end) {
    GraphPath<Waypoint, DefaultWeightedEdge> path =
        new DijkstraShortestPath<>(graph).getPath(start, end);
    return path.getVertexList();
}
```

No custom heuristics, no penalties, no U-turn detection. The graph structure (strict alignment rules + limited neighbors) ensures corridor-only paths. Dijkstra finds the shortest one by Euclidean distance.

---

## 7. ROUTE ORCHESTRATION

**File:** `IndoorDirectionService.java`

### `calculateRoute(buildingId, originRoomId, destinationRoomId, floor)`

1. **Convert building ID:** `"H"` → `"Hall-8"`, `"LB"` → `"LB-2"`, etc.
2. **Normalize room pair:** Sort lexicographically for path symmetry (A→B = reverse of B→A)
3. **Resolve entrances:** If room has multiple entrances (e.g., "LB-261" → "LB-261-1" or "LB-261-2"), pick the closest one to the other room
4. **Find nearest waypoints:** For both origin and destination rooms
5. **Run Dijkstra:** `pathfindingService.findPathThroughWaypoints(startWP, endWP)`
6. **Trim redundant waypoints:** Skip at most 1 waypoint at each end if the direct room→waypoint connection is aligned (within 25px threshold)
7. **Build route:** `[originRoom] → [waypoints...] → [destinationRoom]`
8. **Reverse if needed:** To match the original request direction

---

## 8. ROOM & POI DATA

**File:** `FloorPlanData.java`

### Rooms
- `roomPoints`: Map of room ID → (x, y) coordinates
- `roomEntranceGroups`: Groups like `"Elevator" → ["Elevator-1", "Elevator-2"]`
- `resolveToClosestEntrance(baseId, refX, refY)`: Picks the nearest entrance
- `getBaseRoomIds()`: Returns display names (e.g., "LB-261", "Elevator")

### POIs (Points of Interest)
- `PoiType` enum: `BATHROOM_MEN`, `ELEVATOR`, `STAIRS`, `EMERGENCY_EXIT`, etc.
- `poiTypes`: Map of room ID → PoiType
- `getPoiPoints()`: Returns only entries classified as POIs
- `getPointsOfInterest()`: Returns POIs with display names and types

---

## 9. FRONTEND COORDINATE TRANSFORMS

**File:** `FloorPlanWebView.tsx`

Backend coordinates must be transformed to SVG root space for rendering.

| Building | Transform |
|----------|-----------|
| **Hall-8** | `matrix(1.4703124,0,0,1.4703124,-36.695243,-207.5051)` + `translate(0,-28.362168)` — only for rooms/waypoints inside `g3987` |
| **Hall-9** | `scale(-1)` then `matrix(-0.99582912,0,0,-0.99239778,1021.6871,1021.4805)` |
| **VL-1, VL-2** | No transform (coordinates are already in root SVG space) |
| **LB-2 to LB-5** | No transform (coordinates are already in root SVG space) |

Key function: `transformCoordinatesToRootSVG(x, y, roomId)` — used for routes, rooms, waypoints, and POIs.

---

## 10. FRONTEND AUTO-DISPLAY

**File:** `indoor-navigation.tsx` + `FloorPlanWebView.tsx`

Rooms and POIs auto-show when the floor loads (no toggle needed):

1. `indoor-navigation.tsx` fetches room points and POIs via API when `buildingId`/`currentFloor` changes
2. Passes them as `roomData` and `poiData` props to `FloorPlanWebView`
3. `FloorPlanWebView` has `useEffect` hooks watching `isWebViewReady` + prop data
4. When both are ready, injects JavaScript to render markers on the SVG

POI taps → set specific POI ID as destination (e.g., "Elevator-1", not "Elevator")

---

## 11. API ENDPOINTS

**File:** `IndoorDirectionsController.java`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/directions/indoor` | GET | Get route between two rooms |
| `/api/directions/indoor/rooms` | GET | Get available room list |
| `/api/directions/indoor/waypoints` | GET | Get waypoints for a floor |
| `/api/directions/indoor/room-points` | GET | Get room coordinates |
| `/api/directions/indoor/pois` | GET | Get POI data with types |

All accept `buildingId` (frontend format: "H", "VL", "LB") and optional `floor` parameter.

---

## 12. DEBUGGING TIPS

### Check if waypoints are connected:
Look at startup logs:
```
[LB-2] Graph: 48 vertices, 87 edges
  3 disconnected components — bridging...
  Bridged: AllowedPath44 <-> AllowedPath21 (209.7px)
```

### Check pathfinding result:
The `findPathThroughWaypoints` method logs the full path:
```
=== A* PATHFINDING RESULT ===
Path contains 5 waypoints:
  [0] AllowedPath8 at (286.51, 246.52)
  [1] AllowedPath7 at (338.44, 248.31)
  ...
=== END A* RESULT ===
```

### Common issues:

| Problem | Likely Cause | Where to Look |
|---------|-------------|---------------|
| "No path found" | Disconnected graph components | `ensureConnectivity()` — check if bridge distance is too small |
| Path goes through rooms | `alignThreshold` too large, allowing diagonal connections | `BuildingConfig.forBuilding()` — reduce threshold |
| Path skips nearby waypoints | `maxNeighbors` too low, or alignment too strict | `addEdgesFor()` — increase limit or relax threshold |
| Path takes long detour | Missing edge between key waypoints | Check `classify()` tiers and distance limits |
| Wrong map displayed | `buildingId` mismatch between frontend/backend | `convertBuildingIdForPathfinding()` in `IndoorDirectionService` |
| Markers in wrong position | Coordinate transform incorrect | `transformCoordinatesToRootSVG()` in `FloorPlanWebView.tsx` |

---

**Main file to edit:** `PathfindingService.java` (~720 lines)
