import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { hasIndoorMaps, getDefaultFloor } from '../../utils/buildingIndoorMaps';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from "../../components/search-bar/SearchBar";
import SearchPanel from "../../components/SearchPanel";
import FloatingActionButton from "../../components/FloatingActionButton";
import CampusSwitcher from "../../components/CampusSwitcher";
import { Building, BuildingId, BUILDINGS } from "../../data/buildings";
import BuildingMarker from "../../components/BuildingMarker";
import BuildingPopup from "../../components/BuildingPopup";
import UpcomingEventButton from "../../components/UpcomingEventButton";
import useNavigationState from "../../hooks/useNavigationState";
import { NAVIGATION_STATE } from "../../const";
import NavigationConfigView from "../../components/navigation-config/NavigationConfigView";
import { styles as navStyles } from "../../components/BottomNav";
import useNavigationEndpoints from "../../hooks/useNavigationEndpoints";
import DirectionPath from "../../components/DirectionPath";
import useNavigationConfig from '../../hooks/useNavigationConfig';
import useNavigationInfo from '../../hooks/useNavigationInfo';
import { getAllOutdoorDirectionsInfo } from '../../api';
import { reverseGeocode } from "../../services/handleGeocode";
import NavigationInfoBottom from '../../components/navigation-info/NavigationInfoBottom';

const SGW_CENTER = { latitude: 45.4973, longitude: -73.579 };
const LOYOLA_CENTER = { latitude: 45.4582, longitude: -73.6405 };
const CAMPUS_REGION_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

const SHUTTLE_STOPS = {
  SGW: { latitude: 45.497122, longitude: -73.578471 },
  LOYOLA: { latitude: 45.45844144049705, longitude: -73.63831707854963 },
} as const;

const BURGUNDY = '#800020';
const OUTLINE_EXIT_LAT_DELTA = 0.006;
const OUTLINE_ENTER_REGION: Pick<Region, 'latitudeDelta' | 'longitudeDelta'> = {
  latitudeDelta: 0.0028,
  longitudeDelta: 0.0028,
};
const FREEZE_MARKERS_AFTER_MS = 800;

export default function HomePageIndex() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ shuttleCampus?: string }>();

  const [campus, setCampus] = useState<"SGW" | "LOYOLA">("SGW");
  const { navigationState, setNavigationState, isNavigating, isConfiguring, isSearching, isIdle } = useNavigationState();
  const { origin, setOrigin, destination, setDestination, swap, clear } = useNavigationEndpoints();
  const { allOutdoorRoutes, setAllOutdoorRoutes, navigationMode } = useNavigationConfig();
  const { setIsLoading, setPathDistance, setPathDuration, isLoading } = useNavigationInfo();
  const toggleNavigationState = useRef<"maximize" | "minimize">("maximize");
  const [toggleNavigationInfoState, setToggleNavigationInfoState] = useState<"maximize"|"minimize">("maximize");


  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [showEnableLocation, setShowEnableLocation] = useState(true);

  const [region, setRegion] = useState<Region>({
    latitude: SGW_CENTER.latitude,
    longitude: SGW_CENTER.longitude,
    ...CAMPUS_REGION_DELTA,
  });

  const [shuttleStop, setShuttleStop] = useState<{
    campus: 'SGW' | 'LOYOLA';
    coordinate: { latitude: number; longitude: number };
  } | null>(null);

  const [selectedBuildingId, setSelectedBuildingId] = useState<BuildingId | null>(null);
  const [outlineMode, setOutlineMode] = useState(false);
  const [showBuildingPopup, setShowBuildingPopup] = useState(false);

  const [mapReady, setMapReady] = useState(false);
  const [freezeMarkers, setFreezeMarkers] = useState(false);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapRef = useRef<MapView>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  const navigatingRef = useRef(false);

  useEffect(() => { checkLocationPermission(); }, []);

  useEffect(() => {
    if (params.shuttleCampus && (params.shuttleCampus === 'SGW' || params.shuttleCampus === 'LOYOLA')) {
      const targetCampus = params.shuttleCampus;
      const coord = SHUTTLE_STOPS[targetCampus];
      setCampus(targetCampus);
      setShuttleStop({ campus: targetCampus, coordinate: coord });
      setSelectedBuildingId(null);
      setOutlineMode(false);
      setShowBuildingPopup(false);
    }
  }, [params.shuttleCampus]);

  useEffect(() => {
    if (!shuttleStop || showEnableLocation || !mapReady) return;
    requestAnimationFrame(() => {
      animateToRegion({
        latitude: shuttleStop.coordinate.latitude,
        longitude: shuttleStop.coordinate.longitude,
        ...CAMPUS_REGION_DELTA,
      });
    });
    scheduleFreezeMarkers();
  }, [shuttleStop, showEnableLocation, mapReady]);

  useEffect(() => {
    scheduleFreezeMarkers();
    return () => { if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current); };
  }, [showEnableLocation]);

  useEffect(() => {
    scheduleFreezeMarkers();
    return () => { if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current); };
  }, [mapReady, showEnableLocation, isConfiguring, isNavigating]);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    const granted = status === 'granted';
    setHasLocationPermission(granted);
    if (granted) {
      setShowEnableLocation(false);
      await startWatchingLocation();
    }
  };

  const onPressIndoorMaps = () => {
    if (selectedBuildingId) {
      setShowBuildingPopup(false);
      const defaultFloor = getDefaultFloor(selectedBuildingId);
      router.push({ pathname: '/indoor-navigation', params: { buildingId: selectedBuildingId, floor: defaultFloor } });
    }
  };

  const stopWatchingLocation = () => { locationSubRef.current?.remove(); locationSubRef.current = null; };

  const startWatchingLocation = async () => {
    if (locationSubRef.current) return;
    try {
      locationSubRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
          () => {}
      );
    } catch (error) { console.error('Error watching location:', error); }
  };

  const getOneFix = async (): Promise<Region> => {
    const current = await Location.getCurrentPositionAsync({});
    return { latitude: current.coords.latitude, longitude: current.coords.longitude, ...CAMPUS_REGION_DELTA };
  };

  const animateToRegion = (r: Region) => { mapRef.current?.animateToRegion(r, 650); };

  const scheduleFreezeMarkers = () => {
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    setFreezeMarkers(false);
    if (!mapReady || showEnableLocation) return;
    freezeTimerRef.current = setTimeout(() => setFreezeMarkers(true), FREEZE_MARKERS_AFTER_MS);
  };

  const onPressFab = async () => {
    try {
      if (hasLocationPermission === true) { animateToRegion(await getOneFix()); return; }
      setShowEnableLocation(true);
    } catch { Alert.alert('Location error', 'Could not center the map.'); }
  };

  const onEnableLocation = async () => {
    try {
      const granted = await Location.requestForegroundPermissionsAsync().then(({ status }) => status === 'granted');
      if (!granted) { Alert.alert('Permission denied', 'You can enable location later in device settings.'); return; }
      setHasLocationPermission(true);
      setShowEnableLocation(false);
      animateToRegion(await getOneFix());
      await startWatchingLocation();
    } catch { Alert.alert('Location error', 'Could not retrieve your location.'); }
  };

  const onSkipLocation = () => {
    setShowEnableLocation(false);
    setHasLocationPermission(false);
    stopWatchingLocation();
  };

  const onChangeCampus = (next: 'SGW' | 'LOYOLA') => {
    setCampus(next);
    scheduleFreezeMarkers();
    animateToRegion({ ...(next === 'SGW' ? SGW_CENTER : LOYOLA_CENTER), ...CAMPUS_REGION_DELTA });
    setSelectedBuildingId(null);
    setOutlineMode(false);
    setShowBuildingPopup(false);
    setShuttleStop(null);
    setNavigationState(NAVIGATION_STATE.IDLE);
  };

  const selectedBuilding: Building | null =
      selectedBuildingId ? (BUILDINGS.find((b) => b.id === selectedBuildingId) ?? null) : null;

  const enterOutlineForBuilding = (b: Building) => {
    scheduleFreezeMarkers();
    setShuttleStop(null);
    setSelectedBuildingId(b.id);
    setOutlineMode(true);
    setShowBuildingPopup(false);
    animateToRegion({ latitude: b.marker.latitude, longitude: b.marker.longitude, ...OUTLINE_ENTER_REGION });
  };

  const onPressBuilding = (b: Building) => {
    setNavigationState(NAVIGATION_STATE.IDLE);
    if (selectedBuildingId !== b.id || !outlineMode) {
      setDestination({ longitude: b.marker.longitude, latitude: b.marker.latitude, label: b.name });
      enterOutlineForBuilding(b);
      return;
    }
    setShowBuildingPopup(true);
  };

  const onPressDirections = async () => {
    setShowBuildingPopup(false);
    if (!selectedBuilding) return;

    setIsLoading(true);
    setNavigationState(NAVIGATION_STATE.ROUTE_CONFIGURING);

    try {
      const currentLocation = await getOneFix();
      const label = await reverseGeocode(currentLocation).catch(() => "Current Location");

      const originCoords = { latitude: currentLocation.latitude, longitude: currentLocation.longitude, label };
      const destCoords = {
        latitude: selectedBuilding.marker.latitude,
        longitude: selectedBuilding.marker.longitude,
        label: selectedBuilding.name,
      };

      setOrigin(originCoords);
      setDestination(destCoords);

      const routes = await getAllOutdoorDirectionsInfo(originCoords, destCoords);
      setAllOutdoorRoutes(routes);

      // Set distance and duration for the default (WALK) mode
      const walkRoute = routes.find((r) => r.transportMode?.toUpperCase() === 'WALKING');
      if (walkRoute) {
        setPathDistance(walkRoute.distance);
        setPathDuration(walkRoute.duration);
      }

    } catch (error) {
      console.error('Error fetching directions:', error);
      Alert.alert('Navigation error', 'Could not fetch directions. Please try again.');
      setNavigationState(NAVIGATION_STATE.IDLE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionChangeComplete = (r: Region) => {
    setRegion(r);
    if (outlineMode && r.latitudeDelta > OUTLINE_EXIT_LAT_DELTA) {
      setOutlineMode(false);
      setShowBuildingPopup(false);
      setSelectedBuildingId(null);
    }
  };

  const handleSwap = async () => {
    if (!origin || !destination) return;

    setIsLoading(true);

    const newOrigin = destination;
    const newDest = origin;
    swap();

    try {
      const routes = await getAllOutdoorDirectionsInfo(newOrigin, newDest);
      setAllOutdoorRoutes(routes);

      const walkRoute = routes.find((r) => r.transportMode?.toUpperCase() === 'WALKING');
      if (walkRoute) {
        setPathDistance(walkRoute.distance);
        setPathDuration(walkRoute.duration);
      }
    } catch (error) {
      console.error('Error fetching swapped directions:', error);
      Alert.alert('Navigation error', 'Could not fetch directions after swap.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoNavConfig = () => {
    navigatingRef.current = true;
    setNavigationState(NAVIGATION_STATE.NAVIGATING);
};

const handleCloseNavConfig = () => {
    if (navigatingRef.current) return;
    setNavigationState(NAVIGATION_STATE.IDLE);
};

const onToggleNavigationState = () => {
  console.log(toggleNavigationInfoState);
  //toggleNavigationState.current = toggleNavigationState.current === "maximize" ? "minimize" : "maximize";
  setToggleNavigationInfoState(toggleNavigationInfoState === "maximize" ? "minimize" : "maximize");
}

  if (showEnableLocation) {
    return (
        <View style={styles.root}>
          <View style={styles.enableLocationContainer}>
            <View style={styles.enableLocationIconCircle}>
              <Text style={styles.enableLocationIcon}>📍</Text>
            </View>
            <Text style={styles.enableLocationTitle}>Enable Location Services</Text>
            <Text style={styles.enableLocationSubtitle}>
              To help you navigate Concordia's campus, we need access to your location.
            </Text>
            <View style={styles.enableLocationBullets}>
              <Text style={styles.enableLocationBullet}>• Real-time positioning on the map</Text>
              <Text style={styles.enableLocationBullet}>• Turn-by-turn directions</Text>
              <Text style={styles.enableLocationBullet}>• Nearby points of interest</Text>
            </View>
            <Pressable style={styles.enableLocationBtn} onPress={onEnableLocation}>
              <Text style={styles.enableLocationBtnText}>Enable Location</Text>
            </Pressable>
            <Pressable style={styles.enableLocationSkip} onPress={onSkipLocation}>
              <Text style={styles.enableLocationSkipText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
    );
  }

  return (
      <View style={styles.root}>
        <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            showsUserLocation={hasLocationPermission === true}
            showsMyLocationButton={false}
            onRegionChangeComplete={handleRegionChangeComplete}
            onPress={() => {setShowBuildingPopup(false); setNavigationState(NAVIGATION_STATE.IDLE); }}
            onMapReady={() => { setMapReady(true); scheduleFreezeMarkers(); }}
        >
          {shuttleStop && (
              <Marker coordinate={shuttleStop.coordinate} title={`${shuttleStop.campus} Shuttle Stop`} pinColor={BURGUNDY} />
          )}

          {BUILDINGS.map((b) => (
              <Marker
                  key={b.id}
                  coordinate={b.marker}
                  onPress={(e) => { e.stopPropagation?.(); onPressBuilding(b); }}
                  tracksViewChanges={!freezeMarkers}
              >
                <BuildingMarker label={b.id} />
              </Marker>
          ))}

          {outlineMode && selectedBuilding && (
              <Polygon
                  coordinates={selectedBuilding.polygon}
                  strokeColor={BURGUNDY}
                  strokeWidth={3}
                  fillColor="rgba(128,0,32,0.12)"
              />
          )}

          {(isConfiguring || isNavigating) && (
              <DirectionPath origin={origin} destination={destination} />
          )}
        </MapView>

        {showBuildingPopup && selectedBuilding && (
            <BuildingPopup
                id={selectedBuilding.id}
                name={selectedBuilding.name}
                addressLines={selectedBuilding.addressLines}
                buildingId={selectedBuilding.id}
                openingHours={selectedBuilding.openingHours.label}
                hasStudySpots={selectedBuilding.hasStudySpots}
                image={selectedBuilding.image}
                accessibility={selectedBuilding.accessibility}
                onClose={() => setShowBuildingPopup(false)}
                onDirections={() => onPressDirections()}
                onIndoorMaps={hasIndoorMaps(selectedBuilding.id) ? () => onPressIndoorMaps() : undefined}
            />
        )}

        <View
            style={[styles.upcomingEventWrapper, (showEnableLocation || isConfiguring || isNavigating) && styles.overlayHidden]}
            pointerEvents={!showEnableLocation && !(isConfiguring || isNavigating) ? 'auto' : 'none'}
        >
          <UpcomingEventButton />
        </View>

        <View style={styles.searchWrapper}>
          <SearchBar
              placeholder="Search"
              onPress={() => setNavigationState(NAVIGATION_STATE.SEARCHING)}
              isConfiguring={isConfiguring}
              isNavigating={isNavigating}
              originLabel={origin?.label ?? "Current Location"}
              destinationLabel={destination?.label ?? "Select destination"}
              onBack={() => {
                if (isNavigating) {
                setNavigationState(NAVIGATION_STATE.ROUTE_CONFIGURING)
                } else {
                setIsLoading(false);
                setNavigationState(NAVIGATION_STATE.IDLE);
                setSelectedBuildingId(null);
                setOutlineMode(false);
                setShowBuildingPopup(false);
                clear();
                }
              }}
              navigationInfoToggleState={toggleNavigationInfoState}
              onSwap={handleSwap}
          />
        </View>

        <SearchPanel visible={isSearching} onClose={() => setNavigationState(NAVIGATION_STATE.IDLE)} />
        <NavigationConfigView durations={allOutdoorRoutes} visible={isConfiguring} onClose={() =>  handleCloseNavConfig()} onGo={() => handleGoNavConfig()}/>
        <FloatingActionButton onPress={onPressFab} />

      <View style={styles.campusWrapper}>
        <CampusSwitcher value={campus} onChange={onChangeCampus} />
      </View>
      {isNavigating && (
        <NavigationInfoBottom
          visible={isNavigating}
          onClose={() => {
            navigatingRef.current = false;
          }}
          onPressAction={onToggleNavigationState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  enableLocationContainer: { flex: 1, paddingTop: 80, paddingHorizontal: 24 },
  enableLocationIconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(128,0,32,0.18)', alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  enableLocationIcon: { fontSize: 40 },
  enableLocationTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  enableLocationSubtitle: { textAlign: 'center', color: '#666', lineHeight: 20, marginBottom: 24 },
  enableLocationBullets: { gap: 12, marginBottom: 28 },
  enableLocationBullet: { color: '#333', fontWeight: '600' },
  enableLocationBtn: { backgroundColor: BURGUNDY, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  enableLocationBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  enableLocationSkip: { paddingVertical: 14, alignItems: 'center' },
  enableLocationSkipText: { color: '#777', fontWeight: '600' },
  searchWrapper: { position: 'absolute', top: 50, left: 16, right: 16 },
  upcomingEventWrapper: { position: 'absolute', top: 108, left: 16, right: 16 },
  overlayHidden: { opacity: 0 },
  campusWrapper: { position: 'absolute', left: 16, right: 16, bottom: 90, alignItems: 'center' },
});