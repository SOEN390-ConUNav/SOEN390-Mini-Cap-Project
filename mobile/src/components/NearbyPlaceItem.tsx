import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { calculateDistance } from "../utils/location";

const BURGUNDY = "#800020";

type Props = Readonly<{
  item: any;
  userLocation: { latitude: number; longitude: number } | null;
  onSelect: (locationDetail: any) => void;
}>;

export default function NearbyPlaceItem({ item, userLocation, onSelect }: Props) {

  const distance =
    userLocation
      ? Math.round(
          calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.location.latitude,
            item.location.longitude
          )
        )
      : 0;

  const distanceKm = (distance / 1000).toFixed(1);

  return (
    <TouchableOpacity
      style={styles.poiItem}
      onPress={() =>
        onSelect({
          ...item,
          distanceKm,
          distance,
        })
      }
    >
      <View style={styles.poiTextContainer}>
        <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>

        <Text style={styles.address} numberOfLines={2} ellipsizeMode="tail">
          {item.address}
        </Text>

        <Text style={styles.distanceText}>{distanceKm} km away</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={BURGUNDY} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  poiItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  poiTextContainer: {
    flex: 1,
    marginRight: 12,
    paddingTop: 2,
  },
  placeName: {
    fontWeight: "500",
  },
  address: {
    fontSize: 12,
    color: "#777",
  },
  distanceText: {
    fontSize: 12,
    color: BURGUNDY,
    marginTop: 4,
    fontWeight: "500",
  },
});