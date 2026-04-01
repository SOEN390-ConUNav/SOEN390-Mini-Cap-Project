import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { getOpenStatusText } from "../utils/location";
import type { Coordinate } from "../type";

export type PoiDetails = Readonly<{
  id: string;
  name: string;
  address?: string;
  location: Coordinate;
  rating?: number;
  openingHours?: any;
  phoneNumber?: string;
  distanceKm?: string;
  distance?: number;
}>;

type Props = Readonly<{
  visible: boolean;
  poi: PoiDetails | null;
  onClose: () => void;
  onGetDirections: (location: {
    latitude: number;
    longitude: number;
    name?: string;
  }) => void;
}>;

export default function PoiDetailsModal({
  visible,
  poi,
  onClose,
  onGetDirections,
}: Props) {
  const { colors } = useTheme();
  const [showHours, setShowHours] = useState(false);

  const statusText = useMemo(
    () => getOpenStatusText(poi?.openingHours),
    [poi?.openingHours],
  );

  useEffect(() => {
    if (visible) {
      setShowHours(false);
    }
  }, [visible, poi]);

  if (!poi) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.modal, { backgroundColor: colors.background }]}> 
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>POI details</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeText, { color: colors.primary }]}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView>
          <Text style={[styles.poiName, { color: colors.text }]}>{poi.name}</Text>
          {poi.address ? (
            <Text style={[styles.poiAddress, { color: colors.textMuted }]}> 
              {poi.address}
            </Text>
          ) : null}

          {poi.distanceKm ? (
            <View style={styles.detailSection}>
              <Ionicons name="location-outline" size={18} color="#800020" />
              <View style={styles.detailSectionContent}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>{poi.distanceKm} km away</Text>
              </View>
            </View>
          ) : null}

          {poi.rating != null ? (
            <View style={styles.detailSection}>
              <Ionicons name="star" size={18} color="#800020" />
              <View style={styles.detailSectionContent}>
                <Text style={styles.detailLabel}>Rating</Text>
                <Text style={styles.detailValue}>{poi.rating.toFixed(1)} / 5.0</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.detailSection}>
            <Ionicons name="time" size={18} color="#800020" />
            <View style={styles.detailSectionContent}>
              <Text style={styles.detailLabel}>Opening Hours</Text>
              <TouchableOpacity
                testID="opening-hours-toggle"
                onPress={() => setShowHours(!showHours)}
                style={styles.hoursHeader}
              >
                {poi.openingHours?.openNow !== undefined && (
                  <View style={styles.openStatusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: poi.openingHours.openNow
                            ? "#22c55e"
                            : "#ef4444",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.openStatusText,
                        {
                          color: poi.openingHours.openNow
                            ? "#22c55e"
                            : "#ef4444",
                        },
                      ]}
                    >
                      {poi.openingHours.openNow ? "Open" : "Closed"}
                    </Text>
                    {statusText ? (
                      <Text style={styles.closingText}>
                        {"  ·  " + statusText}
                      </Text>
                    ) : null}
                  </View>
                )}
                <Ionicons
                  name={showHours ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#777"
                />
              </TouchableOpacity>
              {showHours &&
                poi.openingHours?.weekdayDescriptions?.map(
                  (day: string, index: number) => (
                    <Text key={`${day}-${index}`} style={styles.hoursRow}>
                      {day}
                    </Text>
                  ),
                )}
            </View>
          </View>

          {poi.phoneNumber ? (
            <View style={styles.detailSection}>
              <Ionicons name="call" size={18} color="#800020" />
              <View style={styles.detailSectionContent}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{poi.phoneNumber}</Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.detailNavigateButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              onGetDirections({
                latitude: poi.location.latitude,
                longitude: poi.location.longitude,
                name: poi.name,
              });
            }}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.detailNavigateButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 110,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeText: {
    fontWeight: "700",
  },
  poiName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  poiAddress: {
    fontSize: 14,
    marginBottom: 16,
  },
  detailSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailSectionContent: {
    marginLeft: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  hoursHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  openStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  openStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  closingText: {
    fontSize: 14,
    color: "#777",
  },
  hoursRow: {
    marginTop: 6,
    color: "#444",
  },
  detailNavigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  detailNavigateButtonText: {
    marginLeft: 10,
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
