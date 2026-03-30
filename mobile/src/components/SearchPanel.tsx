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
import { addSearchHistory, getSearchHistory } from "../utils/searchHistory";
import { getOpenStatusText, calculateDistance } from "../utils/location";
import { useDistanceFilter } from "../hooks/useDistanceFilter";
import NearbyPlaceItem from "./NearbyPlaceItem";
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

type SearchPanelProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectLocation: (location: {
    latitude: number;
    longitude: number;
    name?: string;
  }) => void;
};

export default function SearchPanel({
  visible,
  onClose,
  onSelectLocation,
}: SearchPanelProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("restaurant");
  const [nearby, setNearby] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const { distance, location, hours } = useDistanceFilter();
  const todayIndexJS = new Date().getDay();
  // Convert to Google format (Monday first)
  const todayIndex = todayIndexJS === 0 ? 6 : todayIndexJS - 1;
  const statusText = getOpenStatusText(
    location.selectedLocationDetail?.openingHours,
  );

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

            {/* Location Details Modal */}
            <Modal
              visible={location.locationDetailVisible}
              animationType="slide"
              transparent
            >
              <Pressable
                testID="details-modal-backdrop"
                style={styles.backdrop}
                onPress={() => location.setLocationDetailVisible(false)}
              />
              <View style={styles.detailModal}>
                <View style={styles.detailModalHeader}>
                  <Pressable
                    testID="close-details-button"
                    onPress={() => location.setLocationDetailVisible(false)}
                    style={styles.closeDetailsBtn}
                  >
                    <Ionicons name="close" size={24} color={colors.primary} />
                  </Pressable>
                </View>

                {location.selectedLocationDetail && (
                  <ScrollView
                    style={styles.detailModalContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.detailTitle}>
                      {location.selectedLocationDetail.name}
                    </Text>

                    <View style={styles.detailSection}>
                      <Ionicons name="location" size={18} color={BURGUNDY} />
                      <View style={styles.detailSectionContent}>
                        <Text style={styles.detailLabel}>Address</Text>
                        <Text style={styles.detailValue}>
                          {location.selectedLocationDetail.address}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Ionicons
                        name="navigate-circle"
                        size={18}
                        color={BURGUNDY}
                      />
                      <View style={styles.detailSectionContent}>
                        <Text style={styles.detailLabel}>Distance</Text>
                        <Text style={styles.detailValue}>
                          {location.selectedLocationDetail.distanceKm} km away
                        </Text>
                      </View>
                    </View>

                    {location.selectedLocationDetail.rating && (
                      <View style={styles.detailSection}>
                        <Ionicons name="star" size={18} color={BURGUNDY} />
                        <View style={styles.detailSectionContent}>
                          <Text style={styles.detailLabel}>Rating</Text>
                          <Text style={styles.detailValue}>
                            {location.selectedLocationDetail.rating.toFixed(1)}{" "}
                            / 5.0
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.detailSection}>
                      <Ionicons name="time" size={18} color={BURGUNDY} />

                      <View style={styles.detailSectionContent}>
                        <Text style={styles.detailLabel}>Opening Hours</Text>
                        <TouchableOpacity
                          testID="opening-hours-toggle"
                          onPress={() => hours.setShowHours(!hours.showHours)}
                          style={styles.hoursHeader}
                        >
                          {location.selectedLocationDetail.openingHours
                            ?.openNow !== undefined && (
                            <View style={styles.openStatusContainer}>
                              <View
                                style={[
                                  styles.statusDot,
                                  {
                                    backgroundColor: location
                                      .selectedLocationDetail.openingHours
                                      .openNow
                                      ? "#22c55e"
                                      : "#ef4444",
                                  },
                                ]}
                              />

                              <Text
                                style={[
                                  styles.openStatusText,
                                  {
                                    color: location.selectedLocationDetail
                                      .openingHours.openNow
                                      ? "#22c55e"
                                      : "#ef4444",
                                  },
                                ]}
                              >
                                {location.selectedLocationDetail.openingHours
                                  .openNow
                                  ? "Open"
                                  : "Closed"}
                              </Text>

                              {statusText !== "" && (
                                <Text style={styles.closingText}>
                                  {"  ·  " + statusText}
                                </Text>
                              )}
                            </View>
                          )}
                          <Ionicons
                            name={
                              hours.showHours ? "chevron-up" : "chevron-down"
                            }
                            size={16}
                            color="#777"
                          />
                        </TouchableOpacity>

                        {hours.showHours &&
                          location.selectedLocationDetail.openingHours.weekdayDescriptions?.map(
                            (day: string, index: number) => (
                              <Text
                                key={`${day}-${index}`}
                                style={[
                                  styles.hoursRow,
                                  index === todayIndex && styles.todayHoursRow,
                                ]}
                              >
                                {day}
                              </Text>
                            ),
                          )}
                      </View>
                    </View>

                    {location.selectedLocationDetail.phoneNumber && (
                      <View style={styles.detailSection}>
                        <Ionicons name="call" size={18} color={BURGUNDY} />
                        <View style={styles.detailSectionContent}>
                          <Text style={styles.detailLabel}>Phone Number</Text>
                          <Text style={styles.detailValue}>
                            {location.selectedLocationDetail.phoneNumber}
                          </Text>
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.detailNavigateButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => {
                        onSelectLocation({
                          ...location.selectedLocationDetail.location,
                          name: location.selectedLocationDetail.name,
                        });
                        location.setLocationDetailVisible(false);
                        onClose();
                      }}
                    >
                      <Ionicons name="navigate" size={20} color="#fff" />
                      <Text style={styles.detailNavigateButtonText}>
                        Get Directions
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            </Modal>

            <View style={{ flex: 1 }}>
              <FlatList
                data={nearby.filter((item) => {
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
  detailModal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 15,
  },
  closeDetailsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
  },
  detailSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  detailSectionContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  detailNavigateButton: {
    backgroundColor: BURGUNDY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    gap: 8,
  },
  detailNavigateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  openStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  openStatusText: {
    fontWeight: "600",
    fontSize: 14,
  },
  hoursHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hoursRow: {
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },
  todayHoursRow: {
    fontWeight: "700",
    color: BURGUNDY,
  },
  closingText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
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
