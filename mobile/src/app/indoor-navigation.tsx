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
import { useTheme } from "../hooks/useTheme";
import {
  inferPoiType,
  getDisplayNameFromRoomId,
} from "../utils/floorPlanPoiUtils";

const MAX_DURATION_REGEX_INPUT_LENGTH = 128;
const MAX_DISTANCE_REGEX_INPUT_LENGTH = 64;
const DISTANCE_KM_REGEX = /^(\d+(?:\.\d+)?)[ \t]{0,4}km$/i;
const DISTANCE_METER_REGEX = /^(\d+(?:\.\d+)?)[ \t]{0,4}m$/i;
const BASEMENT_FLOOR_REGEX = /^S(\d+)$/i;
const DURATION_HOUR_REGEX = /\b(\d{1,3})[ \t]{0,4}hours?\b/i;
const DURATION_MINUTE_REGEX = /\b(\d{1,3})[ \t]{0,4}mins?\b/i;

const getParamValue = (value?: string | string[]) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

const getFloorFromRoom = (roomId: string, fallbackFloor: string) => {
  if (!roomId) return fallbackFloor;
  const normalizedRoom = roomId.trim().toUpperCase();

  // Explicit building-floor-room format, e.g. MB-S2-330 or MB-1-210.
  const explicitFloorMatch = /^[A-Z]{1,4}-(S\d+|\d+)-/.exec(normalizedRoom);
  if (explicitFloorMatch?.[1]) {
    return explicitFloorMatch[1];
  }

  // Compact prefix floor format, e.g. MBS2-Entrance-Exit.
  const compactBasementMatch = /^[A-Z]{1,4}(S\d+)-/.exec(normalizedRoom);
  if (compactBasementMatch?.[1]) {
    return compactBasementMatch[1];
  }

  // Compact prefix floor format, e.g. H8-801 or MB3-330.
  const compactFloorMatch = /^[A-Z]{1,4}(\d+)-/.exec(normalizedRoom);
  if (compactFloorMatch?.[1]) {
    return compactFloorMatch[1];
  }

  const parts = normalizedRoom.split("-");
  const lastPart = parts.at(-1) ?? normalizedRoom;
  if (
    lastPart.startsWith("S") &&
    lastPart.length >= 2 &&
    lastPart[1] >= "0" &&
    lastPart[1] <= "9"
  ) {
    return lastPart.slice(0, 2);
  }

  let roomPart = parts.length >= 2 ? parts[1] : "";
  if (roomPart.includes(".")) {
    roomPart = roomPart.split(".")[0];
  }

  roomPart = roomPart.replace(/[A-Z]{1,16}$/, "");

  if (roomPart.length >= 3) {
    return roomPart.slice(0, -2);
  }

  if (roomPart.length > 0) {
    return roomPart;
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
  const normalized = value.trim().slice(0, MAX_DISTANCE_REGEX_INPUT_LENGTH);
  const kmMatch = DISTANCE_KM_REGEX.exec(normalized);
  if (kmMatch?.[1]) return Number(kmMatch[1]) * 1000;
  const meterMatch = DISTANCE_METER_REGEX.exec(normalized);
  if (meterMatch?.[1]) return Number(meterMatch[1]);
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
  const basement = BASEMENT_FLOOR_REGEX.exec(upper);
  if (basement?.[1]) return -Number(basement[1]);
  const n = Number(upper);
  return Number.isFinite(n) ? n : 0;
};

const getDisplayBuildingName = (
  routeData: IndoorDirectionResponse | null,
  buildingId: BuildingId,
): string => {
  if (routeData?.buildingName) {
    return routeData.buildingName;
  }

  if (buildingId === "H") {
    return "Hall Building";
  }

  if (buildingId === "VL") {
    return "Vanier Library Building";
  }

  return "Building";
};

const UNIVERSITY_BUILDINGS: BuildingId[] = ["H", "LB", "MB", "VL", "VE", "CC"];

const buildUniversityRoomPromises = (): Array<Promise<string[]>> =>
  UNIVERSITY_BUILDINGS.flatMap((bId) =>
    getAvailableFloors(bId).map((floorNum) => getAvailableRooms(bId, floorNum)),
  );

const isVerticalTransitionStep = (step: IndoorRouteStep): boolean => {
  const instruction = step.instruction.toLowerCase();
  return (
    step.maneuverType === "ELEVATOR_UP" ||
    step.maneuverType === "ELEVATOR_DOWN" ||
    step.maneuverType === "STAIRS_UP" ||
    step.maneuverType === "STAIRS_DOWN" ||
    step.maneuverType === "ESCALATOR_UP" ||
    step.maneuverType === "ESCALATOR_DOWN" ||
    /\btake\b.*\b(elevator|stairs|escalator)\b/.test(instruction)
  );
};

const getVerticalTransitionStepIndex = (
  response: IndoorDirectionResponse | null | undefined,
): number => {
  if (!response || response.startFloor === response.endFloor) {
    return -1;
  }

  return response.steps.findIndex(isVerticalTransitionStep);
};

const getFloorForStepIndex = (
  response: IndoorDirectionResponse | null | undefined,
  stepIndex: number,
  fallbackFloor: string,
): string => {
  if (!response) {
    return fallbackFloor;
  }

  if (response.startFloor === response.endFloor) {
    return response.steps[stepIndex]?.floor || response.startFloor;
  }

  const transitionStepIndex = getVerticalTransitionStepIndex(response);
  if (transitionStepIndex >= 0) {
    return stepIndex > transitionStepIndex
      ? response.endFloor
      : response.startFloor;
  }

  return response.steps[stepIndex]?.floor || response.startFloor;
};

const getDisplayedRoutePoints = (
  routeData: IndoorDirectionResponse | null,
  currentFloor: string,
) => {
  const points = routeData?.routePoints;
  if (!points || points.length === 0) return undefined;

  const transitionIndex = points.findIndex((point) =>
    point.label?.startsWith("TRANSITION_"),
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

const applySelectedRoom = ({
  room,
  selectingFor,
  buildingId,
  setStartRoom,
  setEndRoom,
  setStartBuildingId,
  setEndBuildingId,
  closeSelector,
}: {
  room: string;
  selectingFor: "start" | "end" | null;
  buildingId: BuildingId;
  setStartRoom: React.Dispatch<React.SetStateAction<string>>;
  setEndRoom: React.Dispatch<React.SetStateAction<string>>;
  setStartBuildingId: React.Dispatch<React.SetStateAction<string>>;
  setEndBuildingId: React.Dispatch<React.SetStateAction<string>>;
  closeSelector: () => void;
}) => {
  const nextBuildingId = getBuildingFromRoom(room, buildingId);

  if (selectingFor === "start") {
    setStartRoom(room);
    setStartBuildingId(nextBuildingId);
  } else if (selectingFor === "end") {
    setEndRoom(room);
    setEndBuildingId(nextBuildingId);
  }

  closeSelector();
};

const retainCrossFloorRoute = (currentData: IndoorDirectionResponse | null) =>
  currentData && currentData.startFloor !== currentData.endFloor
    ? currentData
    : null;

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
        .replaceAll(/\s+/g, "")
        .replace(/^[A-Z]{1,4}-?S?\d+-?/, "")
        .replace(/^[A-Z]{1,4}-/, "");

      return { room, score, kind, key: normalizedKey };
    })
    .filter((candidate): candidate is VerticalConnectorCandidate => !!candidate)
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

  const lastLabel = points.at(-1)?.label ?? "";
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
  const transitionSource = firstPoints.at(-1) ?? secondPoints[0] ?? null;

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
    parseDistanceMeters(legOne.distance) + parseDistanceMeters(legTwo.distance);
  const totalMinutes =
    parseDurationMinutes(legOne.duration) +
    parseDurationMinutes(legTwo.duration);

  const isAscending = floorToLevel(toFloor) >= floorToLevel(fromFloor);
  let transitionManeuverType: IndoorRouteStep["maneuverType"];
  if (avoidStairsRouting) {
    transitionManeuverType = isAscending ? "ELEVATOR_UP" : "ELEVATOR_DOWN";
  } else {
    transitionManeuverType = isAscending ? "STAIRS_UP" : "STAIRS_DOWN";
  }

  const transitionStep: IndoorRouteStep = {
    instruction: `Take ${avoidStairsRouting ? "the elevator" : "the stairs/elevator"} to floor ${toFloor}.`,
    distance: "0 m",
    duration: "1 min",
    maneuverType: transitionManeuverType,
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

const connectorPoiIds = (pois: PoiItem[]): string[] =>
  pois
    .filter(
      (poi) =>
        /elevator|stairs?/i.test(poi.type) || /elevator|stairs?/i.test(poi.id),
    )
    .map((poi) => poi.id);

const rankDestinationConnectors = (
  originConnector: VerticalConnectorCandidate,
  destinationConnectors: VerticalConnectorCandidate[],
): VerticalConnectorCandidate[] =>
  destinationConnectors
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
        a.destinationConnector.room.localeCompare(b.destinationConnector.room),
    )
    .map(({ destinationConnector }) => destinationConnector);

const resolveSecondLeg = async ({
  building,
  destinationConnectorRoom,
  destination,
  destinationFloor,
  avoidStairsRouting,
  destinationRoomPoints,
}: {
  building: string;
  destinationConnectorRoom: string;
  destination: string;
  destinationFloor: string;
  avoidStairsRouting: boolean;
  destinationRoomPoints: RoomPoint[];
}): Promise<IndoorDirectionResponse | null> => {
  const legTwoDirect = await getIndoorDirections(
    building,
    destinationConnectorRoom,
    destination,
    destinationFloor,
    destinationFloor,
    avoidStairsRouting,
  ).catch(() => null);
  let legTwo = hasValidRoutePoints(legTwoDirect) ? legTwoDirect : null;

  if (!legTwo) {
    const legTwoReverse = await getIndoorDirections(
      building,
      destination,
      destinationConnectorRoom,
      destinationFloor,
      destinationFloor,
      avoidStairsRouting,
    ).catch(() => null);
    if (hasValidRoutePoints(legTwoReverse)) {
      legTwo = reverseSameFloorRoute(
        legTwoReverse,
        destinationConnectorRoom,
        destination,
        destinationFloor,
      );
    }
  }

  legTwo ??= buildSyntheticSameFloorLeg({
    building,
    floor: destinationFloor,
    originRoomId: destinationConnectorRoom,
    destinationRoomId: destination,
    roomPoints: destinationRoomPoints,
  });
  return hasValidRoutePoints(legTwo) ? legTwo : null;
};

const tryRouteViaOriginConnector = async ({
  building,
  origin,
  destination,
  originFloor,
  destinationFloor,
  avoidStairsRouting,
  originConnector,
  destinationConnectors,
  destinationRoomPoints,
}: {
  building: string;
  origin: string;
  destination: string;
  originFloor: string;
  destinationFloor: string;
  avoidStairsRouting: boolean;
  originConnector: VerticalConnectorCandidate;
  destinationConnectors: VerticalConnectorCandidate[];
  destinationRoomPoints: RoomPoint[];
}): Promise<IndoorDirectionResponse | null> => {
  if (origin.toUpperCase() === originConnector.room.toUpperCase()) {
    return null;
  }

  const legOne = await getIndoorDirections(
    building,
    origin,
    originConnector.room,
    originFloor,
    originFloor,
    avoidStairsRouting,
  ).catch(() => null);
  if (!hasValidRoutePoints(legOne)) {
    return null;
  }

  const rankedDestinationConnectors = rankDestinationConnectors(
    originConnector,
    destinationConnectors,
  );

  for (const destinationConnector of rankedDestinationConnectors) {
    if (destination.toUpperCase() === destinationConnector.room.toUpperCase()) {
      continue;
    }

    const legTwo = await resolveSecondLeg({
      building,
      destinationConnectorRoom: destinationConnector.room,
      destination,
      destinationFloor,
      avoidStairsRouting,
      destinationRoomPoints,
    });
    if (!legTwo) {
      continue;
    }

    return mergeRoutesWithManualTransition(
      legOne,
      legTwo,
      originFloor,
      destinationFloor,
      avoidStairsRouting,
    );
  }

  return null;
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
    const route = await tryRouteViaOriginConnector({
      building,
      origin,
      destination,
      originFloor,
      destinationFloor,
      avoidStairsRouting,
      originConnector,
      destinationConnectors,
      destinationRoomPoints,
    });
    if (route) {
      return route;
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

const navigateStep = ({
  routeData,
  delta,
  currentFloorRef,
  syncFloorSelection,
  setCurrentStepIndex,
}: {
  routeData: IndoorDirectionResponse | null;
  delta: -1 | 1;
  currentFloorRef: React.RefObject<string>;
  syncFloorSelection: (newFloor: string) => void;
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
}) => {
  if (!routeData?.steps?.length) return;

  setCurrentStepIndex((currentIndex) => {
    const nextIndex = Math.max(
      0,
      Math.min(currentIndex + delta, routeData.steps.length - 1),
    );

    if (nextIndex !== currentIndex) {
      const nextFloor = getFloorForStepIndex(
        routeData,
        nextIndex,
        currentFloorRef.current,
      );
      if (nextFloor !== currentFloorRef.current) {
        syncFloorSelection(nextFloor);
      }
    }

    return nextIndex;
  });
};

function splitRoomsAndPois(
  roomPoints: RoomPoint[],
  apiPois: PoiItem[],
): {
  roomData: RoomMarkerData[] | undefined;
  poiData: PoiMarker[] | undefined;
} {
  const apiPoiIds = new Set(apiPois.map((p) => p.id.toUpperCase()));
  const rooms: RoomMarkerData[] = [];
  const pois: PoiMarker[] = [
    ...apiPois.map((p) => ({
      x: p.x,
      y: p.y,
      id: p.id,
      displayName: p.displayName,
      type: p.type,
    })),
  ];

  for (const r of roomPoints) {
    const type = inferPoiType(r.id);
    if (type && !apiPoiIds.has(r.id.toUpperCase())) {
      pois.push({
        x: r.x,
        y: r.y,
        id: r.id,
        displayName: getDisplayNameFromRoomId(r.id),
        type,
      });
    } else if (!type) {
      rooms.push({ x: r.x, y: r.y, id: r.id });
    }
  }

  return {
    roomData: rooms.length > 0 ? rooms : undefined,
    poiData: pois.length > 0 ? pois : undefined,
  };
}

type StepNavigationControlsProps = {
  totalSteps: number;
  showRouteDetails: boolean;
  directionsSnapIndex: number;
  canGoToPreviousStep: boolean;
  canGoToNextStep: boolean;
  visibleStepIndex: number;
  onStepChange: (delta: -1 | 1) => void;
};

const StepNavigationControls = ({
  totalSteps,
  showRouteDetails,
  directionsSnapIndex,
  canGoToPreviousStep,
  canGoToNextStep,
  visibleStepIndex,
  onStepChange,
}: StepNavigationControlsProps) => {
  const isVisible =
    totalSteps > 0 && (!showRouteDetails || directionsSnapIndex === 0);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.floorTransitionContainer}>
      <View style={styles.stepNavigationRow}>
        <TouchableOpacity
          testID="previous-step-button"
          style={[
            styles.stepNavigationButton,
            !canGoToPreviousStep && styles.stepNavigationButtonDisabled,
          ]}
          onPress={() => onStepChange(-1)}
          disabled={!canGoToPreviousStep}
        >
          <Text
            style={[
              styles.stepNavigationButtonText,
              !canGoToPreviousStep && styles.stepNavigationButtonTextDisabled,
            ]}
          >
            Previous Step
          </Text>
        </TouchableOpacity>

        <Text style={styles.stepProgressText}>
          Step {visibleStepIndex + 1} of {totalSteps}
        </Text>

        <TouchableOpacity
          testID="next-step-button"
          style={[
            styles.stepNavigationButton,
            !canGoToNextStep && styles.stepNavigationButtonDisabled,
          ]}
          onPress={() => onStepChange(1)}
          disabled={!canGoToNextStep}
        >
          <Text
            style={[
              styles.stepNavigationButtonText,
              !canGoToNextStep && styles.stepNavigationButtonTextDisabled,
            ]}
          >
            Next Step
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type ShuttleBannerProps = {
  nextShuttleTime?: string;
  routePhase: "origin" | "outdoor" | "destination";
  cardBackground: string;
  accentColor: string;
  textColor: string;
};

const ShuttleBanner = ({
  nextShuttleTime,
  routePhase,
  cardBackground,
  accentColor,
  textColor,
}: ShuttleBannerProps) => {
  if (!nextShuttleTime || routePhase !== "origin") {
    return null;
  }

  return (
    <View
      style={[
        styles.stairBanner,
        {
          bottom: 230,
          backgroundColor: cardBackground,
          borderLeftColor: accentColor,
        },
      ]}
    >
      <Text style={[styles.stairBannerText, { color: textColor }]}>
        Next Shuttle Bus: {nextShuttleTime}
      </Text>
    </View>
  );
};

type UniversalTransitionProps = {
  visible: boolean;
  endBuildingId: string;
  primaryColor: string;
  onPress: () => void;
};

const UniversalTransitionButton = ({
  visible,
  endBuildingId,
  primaryColor,
  onPress,
}: UniversalTransitionProps) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.universalTransitionContainer}>
      <TouchableOpacity
        style={[styles.transitionButton, { backgroundColor: primaryColor }]}
        onPress={onPress}
      >
        <Text style={styles.transitionButtonText}>
          Exit Building & Go to {endBuildingId}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function IndoorNavigation() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    buildingId?: string;
    floor?: string;
    startRoom?: string | string[];
    endRoom?: string | string[];
  }>();
  const { colors, isDark } = useTheme();

  const buildingId = (params.buildingId as BuildingId) || "H";
  const defaultFloor = getDefaultFloor(buildingId);
  const availableFloors = getAvailableFloors(buildingId);
  const initialFloor =
    params.floor && availableFloors.includes(params.floor)
      ? params.floor
      : defaultFloor;
  const initialStartRoom = getParamValue(params.startRoom);
  const initialEndRoom = getParamValue(params.endRoom);
  const [currentFloor, setCurrentFloor] = useState<string>(initialFloor);
  const backendBuildingId = getBackendBuildingId(buildingId, currentFloor);
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const currentFloorRef = useRef(currentFloor);
  useEffect(() => {
    currentFloorRef.current = currentFloor;
  }, [currentFloor]);

  useEffect(() => {}, [
    buildingId,
    currentFloor,
    backendBuildingId,
    availableFloors,
  ]);

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
  const [directionsSnapIndex, setDirectionsSnapIndex] = useState<number>(1);
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
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const routeRequestIdRef = useRef(0);

  const loadAllUniversityRooms = async () => {
    try {
      const roomsArrays = await Promise.all(buildUniversityRoomPromises());
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
      setRouteData(null);
      setUniversalRouteData(null);
      setShowRouteDetails(false);
      setDirectionsSnapIndex(1);
      setShowRoomList(false);
      setSelectingFor(null);
      handleClearRoute();
    }
  }, [buildingId, handleClearRoute, invalidatePendingRouteRequests]);

  const syncFloorSelection = useCallback((newFloor: string) => {
    setCurrentFloor(newFloor);
    routerRef.current.setParams({ floor: newFloor });
  }, []);

  const handleFloorChange = useCallback(
    (newFloor: string) => {
      invalidatePendingRouteRequests();
      mapViewRef.current?.clearRoute();

      syncFloorSelection(newFloor);

      setRouteData(retainCrossFloorRoute);
    },
    [invalidatePendingRouteRequests, syncFloorSelection],
  );

  const selectRoom = (room: string) => {
    applySelectedRoom({
      room,
      selectingFor,
      buildingId,
      setStartRoom,
      setEndRoom,
      setStartBuildingId,
      setEndBuildingId,
      closeSelector: () => {
        setShowRoomList(false);
        setSelectingFor(null);
        setSearchQuery("");
      },
    });
  };

  const swapLocations = () => {
    const tempRoom = startRoom;
    setStartRoom(endRoom);
    setEndRoom(tempRoom);

    setStartBuildingId(getBuildingFromRoom(endRoom, buildingId));
    setEndBuildingId(getBuildingFromRoom(tempRoom, buildingId));
  };

  const applyIndoorRouteResponse = useCallback(
    (
      response: IndoorDirectionResponse | null | undefined,
      requestId: number,
    ) => {
      if (requestId !== routeRequestIdRef.current) return;
      const hasValidRoute =
        !!response?.routePoints && response.routePoints.length > 0;
      if (hasValidRoute) {
        mapViewRef.current?.clearRoute();
        setRouteData(response);
        setUniversalRouteData(null);
        setCurrentStepIndex(0);
        setDirectionsSnapIndex(1);
        syncFloorSelection(response.startFloor);
      } else {
        handleClearRoute();
        setRouteData(null);
        setCurrentStepIndex(0);
        setDirectionsSnapIndex(1);
      }
    },
    [handleClearRoute, syncFloorSelection],
  );

  const applyUniversalRouteResponse = useCallback(
    (response: any, requestId: number) => {
      if (requestId !== routeRequestIdRef.current) return;
      if (response.startIndoorRoute) {
        mapViewRef.current?.clearRoute();
        setUniversalRouteData(response);
        setRouteData(response.startIndoorRoute);
        setRoutePhase("origin");
        setCurrentStepIndex(0);
        setDirectionsSnapIndex(1);
        syncFloorSelection(response.startIndoorRoute.startFloor);
      }
    },
    [syncFloorSelection],
  );

  const fetchRoute = useCallback(async () => {
    if (!startRoom || !endRoom || startRoom === endRoom) return;

    const requestId = routeRequestIdRef.current + 1;
    routeRequestIdRef.current = requestId;
    setIsLoadingRoute(true);

    try {
      const originFloor = getFloorFromRoom(startRoom, currentFloorRef.current);
      const destFloor = getFloorFromRoom(endRoom, currentFloorRef.current);

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
      setCurrentStepIndex(0);
      setDirectionsSnapIndex(1);
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
    avoidStairs,
    handleClearRoute,
    applyIndoorRouteResponse,
    applyUniversalRouteResponse,
  ]);

  useEffect(() => {
    void loadAllUniversityRooms();
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
      setCurrentStepIndex(0);
      setDirectionsSnapIndex(1);
    }
  }, [
    startRoom,
    endRoom,
    fetchRoute,
    handleClearRoute,
    invalidatePendingRouteRequests,
  ]);

  useEffect(() => {
    const activeFloors = getAvailableFloors(activeBuildingId);

    if (params.floor && activeFloors.includes(params.floor)) {
      setCurrentFloor(params.floor);
    }
  }, [params.floor, activeBuildingId]);

  useEffect(() => {
    const nextStartRoom = getParamValue(params.startRoom);
    const nextEndRoom = getParamValue(params.endRoom);

    setStartRoom(nextStartRoom);
    setEndRoom(nextEndRoom);
    setStartBuildingId(getBuildingFromRoom(nextStartRoom, buildingId));
    setEndBuildingId(getBuildingFromRoom(nextEndRoom, buildingId));
  }, [buildingId, params.endRoom, params.startRoom]);

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

  const displayedRoutePoints = getDisplayedRoutePoints(routeData, currentFloor);
  const totalSteps = routeData?.steps?.length ?? 0;
  const visibleStepIndex =
    totalSteps > 0 ? Math.min(currentStepIndex, totalSteps - 1) : 0;
  const canGoToPreviousStep = visibleStepIndex > 0;
  const canGoToNextStep = visibleStepIndex < totalSteps - 1;
  const { roomData, poiData } = splitRoomsAndPois(roomPoints, pois);
  const showUniversalTransition =
    !!universalRouteData && routePhase === "origin";

  const handleStepNavigation = useCallback(
    (delta: -1 | 1) =>
      navigateStep({
        routeData,
        delta,
        currentFloorRef,
        syncFloorSelection,
        setCurrentStepIndex,
      }),
    [routeData, syncFloorSelection],
  );

  useEffect(() => {
    setActiveBuildingId(buildingId);
  }, [buildingId]);

  const displayBuildingName = getDisplayBuildingName(routeData, buildingId);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.mapContainer}>
        <FloorPlanWebView
          ref={mapViewRef}
          buildingId={activeBuildingId}
          floorNumber={currentFloor}
          backgroundColor={colors.background}
          invertSvg={isDark}
          routePoints={displayedRoutePoints}
          roomData={roomData}
          poiData={poiData}
          onPoiTap={handlePoiTap}
          onRoomTap={handleRoomTap}
        />
      </View>

      {getAvailableFloors(activeBuildingId).length > 1 && (
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
        <View
          style={[
            styles.stairBanner,
            { backgroundColor: colors.card, borderLeftColor: colors.primary },
          ]}
        >
          <Text style={[styles.stairBannerText, { color: colors.text }]}>
            🚶 {routeData.stairMessage}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.accessibilityToggleContainer,
          { backgroundColor: colors.card },
        ]}
      >
        <Text style={[styles.accessibilityText, { color: colors.text }]}>
          Avoid Stairs / Wheelchair Accessible
        </Text>
        <Switch
          value={avoidStairs}
          onValueChange={setAvoidStairs}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={avoidStairs ? "#fff" : "#f4f3f4"}
        />
      </View>

      {routeData &&
        Boolean(routeData.startFloor) &&
        Boolean(routeData.endFloor) &&
        routeData.startFloor !== routeData.endFloor && (
          <View style={styles.multiFloorTransitionContainer}>
            {currentFloor === routeData.startFloor && (
              <TouchableOpacity
                style={[
                  styles.transitionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => handleFloorChange(routeData.endFloor)}
              >
                <Text style={styles.transitionButtonText}>
                  Go to Floor {routeData.endFloor}
                </Text>
              </TouchableOpacity>
            )}
            {currentFloor === routeData.endFloor && (
              <TouchableOpacity
                style={[
                  styles.transitionButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => handleFloorChange(routeData.startFloor)}
              >
                <Text style={styles.transitionButtonText}>
                  Back to Floor {routeData.startFloor}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      <StepNavigationControls
        totalSteps={totalSteps}
        showRouteDetails={showRouteDetails}
        directionsSnapIndex={directionsSnapIndex}
        canGoToPreviousStep={canGoToPreviousStep}
        canGoToNextStep={canGoToNextStep}
        visibleStepIndex={visibleStepIndex}
        onStepChange={handleStepNavigation}
      />

      <ShuttleBanner
        nextShuttleTime={universalRouteData?.nextShuttleTime}
        routePhase={routePhase}
        cardBackground={colors.card}
        accentColor={colors.primary}
        textColor={colors.primary}
      />

      <UniversalTransitionButton
        visible={showUniversalTransition}
        endBuildingId={endBuildingId}
        primaryColor={colors.primary}
        onPress={() => {
          if (!universalRouteData) {
            return;
          }

          setRoutePhase("destination");
          setRouteData(universalRouteData.endIndoorRoute);
          setCurrentStepIndex(0);
          setDirectionsSnapIndex(1);
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
      />

      {!showRouteDetails && (
        <BottomPanel
          startRoom={startRoom}
          endRoom={endRoom}
          routeData={routeData}
          isLoadingRoute={isLoadingRoute}
          showDirections={showRouteDetails}
          onToggleDirections={() => {
            setDirectionsSnapIndex(1);
            setShowRouteDetails(true);
          }}
        />
      )}

      <DirectionsPanel
        routeData={routeData}
        currentStepIndex={visibleStepIndex}
        visible={showRouteDetails}
        onClose={() => {
          setDirectionsSnapIndex(1);
          setShowRouteDetails(false);
        }}
        onSnapIndexChange={setDirectionsSnapIndex}
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
  },
  stairBannerText: {
    fontSize: 14,
    fontWeight: "600",
  },

  accessibilityToggleContainer: {
    position: "absolute",
    top: 200,
    left: 16,
    right: 16,
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
  },
  floorTransitionContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 170 : 150,
    alignSelf: "center",
    zIndex: 15,
  },
  /** Sits above step navigation so both can show on multi-floor routes */
  multiFloorTransitionContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 240 : 220,
    alignSelf: "center",
    zIndex: 14,
  },
  universalTransitionContainer: {
    position: "absolute",
    bottom: 330,
    alignSelf: "center",
    zIndex: 15,
  },
  stepNavigationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepNavigationButton: {
    backgroundColor: "#8B1538",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  stepNavigationButtonDisabled: {
    backgroundColor: "#D7D7D7",
    shadowOpacity: 0,
    elevation: 0,
  },
  stepNavigationButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  stepNavigationButtonTextDisabled: {
    color: "#7A7A7A",
  },
  stepProgressText: {
    color: "#333333",
    fontSize: 14,
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  transitionButton: {
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
