import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getNearbyPlaces, searchLocations } from "../api";
import type { NearbyPlace } from "../api";
import { addSearchHistory, getSearchHistory } from "../utils/searchHistory";
import { calculateDistance } from "../utils/location";
import { useDistanceFilter } from "../hooks/useDistanceFilter";
import NearbyPlaceItem from "./NearbyPlaceItem";
import PoiDetailsModal from "./PoiDetailsModal";
import useLocationStore from "../hooks/useLocationStore";
import useLocationService from "../hooks/useLocationService";
import cacheService from "../services/cacheService";
import { useTheme } from "../hooks/useTheme";
import ModalHeader from "./ModalHeader";

const BURGUNDY = "#800020";
const FALLBACK_COORDS = { latitude: 45.4973, longitude: -73.579 };

const PLACE_TYPES = [
  { label: "Restaurants", value: "restaurant" },
  { label: "Parking", value: "parking" },
  { label: "Libraries", value: "library" },
  { label: "Parks", value: "park" },
  { label: "Food Stores", value: "food_store" },
  { label: "Banks", value: "bank" },
  { label: "Gyms", value: "gym" },
  { label: "Subway", value: "subway_station" },
];

type OutdoorPoi = {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
};

type SearchPanelProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectLocation: (location: {
    latitude: number;
    longitude: number;
    name?: string;
  }) => void;
  readonly onOutdoorPointsChange?: (points: OutdoorPoi[]) => void;
};

export default function SearchPanel({
  visible,
  onClose,
  onSelectLocation,
  onOutdoorPointsChange,
}: SearchPanelProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("restaurant");
  const [nearby, setNearby] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const { distance, location } = useDistanceFilter();

  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const currentLocation = useLocationStore((state) => state.currentLocation);

  const { getCurrentPosition } = useLocationService();

  const hasLocationPermission = permissionStatus === "granted";
  const locationCacheKeyPart = currentLocation
    ? `${currentLocation.latitude.toFixed(4)}-${currentLocation.longitude.toFixed(4)}`
    : "no-location";

  useEffect(() => {
    if (visible) {
      setQuery("");
      setSearchResults([]);
      setSearching(false);
      loadSearchHistory();
    }
  }, [visible]);

  useEffect(() => {
    setNearby([]);
    if (hasLocationPermission) {
      fetchNearbyPlaces(activeFilter);
    }
  }, [activeFilter, hasLocationPermission, locationCacheKeyPart]);

  useEffect(() => {
    if (!onOutdoorPointsChange || !visible) return;

    const source = query.trim().length > 0 ? searchResults : nearby;
    const points = source
      .filter(
        (item): item is OutdoorPoi & { address?: string } =>
          item?.location?.latitude != null && item.location.longitude != null,
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        location: item.location,
        address: item.address,
      }));

    onOutdoorPointsChange(points);
  }, [visible, query, searchResults, nearby, onOutdoorPointsChange]);

  async function fetchNearbyPlaces(placeType: string) {
    if (!hasLocationPermission) {
      setNearby([]);
      return;
    }

    try {
      let coords = currentLocation;
      coords ??= await getCurrentPosition();
      if (!coords) {
        setNearby([]);
        return;
      }

      const cacheKey = `${placeType}-${coords.latitude.toFixed(4)}-${coords.longitude.toFixed(4)}`;
      const cached = cacheService.getMemory<any[]>("nearby_places", cacheKey);
      if (cached) {
        setNearby(cached);
        return;
      }

      setLoading(true);

      const results = await getNearbyPlaces(
        coords.latitude,
        coords.longitude,
        placeType,
      );
      cacheService.setMemory("nearby_places", cacheKey, results);
      setNearby(results);
    } catch (e) {
      if (
        !(e instanceof Error) ||
        !e.message.toLowerCase().includes("location permission not granted")
      ) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadSearchHistory() {
    const list = await getSearchHistory();
    setRecentSearches(list);
  }

  type SearchEvent = { nativeEvent: { text: string } };

  async function handleSearch(searchQuery?: string | SearchEvent) {
    const queryToUse = String(
      ((): string => {
        if (typeof searchQuery === "string") return searchQuery;
        if (
          searchQuery &&
          typeof (searchQuery as any).nativeEvent?.text === "string"
        ) {
          return (searchQuery as any).nativeEvent.text;
        }
        return query;
      })(),
    ).trim();

    if (!queryToUse) return;

    setQuery(queryToUse);
    setSearching(true);
    setSearchResults([]);

    try {
      await addSearchHistory(queryToUse);
      loadSearchHistory();

      let coords = currentLocation;
      if (!coords && hasLocationPermission) {
        coords = await getCurrentPosition();
      }
      coords ??= FALLBACK_COORDS;

      const results = await searchLocations(
        queryToUse,
        coords.latitude,
        coords.longitude,
      );

      setSearchResults(results);
    } catch (e) {
      if (
        !(e instanceof Error) ||
        !e.message.toLowerCase().includes("location permission not granted")
      ) {
        console.error(e);
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.panel, { backgroundColor: colors.background }]}>
        <ModalHeader
          title="Search"
          onClose={onClose}
          closeVariant="text"
          style={styles.header}
        />

        <View
          style={[styles.searchContainer, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="search" size={20} color={colors.iconDefault} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={[styles.searchInput, { color: colors.text }]}
          />
          <Ionicons name="mic" size={20} color={colors.iconDefault} />
        </View>

        {query.length === 0 && (
          <View style={styles.filtersWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {PLACE_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => setActiveFilter(item.value)}
                  style={[
                    styles.filterChip,
                    { backgroundColor: colors.surface },
                    activeFilter === item.value && [
                      styles.activeChip,
                      { backgroundColor: colors.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: colors.textMuted },
                      activeFilter === item.value && [
                        styles.activeText,
                        { color: "#fff" },
                      ],
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {recentSearches.length > 0 && query.length === 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Searches
            </Text>

            {recentSearches.map((item, index) => (
              <TouchableOpacity
                key={`${item.timestamp ?? "no-ts"}-${item.query}-${index}`}
                onPress={() => handleSearch(item.query)}
                style={styles.recentSearchItem}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.recentSearchText, { color: colors.text }]}>
                  {item.query}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {query.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Search results
            </Text>

            {searching && (
              <Text style={{ color: colors.textMuted }}>Searching…</Text>
            )}

            {!searching && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.poiItem, { borderColor: colors.border }]}
                    onPress={() => {
                      onSelectLocation({ ...item.location, name: item.name });
                      onClose();
                    }}
                  >
                    <View style={styles.poiTextContainer}>
                      <Text style={[styles.placeName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[styles.address, { color: colors.textMuted }]}
                      >
                        {item.address}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}

        {query.length === 0 && (
          <>
            <View style={styles.nearbyHeaderContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Nearby {activeFilter}
              </Text>
              <TouchableOpacity
                testID="distance-filter-button"
                onPress={() => distance.setDistanceFilterVisible(true)}
                style={styles.filterIconButton}
              >
                <Ionicons name="funnel" size={18} color={colors.primary} />
                <Text
                  style={[styles.filterButtonText, { color: colors.primary }]}
                >
                  Filter
                </Text>
              </TouchableOpacity>
            </View>

            {/* Distance Filter Modal */}
            <Modal
              visible={distance.distanceFilterVisible}
              animationType="slide"
              transparent
            >
              <Pressable
                testID="distance-filter-backdrop"
                style={styles.backdrop}
                onPress={() => distance.setDistanceFilterVisible(false)}
              />
              <View style={styles.filterModal}>
                <ModalHeader
                  title="Filter by Distance"
                  onClose={() => distance.setDistanceFilterVisible(false)}
                  closeTestID="close-filter-button"
                  style={styles.filterModalHeader}
                />

                <View style={styles.filterOptions}>
                  <Text style={styles.filterSubtitle}>Preset Distances</Text>
                  {[
                    { label: "100m", value: 100 },
                    { label: "500m", value: 500 },
                    { label: "1 km", value: 1000 },
                    { label: "2 km", value: 2000 },
                    { label: "5 km", value: 5000 },
                    { label: "10 km", value: 10000 },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        distance.setMaxDistance(option.value);
                        distance.setDistanceFilterVisible(false);
                      }}
                      style={[
                        styles.distanceOption,
                        distance.maxDistance === option.value &&
                          styles.distanceOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.distanceOptionText,
                          distance.maxDistance === option.value &&
                            styles.distanceOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {distance.maxDistance === option.value && (
                        <Ionicons name="checkmark" size={20} color={BURGUNDY} />
                      )}
                    </TouchableOpacity>
                  ))}

                  <Text style={styles.filterSubtitle}>Custom Distance</Text>
                  <View style={styles.customDistanceContainer}>
                    <TextInput
                      style={styles.customDistanceInput}
                      placeholder="Enter distance"
                      value={distance.customDistance}
                      onChangeText={distance.setCustomDistance}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#999"
                    />
                    <Text style={styles.customDistanceUnit}>km</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const distanceInMeters =
                        Number.parseFloat(distance.customDistance) * 1000;
                      if (
                        !Number.isNaN(distanceInMeters) &&
                        distanceInMeters > 0
                      ) {
                        distance.setMaxDistance(distanceInMeters);
                        distance.setDistanceFilterVisible(false);
                      }
                    }}
                    style={styles.applyCustomButton}
                  >
                    <Text style={styles.applyCustomButtonText}>
                      Apply Custom Distance
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <PoiDetailsModal
              visible={location.locationDetailVisible}
              poi={location.selectedLocationDetail}
              onClose={() => location.setLocationDetailVisible(false)}
              onGetDirections={(destination) => {
                onSelectLocation(destination);
                location.setLocationDetailVisible(false);
                onClose();
              }}
            />

            <View style={{ flex: 1 }}>
              <FlatList
                data={nearby.filter((item) => {
                  if (!item.location) return !currentLocation;
                  if (!currentLocation) return true;

                  const distanceValue = calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    item.location.latitude,
                    item.location.longitude,
                  );
                  return distanceValue <= distance.maxDistance;
                })}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <NearbyPlaceItem
                    item={item}
                    userLocation={currentLocation}
                    onSelect={(locationDetail) => {
                      location.setSelectedLocationDetail(locationDetail);
                      location.setLocationDetailVisible(true);
                    }}
                  />
                )}
              />

              {loading && (
                <View
                  style={[
                    styles.loadingOverlay,
                    { backgroundColor: colors.background + "E6" },
                  ]}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  filtersWrapper: {
    marginVertical: 12,
  },

  filters: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeChip: {},
  filterText: {},
  activeText: {},
  sectionTitle: {
    fontWeight: "600",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  placeName: {
    fontWeight: "500",
  },
  address: {
    fontSize: 12,
  },
  viewMore: {
    marginTop: 4,
    alignSelf: "center",
  },
  poiItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  poiTextContainer: {
    flex: 1,
    marginRight: 12,
    paddingTop: 2,
  },
  directionsButton: {
    flexShrink: 0,
    padding: 10,
    borderRadius: 20,
    alignSelf: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 12,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  resultsArea: {
    flex: 1,
    marginTop: 16,
    borderRadius: 12,
  },
  hint: {
    marginTop: 8,
  },
  searchContainer: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    // Shadow
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  text: {
    opacity: 0.65,
    fontSize: 15,
  },
  spacer: {
    flex: 1,
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  recentSearchText: {
    marginLeft: 8,
    color: "#333",
  },
  nearbyHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  filterIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(128, 0, 32, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterButtonText: {
    color: BURGUNDY,
    fontSize: 14,
    fontWeight: "600",
  },
  filterModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },
  filterModalHeader: {
    marginBottom: 20,
  },
  filterOptions: {
    gap: 8,
  },
  distanceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#eee",
  },
  distanceOptionSelected: {
    backgroundColor: "rgba(128, 0, 32, 0.1)",
    borderColor: BURGUNDY,
  },
  distanceOptionText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  distanceOptionTextSelected: {
    color: BURGUNDY,
    fontWeight: "700",
  },
  distanceText: {
    fontSize: 12,
    color: BURGUNDY,
    marginTop: 4,
    fontWeight: "500",
  },
  filterSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginTop: 16,
    marginBottom: 8,
  },
  customDistanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  customDistanceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  customDistanceUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  applyCustomButton: {
    backgroundColor: BURGUNDY,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  applyCustomButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  locationErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  locationErrorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 12,
  },
  locationErrorSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  enableLocationButton: {
    marginTop: 16,
    backgroundColor: BURGUNDY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  enableLocationButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});
