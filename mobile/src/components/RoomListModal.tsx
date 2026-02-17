import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface RoomListModalProps {
  visible: boolean;
  selectingFor: 'start' | 'end' | null;
  searchQuery: string;
  filteredRooms: string[];
  onSearchChange: (query: string) => void;
  onSelectRoom: (room: string) => void;
  onClose: () => void;
}

function getModalTitle(selectingFor: 'start' | 'end' | null): string {
  if (selectingFor === 'start') return 'Select Start Room';
  if (selectingFor === 'end') return 'Select End Room';
  return 'All Rooms';
}

export default function RoomListModal({
  visible,
  selectingFor,
  searchQuery,
  filteredRooms,
  onSearchChange,
  onSelectRoom,
  onClose,
}: RoomListModalProps) {
  const modalTitle = getModalTitle(selectingFor);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {modalTitle}
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search rooms..."
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus={true}
          />
          <ScrollView style={styles.roomList}>
            {filteredRooms.length === 0 ? (
              <Text style={styles.noResults}>No rooms found</Text>
            ) : (
              filteredRooms.map((room) => (
                <TouchableOpacity
                  key={room}
                  style={styles.roomItem}
                  onPress={() => {
                    if (selectingFor) {
                      onSelectRoom(room);
                    }
                    // If just viewing (selectingFor is null), don't do anything on press
                  }}
                  disabled={!selectingFor}
                >
                  <Text style={styles.roomText}>{room}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#212121',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  roomList: {
    maxHeight: 400,
  },
  roomItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  roomText: {
    fontSize: 16,
    color: '#212121',
  },
  noResults: {
    textAlign: 'center',
    padding: 20,
    color: '#757575',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#8B1538',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
