import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PoiDetailsContent from "./PoiDetailsContent";
import type { PoiDetails } from "./PoiDetailsTypes";

export type { PoiDetails } from "./PoiDetailsTypes";

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
  if (!poi) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.detailModal}>
        <View style={styles.detailModalHeader}>
          <Pressable
            testID="close-details-button"
            onPress={onClose}
            style={styles.closeDetailsBtn}
          >
            <Ionicons name="close" size={24} color="#800020" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.detailModalContent}
          showsVerticalScrollIndicator={false}
        >
          <PoiDetailsContent poi={poi} onGetDirections={onGetDirections} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
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
});
