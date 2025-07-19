import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  getHabits,
  Habit,
  softDeleteHabit,
  updateHabit,
} from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Button,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Manage = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editFields, setEditFields] = useState({ name: "", category: "" });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadHabits = async () => {
    setLoading(true);
    const allHabits = await getHabits();
    setHabits(allHabits.filter((habit) => !habit.deleted));
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const openEditModal = (habit: Habit) => {
    setSelectedHabit(habit);
    setEditFields({ name: habit.name, category: habit.category });
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!selectedHabit) return;
    const updated = { ...selectedHabit, ...editFields };
    await updateHabit(selectedHabit._id || selectedHabit.tempId, updated);
    setEditModalVisible(false);
    setSelectedHabit(null);
    await loadHabits();
  };

  const openDeleteModal = (habit: Habit) => {
    setSelectedHabit(habit);
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedHabit) return;
    await softDeleteHabit(selectedHabit._id || selectedHabit.tempId);
    setDeleteModalVisible(false);
    setSelectedHabit(null);
    await loadHabits();
  };

  const colorScheme = useColorScheme() ?? "light";
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor(
    { light: "#fff", dark: "#23272a" },
    "background"
  );
  const textColor = useThemeColor({}, "text");
  const secondaryText = useThemeColor({ light: "#666", dark: "#aaa" }, "text");
  const borderColor = useThemeColor(
    { light: "#e0e0e0", dark: "#333" },
    "background"
  );
  const modalBg = useThemeColor(
    { light: "#fff", dark: "#23272a" },
    "background"
  );
  const modalTitleColor = useThemeColor(
    { light: "#333", dark: "#ECEDEE" },
    "text"
  );
  const inputBg = useThemeColor(
    { light: "#fafafa", dark: "#23272a" },
    "background"
  );
  const inputBorder = useThemeColor(
    { light: "#ccc", dark: "#444" },
    "background"
  );

  const renderHabit = ({ item }: { item: Habit }) => {
    return (
      <View
        style={[styles.habitCard, { backgroundColor: cardBg, borderColor }]}
      >
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.habitName, { color: textColor }]}>
            {item.name}
          </ThemedText>
          <ThemedText style={[styles.habitCategory, { color: secondaryText }]}>
            {item.category}
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: `/habits/add`,
              params: { habitId: item._id || item.tempId },
            })
          }
          style={styles.iconBtn}
        >
          <Ionicons name="create-outline" size={22} color="#1976D2" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openDeleteModal(item)}
          style={styles.iconBtn}
        >
          <Ionicons name="trash-outline" size={22} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ThemedText style={[styles.title, { color: textColor }]}>
        Manage Habits
      </ThemedText>
      {loading ? (
        <ThemedText style={{ color: secondaryText }}>Loading...</ThemedText>
      ) : habits.length === 0 ? (
        <ThemedText style={[styles.empty, { color: secondaryText }]}>
          No habits found.
        </ThemedText>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item._id || item.tempId}
          renderItem={renderHabit}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: modalBg }]}>
            <ThemedText style={[styles.modalTitle, { color: modalTitleColor }]}>
              Edit Habit
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              value={editFields.name}
              onChangeText={(name) => setEditFields((f) => ({ ...f, name }))}
              placeholder="Habit Name"
              placeholderTextColor={secondaryText}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  color: textColor,
                },
              ]}
              value={editFields.category}
              onChangeText={(category) =>
                setEditFields((f) => ({ ...f, category }))
              }
              placeholder="Category"
              placeholderTextColor={secondaryText}
            />
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                onPress={() => setEditModalVisible(false)}
                color="#888"
              />
              <Button title="Save" onPress={handleEditSave} color="#1976D2" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: modalBg }]}>
            <ThemedText style={[styles.modalTitle, { color: modalTitleColor }]}>
              Delete Habit
            </ThemedText>
            <ThemedText style={{ color: textColor }}>
              Are you sure you want to delete this habit?
            </ThemedText>
            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                onPress={() => setDeleteModalVisible(false)}
                color="#888"
              />
              <Button title="Delete" onPress={handleDelete} color="#D32F2F" />
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  habitName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  habitCategory: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  iconBtn: {
    marginLeft: 10,
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 350,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
    gap: 12,
  },
});

export default Manage;
