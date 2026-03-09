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
import {
  IndoorDirectionResponse,
  IndoorRouteStep,
} from "../types/indoorDirections";
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

const MAX_DURATION_REGEX_INPUT_LENGTH = 128;
const DURATION_HOUR_REGEX = /\b([0-9]{1,3})[ \t]{0,4}hours?\b/i;
const DURATION_MINUTE_REGEX = /\b([0-9]{1,3})[ \t]{0,4}mins?\b/i;

function getRoomPromisesForBuildings(buildings: BuildingId[]) {
  return buildings.flatMap((bId) =>
    getAvailableFloors(bId).map((floorNum) => getAvailableRooms(bId, floorNum)),
  );
}

export default function IndoorNavigation() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    buildingId?: string;
    floor?: string;
    startRoom?: string;
    endRoom?: string;
  }>();

  const buildingId = (params.buildingId as BuildingId) || "H";
  const defaultFloor = getDefaultFloor(buildingId);
  const availableFloors = getAvailableFloors(buildingId);
  const initialFloor =
    params.floor && availableFloors.includes(params.floor)
      ? params.floor
      : defaultFloor;
  const initialStartRoom =
    typeof params.startRoom === "string" ? params.startRoom : "";
  const initialEndRoom =
    typeof params.endRoom === "string" ? params.endRoom : "";
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
  const [startRoom, setStartRoom] = useState<string>(initialStartRoom);
  const [endRoom, setEndRoom] = useState<string>(initialEndRoom);
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
    const parts = roomId.split("-");
    const lastPart = parts.at(-1) ?? roomId;
    if (
      lastPart.startsWith("S") &&
      lastPart.length >= 2 &&
      lastPart[1] >= "0" &&
      lastPart[1] <= "9"
    ) {
      return lastPart.slice(0, 2);
    }
    for (const char of lastPart) {
      if (char >= "0" && char <= "9") {
        return char;
      }
    }
    return fallbackFloor;
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

  const parseDistanceMeters = (value: string): number => {
    const normalized = value.trim().toLowerCase();
    const kmMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*km$/);
    if (kmMatch) return Number(kmMatch[1]) * 1000;
    const meterMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*m$/);
    if (meterMatch) return Number(meterMatch[1]);
    return 0;
  };

  const parseDurationMinutes = (value: string): number => {
    const normalized = value
      .trim()
      .toLowerCase()
      .slice(0, MAX_DURATION_REGEX_INPUT_LENGTH);
    const hourMatch = DURATION_HOUR_REGEX.exec(normalized);
    const minMatch = DURATION_MINUTE_REGEX.exec(normalized);
    const hours = hourMatch?.[1] ? Number(hourMatch[1]) : 0;
    const mins = minMatch?.[1] ? Number(minMatch[1]) : 0;
    const total = hours * 60 + mins;
    return total > 0 ? total : 1;
  };

  const formatDistanceMeters = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDurationMinutes = (minutes: number): string => {
    const safeMinutes = Math.max(1, Math.round(minutes));
    if (safeMinutes < 60) return `${safeMinutes} mins`;
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    return `${hours} hour${hours > 1 ? "s" : ""} ${mins} mins`;
  };

  const floorToLevel = (floor: string): number => {
    const upper = floor.toUpperCase();
    const basement = upper.match(/^S(\d+)$/);
    if (basement?.[1]) return -Number(basement[1]);
    const n = Number(upper);
    return Number.isFinite(n) ? n : 0;
  };

  type VerticalConnectorKind = "elevator" | "stairs";
  type VerticalConnectorCandidate = {
    room: string;
    score: number;
    kind: VerticalConnectorKind;
    key: string;
  };

  const getVerticalConnectorCandidates = (
    rooms: string[],
    preferElevator: boolean,
  ): VerticalConnectorCandidate[] => {
    const scored = rooms
      .map((room) => {
        const lower = room.toLowerCase();
        const isElevator = /elevator/.test(lower);
        const isStairs = /stairs?/.test(lower);
        if (!isElevator && !isStairs) return null;

        const kind: VerticalConnectorKind = isElevator ? "elevator" : "stairs";
        let score = 0;
        if (isElevator) score += preferElevator ? 240 : 190;
        if (isStairs) score += preferElevator ? 120 : 230;
        if (/main/.test(lower)) score += 35;
        if (/emergency/.test(lower)) score -= 50;

        const normalizedKey = room
          .toUpperCase()
          .replace(/\s+/g, "")
          .replace(/^[A-Z]{1,4}-?S?\d+-?/, "")
          .replace(/^[A-Z]{1,4}-/, "");

        return { room, score, kind, key: normalizedKey };
      })
      .filter(
        (candidate): candidate is VerticalConnectorCandidate => !!candidate,
      )
      .sort((a, b) => b.score - a.score || a.room.localeCompare(b.room));

    const deduped: VerticalConnectorCandidate[] = [];
    const seen = new Set<string>();
    for (const connector of scored) {
      const key = connector.room.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(connector);
    }

    return deduped;
  };

  const hasValidRoutePoints = (
    response: IndoorDirectionResponse | null | undefined,
  ): response is IndoorDirectionResponse =>
    !!response &&
    Array.isArray(response.routePoints) &&
    response.routePoints.length > 0;

  const isCrossFloorResponseComplete = (
    response: IndoorDirectionResponse,
    destinationRoomId: string,
  ): boolean => {
    const points = response.routePoints ?? [];
    if (points.length < 2) return false;

    const transitionIndex = points.findIndex((point) =>
      point.label?.startsWith("TRANSITION_"),
    );
    if (transitionIndex < 0 || transitionIndex >= points.length - 1) {
      return false;
    }

    const lastLabel = points[points.length - 1]?.label ?? "";
    if (lastLabel.toUpperCase() !== destinationRoomId.toUpperCase()) {
      return false;
    }

    return true;
  };

  const buildSimpleWalkSteps = (
    destination: string,
    floor: string,
    distance: string,
    duration: string,
  ): IndoorRouteStep[] => [
    {
      instruction: `Walk to ${destination}`,
      distance,
      duration,
      maneuverType: "STRAIGHT",
      floor,
    },
    {
      instruction: `Arrive at ${destination}`,
      distance: "0 m",
      duration: "0 sec",
      maneuverType: "ENTER_ROOM",
      floor,
      roomNumber: destination,
      landmark: null,
    },
  ];

  const reverseSameFloorRoute = (
    route: IndoorDirectionResponse,
    startRoomId: string,
    destinationRoomId: string,
    floor: string,
  ): IndoorDirectionResponse | null => {
    if (!route.routePoints?.length) return null;

    const reversedPoints = [...route.routePoints]
      .reverse()
      .map((point, index, all) => {
        if (index === 0) {
          return { ...point, label: startRoomId };
        }
        if (index === all.length - 1) {
          return { ...point, label: destinationRoomId };
        }
        return point;
      });

    return {
      ...route,
      startFloor: floor,
      endFloor: floor,
      routePoints: reversedPoints,
      steps: buildSimpleWalkSteps(
        destinationRoomId,
        floor,
        route.distance || "0 m",
        route.duration || "1 min",
      ),
    };
  };

  const buildSyntheticSameFloorLeg = ({
    building,
    floor,
    originRoomId,
    destinationRoomId,
    roomPoints,
  }: {
    building: string;
    floor: string;
    originRoomId: string;
    destinationRoomId: string;
    roomPoints: RoomPoint[];
  }): IndoorDirectionResponse | null => {
    const lookup = new Map(
      roomPoints.map((point) => [point.id.toUpperCase(), point]),
    );
    const start = lookup.get(originRoomId.toUpperCase());
    const end = lookup.get(destinationRoomId.toUpperCase());
    if (!start || !end) return null;

    const rawDistance = Math.hypot(end.x - start.x, end.y - start.y);
    const distance = formatDistanceMeters(rawDistance);
    const minutes = Math.max(1, Math.round(rawDistance / 85));
    const duration = formatDurationMinutes(minutes);

    return {
      distance,
      duration,
      buildingName: building,
      buildingId: building,
      startFloor: floor,
      endFloor: floor,
      steps: buildSimpleWalkSteps(destinationRoomId, floor, distance, duration),
      polyline: "",
      routePoints: [
        { x: start.x, y: start.y, label: originRoomId },
        { x: end.x, y: end.y, label: destinationRoomId },
      ],
      stairMessage: null,
    };
  };

  const mergeRoutesWithManualTransition = (
    legOne: IndoorDirectionResponse,
    legTwo: IndoorDirectionResponse,
    fromFloor: string,
    toFloor: string,
    avoidStairsRouting: boolean,
  ): IndoorDirectionResponse => {
    const firstPoints = legOne.routePoints ?? [];
    const secondPoints = legTwo.routePoints ?? [];
    const transitionSource =
      firstPoints[firstPoints.length - 1] ?? secondPoints[0] ?? null;

    const mergedPoints = [...firstPoints];
    if (transitionSource) {
      mergedPoints.push({
        x: transitionSource.x,
        y: transitionSource.y,
        label: `TRANSITION_${fromFloor}_TO_${toFloor}`,
      });
    }
    mergedPoints.push(...secondPoints);

    const totalMeters =
      parseDistanceMeters(legOne.distance) +
      parseDistanceMeters(legTwo.distance);
    const totalMinutes =
      parseDurationMinutes(legOne.duration) +
      parseDurationMinutes(legTwo.duration);

    const isAscending = floorToLevel(toFloor) >= floorToLevel(fromFloor);
    const transitionStep: IndoorRouteStep = {
      instruction: `Take ${avoidStairsRouting ? "the elevator" : "the stairs/elevator"} to floor ${toFloor}.`,
      distance: "0 m",
      duration: "1 min",
      maneuverType: avoidStairsRouting
        ? isAscending
          ? "ELEVATOR_UP"
          : "ELEVATOR_DOWN"
        : isAscending
          ? "STAIRS_UP"
          : "STAIRS_DOWN",
      floor: toFloor,
    };

    const stairMessage = [legOne.stairMessage, legTwo.stairMessage]
      .filter(
        (message): message is string => !!message && message.trim().length > 0,
      )
      .join(" ");

    return {
      ...legTwo,
      distance: formatDistanceMeters(totalMeters),
      duration: formatDurationMinutes(totalMinutes),
      startFloor: legOne.startFloor,
      endFloor: legTwo.endFloor,
      steps: [...(legOne.steps ?? []), transitionStep, ...(legTwo.steps ?? [])],
      routePoints: mergedPoints,
      stairMessage: stairMessage || null,
    };
  };

  const getSplitCrossFloorRoute = async ({
    building,
    origin,
    destination,
    originFloor,
    destinationFloor,
    avoidStairsRouting,
  }: {
    building: string;
    origin: string;
    destination: string;
    originFloor: string;
    destinationFloor: string;
    avoidStairsRouting: boolean;
  }): Promise<IndoorDirectionResponse | null> => {
    if (originFloor === destinationFloor) return null;

    const [
      originFloorRooms,
      destinationFloorRooms,
      destinationRoomPoints,
      originPois,
      destinationPois,
    ] = await Promise.all([
      getAvailableRooms(building, originFloor),
      getAvailableRooms(building, destinationFloor),
      getRoomPoints(building, destinationFloor).catch(() => []),
      getPointsOfInterest(building, originFloor).catch(() => []),
      getPointsOfInterest(building, destinationFloor).catch(() => []),
    ]);

    const connectorPoiIds = (pois: PoiItem[]) =>
      pois
        .filter(
          (poi) =>
            /elevator|stairs?/i.test(poi.type) ||
            /elevator|stairs?/i.test(poi.id),
        )
        .map((poi) => poi.id);

    const originConnectorPool = Array.from(
      new Set([...originFloorRooms, ...connectorPoiIds(originPois)]),
    );
    const destinationConnectorPool = Array.from(
      new Set([...destinationFloorRooms, ...connectorPoiIds(destinationPois)]),
    );

    const originConnectors = getVerticalConnectorCandidates(
      originConnectorPool,
      avoidStairsRouting,
    );
    const destinationConnectors = getVerticalConnectorCandidates(
      destinationConnectorPool,
      avoidStairsRouting,
    );

    if (!originConnectors.length || !destinationConnectors.length) {
      return null;
    }

    for (const originConnector of originConnectors) {
      if (origin.toUpperCase() === originConnector.room.toUpperCase()) {
        continue;
      }

      const legOne = await getIndoorDirections(
        building,
        origin,
        originConnector.room,
        originFloor,
        originFloor,
        avoidStairsRouting,
      ).catch(() => null);

      if (!hasValidRoutePoints(legOne)) continue;

      const rankedDestinationConnectors = destinationConnectors
        .map((destinationConnector) => {
          let pairScore = destinationConnector.score;
          if (destinationConnector.kind === originConnector.kind) {
            pairScore += 80;
          }
          if (
            originConnector.key &&
            destinationConnector.key === originConnector.key
          ) {
            pairScore += 240;
          }
          return { destinationConnector, pairScore };
        })
        .sort(
          (a, b) =>
            b.pairScore - a.pairScore ||
            a.destinationConnector.room.localeCompare(
              b.destinationConnector.room,
            ),
        );

      for (const { destinationConnector } of rankedDestinationConnectors) {
        if (
          destination.toUpperCase() === destinationConnector.room.toUpperCase()
        ) {
          continue;
        }

        const legTwoDirect = await getIndoorDirections(
          building,
          destinationConnector.room,
          destination,
          destinationFloor,
          destinationFloor,
          avoidStairsRouting,
        ).catch(() => null);

        let legTwo: IndoorDirectionResponse | null = hasValidRoutePoints(
          legTwoDirect,
        )
          ? legTwoDirect
          : null;

        if (!legTwo) {
          const legTwoReverse = await getIndoorDirections(
            building,
            destination,
            destinationConnector.room,
            destinationFloor,
            destinationFloor,
            avoidStairsRouting,
          ).catch(() => null);

          if (hasValidRoutePoints(legTwoReverse)) {
            legTwo = reverseSameFloorRoute(
              legTwoReverse,
              destinationConnector.room,
              destination,
              destinationFloor,
            );
          }
        }

        if (!legTwo) {
          legTwo = buildSyntheticSameFloorLeg({
            building,
            floor: destinationFloor,
            originRoomId: destinationConnector.room,
            destinationRoomId: destination,
            roomPoints: destinationRoomPoints,
          });
        }

        if (!hasValidRoutePoints(legTwo)) continue;

        return mergeRoutesWithManualTransition(
          legOne,
          legTwo,
          originFloor,
          destinationFloor,
          avoidStairsRouting,
        );
      }
    }

    return null;
  };

  const getSplitCrossFloorRouteWithFallback = async ({
    building,
    origin,
    destination,
    originFloor,
    destinationFloor,
    avoidStairsRouting,
  }: {
    building: string;
    origin: string;
    destination: string;
    originFloor: string;
    destinationFloor: string;
    avoidStairsRouting: boolean;
  }): Promise<IndoorDirectionResponse | null> => {
    const primary = await getSplitCrossFloorRoute({
      building,
      origin,
      destination,
      originFloor,
      destinationFloor,
      avoidStairsRouting,
    }).catch(() => null);
    if (primary) return primary;

    if (!avoidStairsRouting) return null;

    return getSplitCrossFloorRoute({
      building,
      origin,
      destination,
      originFloor,
      destinationFloor,
      avoidStairsRouting: false,
    }).catch(() => null);
  };

  useEffect(() => {
    if (typeof params.startRoom !== "string") return;
    setStartRoom(params.startRoom);
    setStartBuildingId(getBuildingFromRoom(params.startRoom, buildingId));
  }, [params.startRoom, buildingId]);

  useEffect(() => {
    if (typeof params.endRoom !== "string") return;
    setEndRoom(params.endRoom);
    setEndBuildingId(getBuildingFromRoom(params.endRoom, buildingId));
  }, [params.endRoom, buildingId]);

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

  const applyIndoorRouteResponse = useCallback(
    (response: IndoorDirectionResponse, requestId: number) => {
      if (requestId !== routeRequestIdRef.current) return;
      const hasValidRoute =
        response.routePoints && response.routePoints.length > 0;
      if (hasValidRoute) {
        mapViewRef.current?.clearRoute();
        setRouteData(response);
        setUniversalRouteData(null);
      } else {
        handleClearRoute();
        setRouteData(null);
      }
    },
    [handleClearRoute],
  );

  const applyUniversalRouteResponse = useCallback(
    (response: any, requestId: number) => {
      if (requestId !== routeRequestIdRef.current) return;
      if (response.startIndoorRoute) {
        mapViewRef.current?.clearRoute();
        setUniversalRouteData(response);
        setRouteData(response.startIndoorRoute);
        setRoutePhase("origin");
      }
    },
    [],
  );

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
        let resolvedRoute = response;
        if (
          originFloor !== destFloor &&
          !isCrossFloorResponseComplete(response, endRoom)
        ) {
          const fallbackRoute = await getSplitCrossFloorRouteWithFallback({
            building: startBuildingId,
            origin: startRoom,
            destination: endRoom,
            originFloor,
            destinationFloor: destFloor,
            avoidStairsRouting: avoidStairs,
          });
          if (fallbackRoute) {
            resolvedRoute = fallbackRoute;
          }
        }
        applyIndoorRouteResponse(resolvedRoute, requestId);
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
        applyUniversalRouteResponse(response, requestId);
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
    applyIndoorRouteResponse,
    applyUniversalRouteResponse,
  ]);

  useEffect(() => {
    const loadAllUniversityRooms = async () => {
      try {
        const allBuildings: BuildingId[] = ["H", "LB", "MB", "VL", "VE", "CC"];
        const roomPromises = getRoomPromisesForBuildings(allBuildings);

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
      } catch (error) {
        console.error("Failed to load room points:", error);
        setRoomPoints([]);
      }
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
      setEndBuildingId(getBuildingFromRoom(poi.id, buildingId));
      if (!startRoom) {
        setSelectingFor("start");
        setShowRoomList(true);
      }
    },
    [startRoom, buildingId],
  );

  const handleRoomTap = useCallback(
    (room: RoomMarkerData) => {
      setEndRoom(room.id);
      setEndBuildingId(getBuildingFromRoom(room.id, buildingId));
      if (!startRoom) {
        setSelectingFor("start");
        setShowRoomList(true);
      }
    },
    [startRoom, buildingId],
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
        Boolean(routeData.startFloor) &&
        Boolean(routeData.endFloor) &&
        routeData.startFloor !== routeData.endFloor && (
          <View style={styles.floorTransitionContainer}>
            {currentFloor === routeData.startFloor && (
              <TouchableOpacity
                style={styles.transitionButton}
                onPress={() => handleFloorChange(routeData.endFloor)}
              >
                <Text style={styles.transitionButtonText}>
                  Go to Floor {routeData.endFloor}
                </Text>
              </TouchableOpacity>
            )}
            {currentFloor === routeData.endFloor && (
              <TouchableOpacity
                style={styles.transitionButton}
                onPress={() => handleFloorChange(routeData.startFloor)}
              >
                <Text style={styles.transitionButtonText}>
                  Back to Floor {routeData.startFloor}
                </Text>
              </TouchableOpacity>
            )}
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
