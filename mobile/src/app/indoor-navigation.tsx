import React, { useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, View, StatusBar, Platform, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';
import { getIndoorDirections, getAvailableRooms, getRoomPoints, getPointsOfInterest, RoomPoint, PoiItem } from '../api/indoorDirectionsApi';
import { IndoorDirectionResponse } from '../types/indoorDirections';
import IndoorSearchBar from '../components/IndoorSearchBar';
import BottomPanel from '../components/BottomPanel';
import DirectionsPanel from '../components/DirectionsPanel';
import RoomListModal from '../components/RoomListModal';
import FloorPlanWebView, { FloorPlanWebViewRef, PoiMarker, RoomMarkerData } from '../components/FloorPlanWebView';
import FloorSelector from '../components/FloorSelector';
import { BuildingId } from '../data/buildings';
import { getBackendBuildingId, getDefaultFloor, getAvailableFloors } from '../utils/buildingIndoorMaps';

export default function IndoorNavigation() {
  const router = useRouter();
  const params = useLocalSearchParams<{ buildingId?: string; floor?: string }>();
  
  
  const buildingId = (params.buildingId as BuildingId) || 'H';
  const defaultFloor = getDefaultFloor(buildingId);
  const availableFloors = getAvailableFloors(buildingId);
  const initialFloor = (params.floor && availableFloors.includes(params.floor)) ? params.floor : defaultFloor;
  const [currentFloor, setCurrentFloor] = useState<string>(initialFloor);
  const backendBuildingId = getBackendBuildingId(buildingId, currentFloor);
  

  useEffect(() => {
  }, [buildingId, currentFloor, backendBuildingId, availableFloors]);
  

  useEffect(() => {
    if (params.floor && availableFloors.includes(params.floor)) {
      setCurrentFloor(params.floor);
    }
  }, [params.floor, availableFloors]);

  

  const mapViewRef = useRef<FloorPlanWebViewRef>(null);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [startRoom, setStartRoom] = useState<string>('');
  const [endRoom, setEndRoom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRoomList, setShowRoomList] = useState<boolean>(false);
  const [selectingFor, setSelectingFor] = useState<'start' | 'end' | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeData, setRouteData] = useState<IndoorDirectionResponse | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState<boolean>(false);
  const [roomPoints, setRoomPoints] = useState<RoomPoint[]>([]);
  const [pois, setPois] = useState<PoiItem[]>([]);
  
  const handleClearRoute = useCallback(() => {
    mapViewRef.current?.clearRoute();
  }, []);

  // Reset all search/route state when the building changes
  const prevBuildingRef = useRef(buildingId);
  useEffect(() => {
    if (prevBuildingRef.current !== buildingId) {
      prevBuildingRef.current = buildingId;
      setStartRoom('');
      setEndRoom('');
      setSearchQuery('');
      setRouteData(null);
      setShowRouteDetails(false);
      setShowRoomList(false);
      setSelectingFor(null);
      handleClearRoute();
      const newDefault = getDefaultFloor(buildingId);
      setCurrentFloor(newDefault);
    }
  }, [buildingId, handleClearRoute]);

  const handleFloorChange = useCallback((newFloor: string) => {
    setCurrentFloor(newFloor);
 
    setStartRoom('');
    setEndRoom('');
    handleClearRoute();
    setRouteData(null);

    router.setParams({ floor: newFloor });
  }, [router, handleClearRoute]);

  const fetchRoute = useCallback(async () => {
    if (!startRoom || !endRoom || startRoom === endRoom) {
      return;
    }
    
    setIsLoadingRoute(true);
    
    try {
      
  
      const response = await getIndoorDirections(backendBuildingId, startRoom, endRoom, currentFloor, currentFloor);
      
      if (response.routePoints && response.routePoints.length > 0) {
        if (mapViewRef.current) {
          mapViewRef.current.drawRoute(response.routePoints);
        } else {
          
        }
        setRouteData(response);
      } else {
        console.warn('No route points in response');
        handleClearRoute();
        setRouteData(null);
      }
    } catch (error: any) {
  
      handleClearRoute();
      setRouteData(null);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [startRoom, endRoom, backendBuildingId, currentFloor, handleClearRoute]);



 
  useEffect(() => {
    const loadRooms = async () => {
      try {

        const rooms = await getAvailableRooms(buildingId, currentFloor);

        setAvailableRooms(rooms);
      } catch (error) {
        console.error('Failed to load rooms:', error);
        setAvailableRooms([]);
      }
    };
    loadRooms();
  }, [buildingId, currentFloor]);

  // Fetch room points when building/floor changes 
  useEffect(() => {
    const loadRoomPoints = async () => {
      try {
        const points = await getRoomPoints(buildingId, currentFloor);
        setRoomPoints(points);
      
      } catch (error) {
       
      }
    };
    loadRoomPoints();
  }, [buildingId, currentFloor]);

  // Fetch POIs when building/floor changes
  useEffect(() => {
    const loadPois = async () => {
      try {
        const items = await getPointsOfInterest(buildingId, currentFloor);
        setPois(items);
       
      } catch (error) {
        console.error('Failed to load POIs:', error);
      }
    };
    loadPois();
  }, [buildingId, currentFloor]);

  const handlePoiTap = useCallback((poi: PoiMarker) => {
    
    setEndRoom(poi.id);
    if (!startRoom) {
      setSelectingFor('start');
      setShowRoomList(true);
    }
  }, [startRoom]);


  const handleRoomTap = useCallback((room: RoomMarkerData) => {

    setEndRoom(room.id);
    if (!startRoom) {
      setSelectingFor('start');
      setShowRoomList(true);
    }
  }, [startRoom]);

 
  useEffect(() => {
    if (startRoom && endRoom && startRoom !== endRoom) {
      fetchRoute();
    } else {
 
      handleClearRoute();
      setRouteData(null);
    }
  }, [startRoom, endRoom, fetchRoute, handleClearRoute]);

  const filteredRooms = availableRooms.filter(room =>
    room.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectRoom = (room: string) => {
    if (selectingFor === 'start') {
      setStartRoom(room);
    } else if (selectingFor === 'end') {
      setEndRoom(room);
    }
    setShowRoomList(false);
    setSelectingFor(null);
    setSearchQuery('');
  };

  const swapLocations = () => {
    const temp = startRoom;
    setStartRoom(endRoom);
    setEndRoom(temp);
  };

  const clearStart = () => {
    setStartRoom('');
  };

  const clearEnd = () => {
    setEndRoom('');
  };

  const statusBarHeight = Constants.statusBarHeight || (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
  
      <View style={styles.mapContainer}>
        <FloorPlanWebView
          ref={mapViewRef}
          buildingId={buildingId}
          floorNumber={currentFloor}
          routePoints={routeData?.routePoints || undefined}
          roomData={roomPoints.length > 0 ? roomPoints.map(r => ({
            x: r.x, y: r.y, id: r.id,
          })) : undefined}
          poiData={pois.length > 0 ? pois.map(p => ({
            x: p.x, y: p.y, id: p.id, displayName: p.displayName, type: p.type,
          })) : undefined}
          onPoiTap={handlePoiTap}
          onRoomTap={handleRoomTap}
        />
      </View>


      {availableFloors.length > 1 && (
        <View style={[styles.floorSelectorContainer, { top: statusBarHeight + 16 }]}>
          <FloorSelector
            currentFloor={currentFloor}
            availableFloors={availableFloors}
            onFloorSelect={handleFloorChange}
            buildingName={routeData?.buildingName || 'Hall Building'}
          />
        </View>
      )}

     
      <IndoorSearchBar
        startRoom={startRoom}
        endRoom={endRoom}
        isLoadingRoute={isLoadingRoute}
        statusBarHeight={statusBarHeight}
        buildingName={routeData?.buildingName || (buildingId === 'H' ? 'Hall Building' : buildingId === 'VL' ? 'Vanier Library Building' : 'Building')}
        floor={currentFloor}
        onStartPress={() => {
          setSelectingFor('start');
          setShowRoomList(true);
        }}
        onEndPress={() => {
          setSelectingFor('end');
          setShowRoomList(true);
        }}
        onClearStart={clearStart}
        onClearEnd={clearEnd}
        onSwap={swapLocations}
      />

   
      {routeData?.stairMessage && (
        <View style={styles.stairBanner}>
          <Text style={styles.stairBannerText}>🚶 {routeData.stairMessage}</Text>
        </View>
      )}


      <BottomPanel
        startRoom={startRoom}
        endRoom={endRoom}
        routeData={routeData}
        isLoadingRoute={isLoadingRoute}
        showDirections={showRouteDetails}
        onToggleDirections={() => {
          setShowRouteDetails(!showRouteDetails);
        }}
      />


      {showRouteDetails && (
        <DirectionsPanel
          routeData={routeData}
          onClose={() => setShowRouteDetails(false)}
        />
      )}

     
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
          setSearchQuery('');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  floorSelectorContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 11,
  },
  stairBanner: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  stairBannerText: {
    color: '#E65100',
    fontSize: 14,
    fontWeight: '600',
  },
});
