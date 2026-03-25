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
import { getAllOutdoorDirectionsInfo } from "../api";
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
import { BUILDINGS, BuildingId } from "../data/buildings";
import { OutdoorDirectionResponse } from "../api/outdoorDirectionsApi";
import {
  getBackendBuildingId,
  getDefaultFloor,
  getAvailableFloors,
} from "../utils/buildingIndoorMaps";
import { NAVIGATION_STATE } from "../const";
import { useNavigationStore } from "../hooks/useNavigationState";
import { useNavigationEndpointsStore } from "../hooks/useNavigationEndpoints";
import useNavigationConfig from "../hooks/useNavigationConfig";
import useNavigationInfo from "../hooks/useNavigationInfo";
import useNavigationProgress from "../hooks/useNavigationProgress";
import { useIndoorHandoffStore } from "../hooks/useIndoorHandoffStore";
import { EventIndoorTarget } from "../utils/eventIndoorNavigation";
import { useTheme } from "../hooks/useTheme";
import {
  inferPoiType,
  getDisplayNameFromRoomId,
} from "../utils/floorPlanPoiUtils";
import {
  TRANSPORT_MODE_API_MAP,
  TransportMode,
  TransportModeApi,
} from "../type";
import type { LabeledCoordinate } from "../hooks/useNavigationEndpoints";

const MAX_DURATION_REGEX_INPUT_LENGTH = 128;
const MAX_DISTANCE_REGEX_INPUT_LENGTH = 64;
const DISTANCE_KM_REGEX = /^(\d+(?:\.\d+)?)[ \t]{0,4}km$/i;
const DISTANCE_METER_REGEX = /^(\d+(?:\.\d+)?)[ \t]{0,4}m$/i;
const BASEMENT_FLOOR_REGEX = /^S(\d+)$/i;
const DURATION_HOUR_REGEX = /\b(\d{1,3})[ \t]{0,4}hours?\b/i;
const DURATION_MINUTE_REGEX = /\b(\d{1,3})[ \t]{0,4}mins?\b/i;
const TURN_THRESHOLD_DEG = 70;
const UTURN_THRESHOLD_DEG = 150;
const MIN_SEGMENT_PX = 12;

const getParamValue = (value?: string | string[]) =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

const parseOutdoorResumeEndpoint = (
  latitudeValue?: string | string[],
  longitudeValue?: string | string[],
  labelValue?: string | string[],
  buildingIdValue?: string | string[],
): LabeledCoordinate | null => {
  const latitude = Number(getParamValue(latitudeValue));
  const longitude = Number(getParamValue(longitudeValue));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const label = getParamValue(labelValue) || "Selected Location";
  const buildingId = getParamValue(buildingIdValue) as BuildingId | "";

  return {
    latitude,
    longitude,
    label,
    buildingId: buildingId || undefined,
  };
};

const getFloorFromRoom = (roomId: string, fallbackFloor: string) => {
  if (!roomId) return fallbackFloor;
  const normalizedRoom = roomId.trim().toUpperCase();

  if (normalizedRoom.startsWith("CC-")) {
    return "1";
  }

  // Explicit building-floor-room format, e.g. MB-S2-330 or MB-1-210.
  // Limit the floor token so room ids like CC-106-2 are not misread as floor 106.
  const explicitFloorMatch = /^[A-Z]{1,4}-(S\d{1,2}|\d{1,2})-/.exec(
    normalizedRoom,
  );
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

  if (/^\d{3,4}$/.test(roomPart)) {
    return roomPart[0];
  }

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

const getBuildingFromRoom = (
  roomId: string,
  fallbackBuilding: BuildingId,
): BuildingId => {
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

const getStartRoomSearchSeed = (buildingId: BuildingId): string => buildingId;

const getBuildingMarker = (buildingId: BuildingId) =>
  BUILDINGS.find((building) => building.id === buildingId)?.marker ?? null;

const getKnownExitRoom = (buildingId: BuildingId): string | null => {
  switch (buildingId) {
    case "H":
      return "H1-Maisonneuve-Entry";
    case "LB":
      return "LB2-Emergency-Exit-1";
    case "MB":
      return "MB1-Main-Entrance";
    case "VL":
      return "VL-101";
    case "VE":
      return "VE1-Entrance/exit";
    case "CC":
      return "CC-Entrance-Exit";
    default:
      return null;
  }
};

const getOutdoorNavigationMode = (
  mode: TransportModeApi | undefined,
): TransportMode => {
  switch (mode) {
    case "bicycling":
      return "BIKE";
    case "driving":
      return "CAR";
    case "transit":
      return "BUS";
    case "shuttle":
      return "SHUTTLE";
    case "walking":
    default:
      return "WALK";
  }
};

const getFirstRoomLabel = (
  route: IndoorDirectionResponse | null | undefined,
): string | null =>
  route?.routePoints.find(
    (point) => point.label && !point.label.startsWith("TRANSITION_"),
  )?.label ?? null;

const getLastRoomLabel = (
  route: IndoorDirectionResponse | null | undefined,
): string | null => {
  const points = route?.routePoints;
  if (!points?.length) return null;

  for (let i = points.length - 1; i >= 0; i -= 1) {
    const label = points[i]?.label;
    if (label && !label.startsWith("TRANSITION_")) {
      return label;
    }
  }

  return null;
};

const labelsMatch = (left?: string | null, right?: string | null) =>
  !!left && !!right && left.toUpperCase() === right.toUpperCase();

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
    if (stepIndex <= transitionStepIndex) {
      return response.startFloor;
    }

    return response.steps[stepIndex]?.floor || response.endFloor;
  }

  return response.steps[stepIndex]?.floor || response.startFloor;
};

const getDisplayedRoutePoints = (
  routeData: IndoorDirectionResponse | null,
  currentFloor: string,
  currentStepIndex: number,
) => {
  const points = routeData?.routePoints;
  if (!points || points.length === 0) return undefined;

  const floorPoints = getRoutePointsForFloorLeg(routeData, currentFloor);
  if (!floorPoints?.length) {
    return undefined;
  }

  if (floorPoints.length < 2) {
    return floorPoints;
  }

  const decisionIndices = getDecisionPointIndices(floorPoints);
  const movementStepCount = decisionIndices.length;
  const progressIndex = getMovementProgressForFloorLeg(
    routeData,
    currentFloor,
    currentStepIndex,
    movementStepCount,
  );

  if (progressIndex >= movementStepCount) {
    return floorPoints.at(-1)
      ? [floorPoints[floorPoints.length - 1]]
      : undefined;
  }

  return floorPoints.slice(decisionIndices[progressIndex]);
};

const getRoutePointsForFloorLeg = (
  routeData: IndoorDirectionResponse | null,
  currentFloor: string,
) => {
  if (!routeData) {
    return undefined;
  }

  const points = routeData?.routePoints;
  if (!points?.length) {
    return undefined;
  }

  const transitionIndex = points.findIndex((point) =>
    point.label?.startsWith("TRANSITION_"),
  );

  if (transitionIndex === -1) {
    return points;
  }

  const { startFloor, endFloor } = routeData;
  if (currentFloor === startFloor) {
    const startLegPoints = points.slice(0, transitionIndex);
    // Some tests and sparse mocked routes omit the duplicated connector point
    // that the backend normally emits before the transition marker.
    return startLegPoints.length >= 2
      ? startLegPoints
      : points.slice(0, transitionIndex + 1);
  }

  if (currentFloor === endFloor) {
    const endLegStartIndex = Math.min(transitionIndex + 1, points.length - 1);
    const endLegPoints = points.slice(endLegStartIndex);
    return endLegPoints.length >= 2
      ? endLegPoints
      : points.slice(transitionIndex);
  }

  return undefined;
};

const getMovementProgressForFloorLeg = (
  routeData: IndoorDirectionResponse | null,
  currentFloor: string,
  currentStepIndex: number,
  movementStepCount: number,
) => {
  if (!routeData?.steps?.length || movementStepCount <= 0) {
    return 0;
  }

  const clampedStepIndex = Math.max(
    0,
    Math.min(currentStepIndex, routeData.steps.length - 1),
  );

  if (routeData.startFloor === routeData.endFloor) {
    return Math.min(clampedStepIndex, movementStepCount);
  }

  const transitionStepIndex = getVerticalTransitionStepIndex(routeData);
  if (transitionStepIndex < 0) {
    return Math.min(clampedStepIndex, movementStepCount);
  }

  if (currentFloor === routeData.startFloor) {
    return clampedStepIndex < transitionStepIndex
      ? clampedStepIndex
      : movementStepCount;
  }

  if (currentFloor === routeData.endFloor) {
    const destinationLegStepIndex =
      clampedStepIndex - (transitionStepIndex + 1);
    return Math.max(0, Math.min(destinationLegStepIndex, movementStepCount));
  }

  return 0;
};

const sumSegmentDistance = (
  routePoints: IndoorDirectionResponse["routePoints"],
  startSegment: number,
  endSegmentExclusive: number,
) => {
  let distance = 0;
  for (let i = startSegment; i < endSegmentExclusive; i += 1) {
    const start = routePoints[i];
    const end = routePoints[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    distance += Math.sqrt(dx * dx + dy * dy);
  }
  return distance;
};

const classifyTurnAtPoint = (
  previous: IndoorDirectionResponse["routePoints"][number],
  current: IndoorDirectionResponse["routePoints"][number],
  next: IndoorDirectionResponse["routePoints"][number],
): "STRAIGHT" | "TURN_LEFT" | "TURN_RIGHT" | "TURN_AROUND" => {
  const ax = current.x - previous.x;
  const ay = current.y - previous.y;
  const bx = next.x - current.x;
  const by = next.y - current.y;

  const lenA = Math.sqrt(ax * ax + ay * ay);
  const lenB = Math.sqrt(bx * bx + by * by);
  if (lenA < 0.001 || lenB < 0.001) return "STRAIGHT";

  const dot = ax * bx + ay * by;
  const cosAngle = Math.max(-1, Math.min(1, dot / (lenA * lenB)));
  const angleDeg = (Math.acos(cosAngle) * 180) / Math.PI;

  if (angleDeg < TURN_THRESHOLD_DEG) return "STRAIGHT";
  if (angleDeg >= UTURN_THRESHOLD_DEG) return "TURN_AROUND";

  const cross = ax * by - ay * bx;
  return cross > 0 ? "TURN_RIGHT" : "TURN_LEFT";
};

const getDecisionPointIndices = (
  routePoints: IndoorDirectionResponse["routePoints"],
) => {
  if (!routePoints.length) return [];

  const decisionIndices = [0];
  const decisionManeuvers: Array<ReturnType<typeof classifyTurnAtPoint>> = [
    "STRAIGHT",
  ];
  let anchorIndex = 0;

  for (let i = 1; i < routePoints.length - 1; i += 1) {
    const segmentDistance = sumSegmentDistance(routePoints, anchorIndex, i);
    if (segmentDistance < MIN_SEGMENT_PX) {
      continue;
    }

    const turn = classifyTurnAtPoint(
      routePoints[anchorIndex],
      routePoints[i],
      routePoints[i + 1],
    );
    const previousTurn = decisionManeuvers[decisionManeuvers.length - 1];
    if (turn !== "STRAIGHT" && turn !== previousTurn) {
      decisionIndices.push(i);
      decisionManeuvers.push(turn);
      anchorIndex = i;
    }
  }

  return decisionIndices;
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
  setStartBuildingId: React.Dispatch<React.SetStateAction<BuildingId>>;
  setEndBuildingId: React.Dispatch<React.SetStateAction<BuildingId>>;
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

const buildDestinationIndoorTarget = ({
  route,
  fallbackBuildingId,
  intendedDestinationRoom,
}: {
  route: IndoorDirectionResponse;
  fallbackBuildingId: BuildingId;
  intendedDestinationRoom: string;
}): EventIndoorTarget => {
  const firstRoom = getFirstRoomLabel(route);
  const lastRoom = getLastRoomLabel(route);
  const resolvedBuildingId = getBuildingFromRoom(
    firstRoom || lastRoom || "",
    fallbackBuildingId,
  );
  const knownExitRoom = getKnownExitRoom(resolvedBuildingId);

  const isReversed =
    labelsMatch(firstRoom, intendedDestinationRoom) ||
    (!labelsMatch(lastRoom, intendedDestinationRoom) &&
      labelsMatch(lastRoom, knownExitRoom));

  return {
    buildingId: resolvedBuildingId,
    floor: isReversed ? route.startFloor : route.endFloor,
    startFloor: isReversed ? route.endFloor : route.startFloor,
    floorSupported: true,
    destinationRoom: isReversed
      ? firstRoom || intendedDestinationRoom
      : lastRoom || intendedDestinationRoom,
    startRoom: isReversed
      ? lastRoom || knownExitRoom || null
      : firstRoom || knownExitRoom || null,
  };
};

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
  setCurrentStepIndex,
}: {
  routeData: IndoorDirectionResponse | null;
  delta: -1 | 1;
  setCurrentStepIndex: React.Dispatch<React.SetStateAction<number>>;
}) => {
  if (!routeData?.steps?.length) return;

  setCurrentStepIndex((currentIndex) =>
    Math.max(0, Math.min(currentIndex + delta, routeData.steps.length - 1)),
  );
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
  nextActionLabel?: string;
  onNextAction?: () => void;
};

const StepNavigationControls = ({
  totalSteps,
  showRouteDetails,
  directionsSnapIndex: _directionsSnapIndex,
  canGoToPreviousStep,
  canGoToNextStep,
  visibleStepIndex,
  onStepChange,
  nextActionLabel,
  onNextAction,
}: StepNavigationControlsProps) => {
  const isVisible = totalSteps > 0 && showRouteDetails;

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

        {nextActionLabel && !canGoToNextStep ? (
          <TouchableOpacity
            testID="next-action-button"
            style={styles.stepNavigationButton}
            onPress={onNextAction}
          >
            <Text style={styles.stepNavigationButtonText}>
              {nextActionLabel}
            </Text>
          </TouchableOpacity>
        ) : (
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
        )}
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
  label: string;
  primaryColor: string;
  onPress: () => void;
};

const UniversalTransitionButton = ({
  visible,
  label,
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
        <Text style={styles.transitionButtonText}>{label}</Text>
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
    resumeOutdoorNavigation?: string;
    resumeOutdoorNavigationToken?: string;
    forceBuildingId?: string;
    returnOutdoorOriginLat?: string;
    returnOutdoorOriginLng?: string;
    returnOutdoorOriginLabel?: string;
    returnOutdoorOriginBuildingId?: string;
    returnOutdoorDestinationLat?: string;
    returnOutdoorDestinationLng?: string;
    returnOutdoorDestinationLabel?: string;
    returnOutdoorDestinationBuildingId?: string;
    returnOutdoorMode?: string;
    globalOriginRoom?: string;
    globalOriginBuildingId?: string;
    globalDestinationRoom?: string;
    globalDestinationBuildingId?: string;
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
  const [startBuildingId, setStartBuildingId] =
    useState<BuildingId>(buildingId);
  const [endBuildingId, setEndBuildingId] = useState<BuildingId>(buildingId);
  const [universalRouteData, setUniversalRouteData] = useState<any>(null);
  const [routePhase, setRoutePhase] = useState<
    "origin" | "outdoor" | "destination"
  >("origin");
  const [activeBuildingId, setActiveBuildingId] =
    useState<BuildingId>(buildingId);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const routeRequestIdRef = useRef(0);
  const lastAutoOpenTokenRef = useRef<string | null>(null);
  const manualFloorSelectionRef = useRef(false);
  const paramStartRoom = getParamValue(params.startRoom);
  const paramEndRoom = getParamValue(params.endRoom);
  const isForcedBuildingFlow = params.forceBuildingId === "1";
  const shouldWaitForParamDrivenRouteSync =
    isForcedBuildingFlow || (!!paramStartRoom && !!paramEndRoom);
  const expectedParamStartBuildingId = isForcedBuildingFlow
    ? buildingId
    : getBuildingFromRoom(paramStartRoom, buildingId);
  const expectedParamEndBuildingId = isForcedBuildingFlow
    ? buildingId
    : getBuildingFromRoom(paramEndRoom, buildingId);
  const activeFloors = getAvailableFloors(activeBuildingId);
  const effectiveCurrentFloor = activeFloors.includes(currentFloor)
    ? currentFloor
    : getDefaultFloor(activeBuildingId);
  const returnOutdoorOrigin = parseOutdoorResumeEndpoint(
    params.returnOutdoorOriginLat,
    params.returnOutdoorOriginLng,
    params.returnOutdoorOriginLabel,
    params.returnOutdoorOriginBuildingId,
  );
  const returnOutdoorDestination = parseOutdoorResumeEndpoint(
    params.returnOutdoorDestinationLat,
    params.returnOutdoorDestinationLng,
    params.returnOutdoorDestinationLabel,
    params.returnOutdoorDestinationBuildingId,
  );
  const returnOutdoorMode = getParamValue(params.returnOutdoorMode) as
    | TransportMode
    | "";
  const globalOriginRoom = getParamValue(params.globalOriginRoom);
  const globalOriginBuildingId = getParamValue(
    params.globalOriginBuildingId,
  ) as BuildingId | "";
  const globalDestinationRoom = getParamValue(params.globalDestinationRoom);
  const globalDestinationBuildingId = getParamValue(
    params.globalDestinationBuildingId,
  ) as BuildingId | "";
  const currentFloorRef = useRef(currentFloor);

  useEffect(() => {
    currentFloorRef.current = effectiveCurrentFloor;
  }, [effectiveCurrentFloor]);

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
      manualFloorSelectionRef.current = true;

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
    const shouldRestartFromGlobalSwap =
      isForcedBuildingFlow &&
      !!globalOriginRoom &&
      !!globalOriginBuildingId &&
      !!globalDestinationRoom &&
      !!globalDestinationBuildingId;
    const newStartRoom = shouldRestartFromGlobalSwap
      ? globalDestinationRoom
      : endRoom;
    const newEndRoom = shouldRestartFromGlobalSwap
      ? globalOriginRoom
      : startRoom;
    const newStartBuilding = shouldRestartFromGlobalSwap
      ? globalDestinationBuildingId
      : getBuildingFromRoom(newStartRoom, buildingId);
    const newEndBuilding = shouldRestartFromGlobalSwap
      ? globalOriginBuildingId
      : getBuildingFromRoom(newEndRoom, buildingId);
    const newStartFloor = newStartRoom
      ? getFloorFromRoom(newStartRoom, currentFloorRef.current)
      : getDefaultFloor(newStartBuilding);

    invalidatePendingRouteRequests();
    handleClearRoute();
    setRouteData(null);
    setUniversalRouteData(null);
    setRoutePhase("origin");
    setShowRouteDetails(false);
    setDirectionsSnapIndex(1);
    setCurrentStepIndex(0);
    setShowRoomList(false);
    setSelectingFor(null);
    setSearchQuery("");

    setStartRoom(newStartRoom);
    setEndRoom(newEndRoom);
    setStartBuildingId(newStartBuilding);
    setEndBuildingId(newEndBuilding);
    setActiveBuildingId(newStartBuilding);
    setCurrentFloor(newStartFloor);
    routerRef.current.setParams({
      buildingId: newStartBuilding,
      floor: newStartFloor,
      startRoom: newStartRoom,
      endRoom: newEndRoom,
      forceBuildingId: "0",
      resumeOutdoorNavigation: "0",
      resumeOutdoorNavigationToken: "",
      returnOutdoorOriginLat: "",
      returnOutdoorOriginLng: "",
      returnOutdoorOriginLabel: "",
      returnOutdoorOriginBuildingId: "",
      returnOutdoorDestinationLat: "",
      returnOutdoorDestinationLng: "",
      returnOutdoorDestinationLabel: "",
      returnOutdoorDestinationBuildingId: "",
      returnOutdoorMode: "",
      globalOriginRoom: newStartRoom,
      globalOriginBuildingId: newStartBuilding,
      globalDestinationRoom: newEndRoom,
      globalDestinationBuildingId: newEndBuilding,
    });
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
        setActiveBuildingId(startBuildingId);
        syncFloorSelection(response.startIndoorRoute.startFloor);
      }
    },
    [startBuildingId, syncFloorSelection],
  );

  const fetchRoute = useCallback(async () => {
    if (!startRoom || !endRoom || startRoom === endRoom) return;
    if (
      shouldWaitForParamDrivenRouteSync &&
      (startRoom !== paramStartRoom ||
        endRoom !== paramEndRoom ||
        startBuildingId !== expectedParamStartBuildingId ||
        endBuildingId !== expectedParamEndBuildingId)
    ) {
      return;
    }

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
    expectedParamEndBuildingId,
    expectedParamStartBuildingId,
    avoidStairs,
    handleClearRoute,
    paramEndRoom,
    paramStartRoom,
    shouldWaitForParamDrivenRouteSync,
    applyIndoorRouteResponse,
    applyUniversalRouteResponse,
  ]);

  useEffect(() => {
    void loadAllUniversityRooms();
  }, []);

  useEffect(() => {
    const autoOpenToken = getParamValue(params.resumeOutdoorNavigationToken);

    if (
      params.resumeOutdoorNavigation !== "1" ||
      startRoom ||
      !autoOpenToken ||
      lastAutoOpenTokenRef.current === autoOpenToken ||
      availableRooms.length === 0
    ) {
      return;
    }

    lastAutoOpenTokenRef.current = autoOpenToken;
    setSelectingFor("start");
    setSearchQuery(getStartRoomSearchSeed(buildingId));
    setShowRoomList(true);
  }, [
    availableRooms.length,
    buildingId,
    effectiveCurrentFloor,
    params.resumeOutdoorNavigation,
    params.resumeOutdoorNavigationToken,
    startRoom,
  ]);

  useEffect(() => {
    const loadRoomPoints = async () => {
      if (!activeBuildingId || !effectiveCurrentFloor) return;

      try {
        const points = await getRoomPoints(
          activeBuildingId,
          effectiveCurrentFloor,
        );
        setRoomPoints(points);
      } catch (error) {
        console.error("Failed to load room points:", error);
        setRoomPoints([]);
      }
    };
    loadRoomPoints();
  }, [activeBuildingId, effectiveCurrentFloor]);

  useEffect(() => {
    const loadPois = async () => {
      if (!activeBuildingId || !effectiveCurrentFloor) return;

      try {
        const items = await getPointsOfInterest(
          activeBuildingId,
          effectiveCurrentFloor,
        );
        setPois(items);
      } catch (error) {
        console.error("Failed to load POIs:", error);
      }
    };
    loadPois();
  }, [activeBuildingId, effectiveCurrentFloor]);

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
    if (!routeData?.steps?.length) {
      return;
    }

    if (manualFloorSelectionRef.current) {
      manualFloorSelectionRef.current = false;
      return;
    }

    const stepIndex = Math.min(currentStepIndex, routeData.steps.length - 1);
    const nextFloor = getFloorForStepIndex(
      routeData,
      stepIndex,
      effectiveCurrentFloor,
    );

    if (nextFloor !== effectiveCurrentFloor) {
      syncFloorSelection(nextFloor);
    }
  }, [currentStepIndex, effectiveCurrentFloor, routeData, syncFloorSelection]);

  useEffect(() => {
    const nextActiveFloors = getAvailableFloors(activeBuildingId);

    if (params.floor && nextActiveFloors.includes(params.floor)) {
      setCurrentFloor(params.floor);
      return;
    }

    const fallbackFloor = getDefaultFloor(activeBuildingId);
    setCurrentFloor((previousFloor) =>
      previousFloor === fallbackFloor ? previousFloor : fallbackFloor,
    );
  }, [activeBuildingId, params.floor]);

  useEffect(() => {
    setStartRoom(paramStartRoom);
    setEndRoom(paramEndRoom);
    setStartBuildingId(expectedParamStartBuildingId);
    setEndBuildingId(expectedParamEndBuildingId);
    if (isForcedBuildingFlow) {
      setActiveBuildingId(buildingId);
    }
  }, [
    buildingId,
    expectedParamEndBuildingId,
    expectedParamStartBuildingId,
    isForcedBuildingFlow,
    paramEndRoom,
    paramStartRoom,
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

  const totalSteps = routeData?.steps?.length ?? 0;
  const visibleStepIndex =
    totalSteps > 0 ? Math.min(currentStepIndex, totalSteps - 1) : 0;
  const displayedRoutePoints = getDisplayedRoutePoints(
    routeData,
    effectiveCurrentFloor,
    visibleStepIndex,
  );
  const canGoToPreviousStep = visibleStepIndex > 0;
  const canGoToNextStep = visibleStepIndex < totalSteps - 1;
  const { roomData, poiData } = splitRoomsAndPois(roomPoints, pois);
  const showUniversalOutdoorContinuation =
    !!universalRouteData && routePhase === "origin" && !!routeData;
  const showOutdoorContinuation =
    params.resumeOutdoorNavigation === "1" &&
    !!routeData &&
    !!startRoom &&
    !!endRoom;
  const isForcedTargetBuildingFlow = isForcedBuildingFlow;
  const knownExitRoom = getKnownExitRoom(buildingId);
  const showForcedFlowOutdoorContinuation =
    isForcedTargetBuildingFlow &&
    !!routeData &&
    !!endRoom &&
    !!knownExitRoom &&
    endRoom.toUpperCase() === knownExitRoom.toUpperCase();
  const showArrivalAction =
    !!routeData &&
    !!endRoom &&
    !showOutdoorContinuation &&
    !showUniversalOutdoorContinuation &&
    !showForcedFlowOutdoorContinuation;

  const handleStepNavigation = useCallback(
    (delta: -1 | 1) =>
      navigateStep({
        routeData,
        delta,
        setCurrentStepIndex,
      }),
    [routeData],
  );

  const handleArrival = useCallback(() => {
    invalidatePendingRouteRequests();
    handleClearRoute();
    setRouteData(null);
    setUniversalRouteData(null);
    setShowRouteDetails(false);
    setDirectionsSnapIndex(1);
    setCurrentStepIndex(0);
    setStartRoom("");
    setEndRoom("");
    setSelectingFor(null);
    setShowRoomList(false);
    setSearchQuery("");

    useNavigationStore.getState().setNavigationState(NAVIGATION_STATE.IDLE);
    useNavigationEndpointsStore.getState().clear();
    useNavigationConfig.getState().setAllOutdoorRoutes([]);
    useNavigationInfo.getState().setPathDistance("0");
    useNavigationInfo.getState().setPathDuration("0");
    useNavigationInfo.getState().setIsLoading(false);
    useNavigationProgress.getState().resetProgress();

    router.replace("/(home-page)");
  }, [handleClearRoute, invalidatePendingRouteRequests, router]);

  const handleUniversalOutdoorContinuation = useCallback(() => {
    if (!universalRouteData) {
      return;
    }

    const outdoorRoute =
      universalRouteData.outdoorRoute as OutdoorDirectionResponse | null;
    const originMarker = getBuildingMarker(startBuildingId);
    const destinationIndoorTarget = buildDestinationIndoorTarget({
      route: universalRouteData.endIndoorRoute,
      fallbackBuildingId: endBuildingId,
      intendedDestinationRoom: endRoom,
    });
    const destinationBuildingId = destinationIndoorTarget.buildingId;
    const destinationMarker = getBuildingMarker(destinationBuildingId);

    if (!outdoorRoute || !destinationMarker) {
      setRoutePhase("destination");
      setRouteData(universalRouteData.endIndoorRoute);
      setCurrentStepIndex(0);
      setDirectionsSnapIndex(1);
      setActiveBuildingId(destinationBuildingId);
      handleFloorChange(
        destinationIndoorTarget.startFloor ??
          universalRouteData.endIndoorRoute.startFloor,
      );

      setTimeout(() => {
        if (mapViewRef.current) {
          mapViewRef.current.drawRoute(
            universalRouteData.endIndoorRoute.routePoints,
          );
        }
      }, 500);
      return;
    }

    useIndoorHandoffStore.getState().setPendingIndoorTarget({
      ...destinationIndoorTarget,
      globalOriginRoom: startRoom || null,
      globalOriginBuildingId: startBuildingId,
      globalDestinationRoom:
        destinationIndoorTarget.destinationRoom || endRoom || null,
      globalDestinationBuildingId: destinationBuildingId,
    });
    useNavigationStore
      .getState()
      .setNavigationState(NAVIGATION_STATE.NAVIGATING);
    useNavigationEndpointsStore.getState().setOrigin(
      originMarker
        ? {
            ...originMarker,
            label:
              universalRouteData.startIndoorRoute?.buildingName ||
              startBuildingId,
            buildingId: startBuildingId,
          }
        : null,
    );
    useNavigationEndpointsStore.getState().setDestination({
      ...destinationMarker,
      label:
        universalRouteData.endIndoorRoute.buildingName || destinationBuildingId,
      buildingId: destinationBuildingId,
    });
    useNavigationConfig
      .getState()
      .setNavigationMode(getOutdoorNavigationMode(outdoorRoute.transportMode));
    useNavigationConfig.getState().setAllOutdoorRoutes([outdoorRoute]);
    useNavigationInfo.getState().setPathDistance(outdoorRoute.distance);
    useNavigationInfo.getState().setPathDuration(outdoorRoute.duration);
    useNavigationInfo.getState().setIsLoading(false);
    useNavigationProgress.getState().resetProgress();

    router.replace("/(home-page)");
  }, [
    endBuildingId,
    endRoom,
    handleFloorChange,
    router,
    startBuildingId,
    universalRouteData,
  ]);

  const handleForcedOutdoorContinuation = useCallback(async () => {
    const reverseOrigin = returnOutdoorDestination;
    const reverseDestination = returnOutdoorOrigin;

    if (reverseOrigin && reverseDestination) {
      try {
        const routes = await getAllOutdoorDirectionsInfo(
          {
            latitude: reverseOrigin.latitude,
            longitude: reverseOrigin.longitude,
            buildingId: reverseOrigin.buildingId,
          },
          {
            latitude: reverseDestination.latitude,
            longitude: reverseDestination.longitude,
            buildingId: reverseDestination.buildingId,
          },
        );

        if (routes.length > 0) {
          const preferredMode =
            returnOutdoorMode && TRANSPORT_MODE_API_MAP[returnOutdoorMode]
              ? returnOutdoorMode
              : "WALK";
          const preferredApiMode = TRANSPORT_MODE_API_MAP[preferredMode];
          const preferredRoute =
            routes.find(
              (route) =>
                route.transportMode?.toLowerCase() === preferredApiMode,
            ) ?? routes[0];

          useNavigationEndpointsStore.getState().setOrigin(reverseOrigin);
          useNavigationEndpointsStore
            .getState()
            .setDestination(reverseDestination);
          useNavigationConfig
            .getState()
            .setNavigationMode(
              preferredRoute?.transportMode
                ? getOutdoorNavigationMode(preferredRoute.transportMode)
                : preferredMode,
            );
          useNavigationConfig.getState().setAllOutdoorRoutes(routes);
          useNavigationInfo.getState().setPathDistance(preferredRoute.distance);
          useNavigationInfo.getState().setPathDuration(preferredRoute.duration);
          useNavigationInfo.getState().setIsLoading(false);
          useNavigationProgress.getState().resetProgress();
        }
      } catch (error) {
        console.warn("Failed to rebuild outdoor continuation:", error);
      }
    }

    useNavigationStore
      .getState()
      .setNavigationState(NAVIGATION_STATE.NAVIGATING);
    router.replace("/(home-page)");
  }, [
    returnOutdoorDestination,
    returnOutdoorMode,
    returnOutdoorOrigin,
    router,
  ]);

  useEffect(() => {
    setActiveBuildingId(buildingId);
  }, [buildingId]);

  const displayBuildingName = getDisplayBuildingName(
    routeData,
    activeBuildingId,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.mapContainer}>
        <FloorPlanWebView
          ref={mapViewRef}
          buildingId={activeBuildingId}
          floorNumber={effectiveCurrentFloor}
          backgroundColor={colors.background}
          invertSvg={isDark}
          routePoints={displayedRoutePoints}
          roomData={roomData}
          poiData={poiData}
          onPoiTap={handlePoiTap}
          onRoomTap={handleRoomTap}
        />
      </View>

      {activeFloors.length > 1 && (
        <View
          style={[styles.floorSelectorContainer, { top: statusBarHeight + 16 }]}
        >
          <FloorSelector
            currentFloor={effectiveCurrentFloor}
            availableFloors={activeFloors}
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
        floor={effectiveCurrentFloor}
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

      {routeData?.stairMessage && (
        <View
          style={[
            styles.routeStairBanner,
            { backgroundColor: colors.card, borderLeftColor: colors.primary },
          ]}
        >
          <Text style={[styles.stairBannerText, { color: colors.text }]}>
            🚶 {routeData.stairMessage}
          </Text>
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
        nextActionLabel={
          showOutdoorContinuation
            ? "Continue Outside"
            : showUniversalOutdoorContinuation
              ? "Continue Outside"
              : showForcedFlowOutdoorContinuation
                ? "Continue Outside"
                : showArrivalAction
                  ? "Arrived"
                  : undefined
        }
        onNextAction={
          showOutdoorContinuation
            ? () => {
                useNavigationStore
                  .getState()
                  .setNavigationState(NAVIGATION_STATE.NAVIGATING);
                router.replace("/(home-page)");
              }
            : showUniversalOutdoorContinuation
              ? handleUniversalOutdoorContinuation
              : showForcedFlowOutdoorContinuation
                ? handleForcedOutdoorContinuation
                : showArrivalAction
                  ? handleArrival
                  : undefined
        }
      />

      <ShuttleBanner
        nextShuttleTime={universalRouteData?.nextShuttleTime}
        routePhase={routePhase}
        cardBackground={colors.card}
        accentColor={colors.primary}
        textColor={colors.primary}
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
  routeStairBanner: {
    position: "absolute",
    top: 254,
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
    bottom: Platform.OS === "ios" ? 220 : 200,
    alignSelf: "center",
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
