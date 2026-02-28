import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { BuildingId } from "../data/buildings";
import { hasIndoorMaps } from "../utils/buildingIndoorMaps";
import PopupTemplate, { BURGUNDY } from "./PopupTemplate";

export default function BuildingPopup({
  id,
  name,
  addressLines = [],
  buildingId,
  openingHours = "",
  hasStudySpots = false,
  image,
  accessibility,
  onClose,
  onDirections,
  onIndoorMaps,
}: {
  id: string;
  name: string;
  addressLines?: string[];
  buildingId: BuildingId;
  openingHours?: string;
  hasStudySpots?: boolean;
  image: any;
  accessibility?: {
    hasElevator: boolean;
    hasParking: boolean;
    isAccessible: boolean;
  };
  onClose: () => void;
  onDirections: () => void;
  onIndoorMaps?: () => void;
}) {
  const showIndoorMaps = hasIndoorMaps(buildingId);
  return (
    <PopupTemplate
      title={name}
      accessibility={accessibility}
      onClose={onClose}
      renderTopContent={() =>
        image != null ? (
          <Image source={image} style={styles.image} resizeMode="cover" />
        ) : null
      }
      renderBody={() => (
        <>
          {(addressLines ?? []).map((line, idx) => (
            <Text key={idx} style={styles.address}>
              {line}
            </Text>
          ))}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Hours:</Text>
            <Text style={styles.metaValue}>{openingHours}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Study Spots:</Text>
            <Text style={styles.metaValue}>{hasStudySpots ? "Yes" : "No"}</Text>
          </View>
        </>
      )}
      renderButtons={() => (
        <View style={styles.buttonRow}>
          <Pressable onPress={onDirections} style={styles.directionsBtn}>
            <FontAwesome5 name="directions" size={18} color="white" />
            <Text style={styles.directionsText}>Directions</Text>
          </Pressable>
          {showIndoorMaps && onIndoorMaps && (
            <Pressable onPress={onIndoorMaps} style={styles.indoorMapsBtn}>
              <Ionicons name="map" size={18} color="white" />
              <Text style={styles.indoorMapsText}>Indoor Maps</Text>
            </Pressable>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 120,
  },
  address: {
    color: "#333",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  metaLabel: { fontWeight: "800" },
  metaValue: { color: "#333", fontWeight: "600" },
  buttonRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BURGUNDY,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  directionsText: { color: "#fff", fontWeight: "800" },
  indoorMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BURGUNDY,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  indoorMapsText: { color: "#fff", fontWeight: "800" },
});
