import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  Platform,
  Text,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import {
  getIndoorDirections,
  getAvailableRooms,
  getRoomPoints,
  getPointsOfInterest,
  RoomPoint,
  PoiItem,
  getUniversalDirections,
} from "../api/indoorDirectionsApi";
import { IndoorDirectionResponse } from "../types/indoorDirections";
import IndoorSearchBar from "../components/IndoorSearchBar";
import BottomPanel from "../components/BottomPanel";
import DirectionsPanel from "../components/DirectionsPanel";
import RoomListModal from "../components/RoomListModal";
import FloorPlanWebView, {
  FloorPlanWebViewRef,
  PoiMarker,
  RoomMarkerData,
} from "../components/FloorPlanWebView";
import FloorSelector from "../components/FloorSelector";
import { BuildingId } from "../data/buildings";
import {
  getBackendBuildingId,
  getDefaultFloor,
  getAvailableFloors,
} from "../utils/buildingIndoorMaps";

export default function IndoorNavigation() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    buildingId?: string;
    floor?: string;
  }>();

  const buildingId = (params.buildingId as BuildingId) || "H";
  const defaultFloor = getDefaultFloor(buildingId);
  const availableFloors = getAvailableFloors(buildingId);
  const initialFloor =
    params.floor && availableFloors.includes(params.floor)
      ? params.floor
      : defaultFloor;
  const [currentFloor, setCurrentFloor] = useState<string>(initialFloor);
  const backendBuildingId = getBackendBuildingId(buildingId, currentFloor);

  useEffect(() => {}, [
    buildingId,
    currentFloor,
    backendBuildingId,
    availableFloors,
  ]);

  useEffect(() => {
    if (params.floor && availableFloors.includes(params.floor)) {
      setCurrentFloor(params.floor);
    }
  }, [params.floor, availableFloors]);

  const mapViewRef = useRef<FloorPlanWebViewRef>(null);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [startRoom, setStartRoom] = useState<string>("");
  const [endRoom, setEndRoom] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showRoomList, setShowRoomList] = useState<boolean>(false);
  const [selectingFor, setSelectingFor] = useState<"start" | "end" | null>(
    null,
  );
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeData, setRouteData] = useState<IndoorDirectionResponse | null>(
    null,
  );
  const [showRouteDetails, setShowRouteDetails] = useState<boolean>(false);
  const [roomPoints, setRoomPoints] = useState<RoomPoint[]>([]);
  const [pois, setPois] = useState<PoiItem[]>([]);
  const [avoidStairs, setAvoidStairs] = useState<boolean>(false);
  const [startBuildingId, setStartBuildingId] = useState<string>(buildingId);
  const [endBuildingId, setEndBuildingId] = useState<string>(buildingId);
  const [universalRouteData, setUniversalRouteData] = useState<any>(null);
  const [routePhase, setRoutePhase] = useState<
    "origin" | "outdoor" | "destination"
  >("origin");
  const [activeBuildingId, setActiveBuildingId] = useState<string>(buildingId);
  const routeRequestIdRef = useRef(0);

  const handleClearRoute = useCallback(() => {
    mapViewRef.current?.clearRoute();
  }, []);

  const invalidatePendingRouteRequests = useCallback(() => {
    routeRequestIdRef.current += 1;
  }, []);

  const prevBuildingRef = useRef(buildingId);
  useEffect(() => {
    if (prevBuildingRef.current !== buildingId) {
      prevBuildingRef.current = buildingId;
      invalidatePendingRouteRequests();
      setStartRoom("");
      setEndRoom("");
      setSearchQuery("");
      setRouteData(null);
      setUniversalRouteData(null);
      setShowRouteDetails(false);
      setShowRoomList(false);
      setSelectingFor(null);
      handleClearRoute();
      const newDefault = getDefaultFloor(buildingId);
      setCurrentFloor(newDefault);
    }
  }, [buildingId, handleClearRoute, invalidatePendingRouteRequests]);

  const handleFloorChange = useCallback(
    (newFloor: string) => {
      invalidatePendingRouteRequests();
      mapViewRef.current?.clearRoute();

      setCurrentFloor(newFloor);
      router.setParams({ floor: newFloor });

      setRouteData((currentData) => {
        if (currentData && currentData.startFloor !== currentData.endFloor) {
          return currentData;
        }

        return null;
      });
    },
    [invalidatePendingRouteRequests, router],
  );

  const getFloorFromRoom = (roomId: string, fallbackFloor: string) => {
    if (!roomId) return fallbackFloor;
    const match = roomId.match(/[a-zA-Z]+-?(S?\d)/);
    return match ? match[1] : fallbackFloor;
  };

  const getBuildingFromRoom = (roomId: string, fallbackBuilding: string) => {
    if (!roomId) return fallbackBuilding;
    const upperRoom = roomId.toUpperCase();
    if (upperRoom.startsWith("H")) return "H";
    if (upperRoom.startsWith("LB")) return "LB";
    if (upperRoom.startsWith("MB")) return "MB";
    if (upperRoom.startsWith("VL")) return "VL";
    if (upperRoom.startsWith("VE")) return "VE";
    if (upperRoom.startsWith("CC")) return "CC";
    return fallbackBuilding;
  };

  const selectRoom = (room: string) => {
    if (selectingFor === "start") {
      setStartRoom(room);
      setStartBuildingId(getBuildingFromRoom(room, buildingId));
    } else if (selectingFor === "end") {
      setEndRoom(room);
      setEndBuildingId(getBuildingFromRoom(room, buildingId));
    }
    setShowRoomList(false);
    setSelectingFor(null);
    setSearchQuery("");
  };

  const swapLocations = () => {
    const tempRoom = startRoom;
    setStartRoom(endRoom);
    setEndRoom(tempRoom);

    setStartBuildingId(getBuildingFromRoom(endRoom, buildingId));
    setEndBuildingId(getBuildingFromRoom(tempRoom, buildingId));
  };

  const fetchRoute = useCallback(async () => {
    if (!startRoom || !endRoom || startRoom === endRoom) return;

    const requestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = requestId;
    setIsLoadingRoute(true);

    try {
      const originFloor = getFloorFromRoom(startRoom, currentFloor);
      const destFloor = getFloorFromRoom(endRoom, currentFloor);

      if (startBuildingId === endBuildingId) {
        const response = await getIndoorDirections(
          startBuildingId,
          startRoom,
          endRoom,
          originFloor,
          destFloor,
          avoidStairs,
        );

        if (requestId !== routeRequestIdRef.current) return;

        if (response.routePoints && response.routePoints.length > 0) {
          mapViewRef.current?.clearRoute();
          setRouteData(response);
          setUniversalRouteData(null);
        } else {
          handleClearRoute();
          setRouteData(null);
        }
      } else {
        const response = await getUniversalDirections(
          startBuildingId,
          startRoom,
          originFloor,
          endBuildingId,
          endRoom,
          destFloor,
          avoidStairs,
        );

        if (requestId !== routeRequestIdRef.current) return;

        if (response.startIndoorRoute) {
          mapViewRef.current?.clearRoute();
          setUniversalRouteData(response);
          setRouteData(response.startIndoorRoute);
          setRoutePhase("origin");
        }
      }
    } catch (error: any) {
      if (requestId !== routeRequestIdRef.current) return;
      console.warn("Routing error:", error);
      handleClearRoute();
      setRouteData(null);
      setUniversalRouteData(null);
    } finally {
      if (requestId === routeRequestIdRef.current) {
        setIsLoadingRoute(false);
      }
    }
  }, [
    startRoom,
    endRoom,
    startBuildingId,
    endBuildingId,
    currentFloor,
    avoidStairs,
    handleClearRoute,
  ]);

  useEffect(() => {
    const loadAllUniversityRooms = async () => {
      try {
        const allBuildings: BuildingId[] = ["H", "LB", "MB", "VL", "VE", "CC"];
        const roomPromises = allBuildings.flatMap((bId) => {
          const floors = getAvailableFloors(bId);
          return floors.map((floorNum) => getAvailableRooms(bId, floorNum));
        });

        const roomsArrays = await Promise.all(roomPromises);
        const combinedRooms = roomsArrays.flat();
        const uniqueRooms = Array.from(new Set(combinedRooms)).sort((a, b) =>
          a.localeCompare(b),
        );

        setAvailableRooms(uniqueRooms);
      } catch (error) {
        console.error("Failed to load university rooms:", error);
        setAvailableRooms([]);
      }
    };

    loadAllUniversityRooms();
  }, []);

  useEffect(() => {
    const loadRoomPoints = async () => {
      try {
        const points = await getRoomPoints(activeBuildingId, currentFloor);
        setRoomPoints(points);
      } catch (error) {}
    };
    loadRoomPoints();
  }, [activeBuildingId, currentFloor]);

  useEffect(() => {
    const loadPois = async () => {
      try {
        const items = await getPointsOfInterest(activeBuildingId, currentFloor);
        setPois(items);
      } catch (error) {
        console.error("Failed to load POIs:", error);
      }
    };
    loadPois();
  }, [activeBuildingId, currentFloor]);

  const handlePoiTap = useCallback(
    (poi: PoiMarker) => {
      setEndRoom(poi.id);
      if (!startRoom) {
        setSelectingFor("start");
        setShowRoomList(true);
      }
    },
    [startRoom],
  );

  const handleRoomTap = useCallback(
    (room: RoomMarkerData) => {
      setEndRoom(room.id);
      if (!startRoom) {
        setSelectingFor("start");
        setShowRoomList(true);
      }
    },
    [startRoom],
  );

  useEffect(() => {
    if (startRoom && endRoom && startRoom !== endRoom) {
      fetchRoute();
    } else {
      invalidatePendingRouteRequests();
      handleClearRoute();
      setRouteData(null);
      setUniversalRouteData(null);
      setIsLoadingRoute(false);
    }
  }, [
    startRoom,
    endRoom,
    fetchRoute,
    handleClearRoute,
    invalidatePendingRouteRequests,
  ]);

  const filteredRooms = availableRooms.filter((room) =>
    room.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const clearStart = () => {
    setStartRoom("");
  };

  const clearEnd = () => {
    setEndRoom("");
  };

  const statusBarHeight =
    Constants.statusBarHeight ||
    (Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 0);

  const getDisplayedRoute = () => {
    const points = routeData?.routePoints;
    if (!points || points.length === 0) return undefined;

    const transitionIndex = points.findIndex((p) =>
      p.label?.startsWith("TRANSITION_"),
    );

    if (transitionIndex === -1) {
      return points;
    }

    const { startFloor, endFloor } = routeData;

    if (currentFloor === startFloor) {
      return points.slice(0, transitionIndex + 1);
    }

    if (currentFloor === endFloor) {
      return points.slice(transitionIndex + 1);
    }

    return undefined;
  };

  const displayedRoutePoints = getDisplayedRoute();

  useEffect(() => {
    setActiveBuildingId(buildingId);
  }, [buildingId]);

  let displayBuildingName = routeData?.buildingName || "Building";

  if (!routeData?.buildingName) {
    if (buildingId === "H") {
      displayBuildingName = "Hall Building";
    } else if (buildingId === "VL") {
      displayBuildingName = "Vanier Library Building";
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.mapContainer}>
        <FloorPlanWebView
          ref={mapViewRef}
          buildingId={activeBuildingId}
          floorNumber={currentFloor}
          routePoints={displayedRoutePoints}
          roomData={
            roomPoints.length > 0
              ? roomPoints.map((r) => ({
                  x: r.x,
                  y: r.y,
                  id: r.id,
                }))
              : undefined
          }
          poiData={
            pois.length > 0
              ? pois.map((p) => ({
                  x: p.x,
                  y: p.y,
                  id: p.id,
                  displayName: p.displayName,
                  type: p.type,
                }))
              : undefined
          }
          onPoiTap={handlePoiTap}
          onRoomTap={handleRoomTap}
        />
      </View>

      {availableFloors.length > 1 && (
        <View
          style={[styles.floorSelectorContainer, { top: statusBarHeight + 16 }]}
        >
          <FloorSelector
            currentFloor={currentFloor}
            availableFloors={getAvailableFloors(activeBuildingId)}
            onFloorSelect={handleFloorChange}
            buildingName={activeBuildingId}
          />
        </View>
      )}

      <IndoorSearchBar
        startRoom={startRoom}
        endRoom={endRoom}
        isLoadingRoute={isLoadingRoute}
        statusBarHeight={statusBarHeight}
        buildingName={displayBuildingName}
        floor={currentFloor}
        onStartPress={() => {
          setSelectingFor("start");
          setShowRoomList(true);
        }}
        onEndPress={() => {
          setSelectingFor("end");
          setShowRoomList(true);
        }}
        onClearStart={clearStart}
        onClearEnd={clearEnd}
        onSwap={swapLocations}
      />

      {routeData?.stairMessage && (
        <View style={styles.stairBanner}>
          <Text style={styles.stairBannerText}>
            🚶 {routeData.stairMessage}
          </Text>
        </View>
      )}

      <View style={styles.accessibilityToggleContainer}>
        <Text style={styles.accessibilityText}>
          Avoid Stairs / Wheelchair Accessible
        </Text>
        <Switch
          value={avoidStairs}
          onValueChange={setAvoidStairs}
          trackColor={{ false: "#ccc", true: "#8B1538" }}
          thumbColor={avoidStairs ? "#fff" : "#f4f3f4"}
        />
      </View>

      {routeData &&
        routeData.startFloor &&
        routeData.endFloor &&
        routeData.startFloor !== routeData.endFloor && (
          <View style={styles.floorTransitionContainer}>
            {currentFloor === routeData.startFloor ? (
              <TouchableOpacity
                style={styles.transitionButton}
                onPress={() => handleFloorChange(routeData.endFloor)}
              >
                <Text style={styles.transitionButtonText}>
                  Go to Floor {routeData.endFloor}
                </Text>
              </TouchableOpacity>
            ) : currentFloor === routeData.endFloor ? (
              <TouchableOpacity
                style={styles.transitionButton}
                onPress={() => handleFloorChange(routeData.startFloor)}
              >
                <Text style={styles.transitionButtonText}>
                  Back to Floor {routeData.startFloor}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

      {universalRouteData?.nextShuttleTime && routePhase === "origin" && (
        <View
          style={[
            styles.stairBanner,
            { bottom: 230, borderLeftColor: "#8B1538" },
          ]}
        >
          <Text style={[styles.stairBannerText, { color: "#8B1538" }]}>
            Next Shuttle Bus: {universalRouteData.nextShuttleTime}
          </Text>
        </View>
      )}

      {universalRouteData && routePhase === "origin" && (
        <View style={styles.floorTransitionContainer}>
          <TouchableOpacity
            style={styles.transitionButton}
            onPress={() => {
              setRoutePhase("destination");
              setRouteData(universalRouteData.endIndoorRoute);

              setActiveBuildingId(endBuildingId);

              handleFloorChange(universalRouteData.endIndoorRoute.startFloor);

              setTimeout(() => {
                if (mapViewRef.current) {
                  mapViewRef.current.drawRoute(
                    universalRouteData.endIndoorRoute.routePoints,
                  );
                }
              }, 500);
            }}
          >
            <Text style={styles.transitionButtonText}>
              Exit Building & Go to {endBuildingId}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!showRouteDetails && (
        <BottomPanel
          startRoom={startRoom}
          endRoom={endRoom}
          routeData={routeData}
          isLoadingRoute={isLoadingRoute}
          showDirections={showRouteDetails}
          onToggleDirections={() => {
            setShowRouteDetails(true);
          }}
        />
      )}

      <DirectionsPanel
        routeData={routeData}
        visible={showRouteDetails}
        onClose={() => setShowRouteDetails(false)}
      />

      <RoomListModal
        visible={showRoomList}
        selectingFor={selectingFor}
        searchQuery={searchQuery}
        filteredRooms={filteredRooms}
        onSearchChange={setSearchQuery}
        onSelectRoom={selectRoom}
        onClose={() => {
          setShowRoomList(false);
          setSelectingFor(null);
          setSearchQuery("");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mapContainer: {
    flex: 1,
  },
  floorSelectorContainer: {
    position: "absolute",
    right: 16,
    zIndex: 11,
  },
  stairBanner: {
    position: "absolute",
    bottom: 180,
    left: 16,
    right: 16,
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  stairBannerText: {
    color: "#E65100",
    fontSize: 14,
    fontWeight: "600",
  },

  accessibilityToggleContainer: {
    position: "absolute",
    top: 200,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  accessibilityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },

  floorTransitionContainer: {
    position: "absolute",
    bottom: 260,
    alignSelf: "center",
    zIndex: 15,
  },
  transitionButton: {
    backgroundColor: "#8B1538",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  transitionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
