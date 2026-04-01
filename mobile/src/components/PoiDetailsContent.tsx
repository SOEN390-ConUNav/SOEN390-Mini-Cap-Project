import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getOpenStatusText } from "../utils/location";
import type { PoiDetails } from "./PoiDetailsTypes";

type Props = Readonly<{
  poi: PoiDetails;
  onGetDirections: (location: {
    latitude: number;
    longitude: number;
    name?: string;
  }) => void;
}>;

export default function PoiDetailsContent({ poi, onGetDirections }: Props) {
  const [showHours, setShowHours] = useState(false);
  const todayIndexJS = new Date().getDay();
  const todayIndex = todayIndexJS === 0 ? 6 : todayIndexJS - 1;
  const statusText = useMemo(
    () => getOpenStatusText(poi.openingHours),
    [poi.openingHours],
  );

  return (
    <View>
      <Text style={styles.detailTitle}>{poi.name}</Text>

      {poi.address ? (
        <View style={styles.detailSection}>
          <Ionicons name="location" size={18} color="#800020" />
          <View style={styles.detailSectionContent}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{poi.address}</Text>
          </View>
        </View>
      ) : null}

      {poi.distanceKm ? (
        <View style={styles.detailSection}>
          <Ionicons name="navigate-circle" size={18} color="#800020" />
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
        style={styles.detailNavigateButton}
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "#800020",
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
    color: "#800020",
  },
  closingText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
});
