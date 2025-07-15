import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { scheduleHabitReminder } from "@/utils/notifications";
import { addHabit, getHabits, updateHabit } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIES = [
  "Health",
  "Fitness",
  "Learning",
  "Mindfulness",
  "Social",
  "Career",
  "Creativity",
  "Other",
];

const FREQUENCIES = [
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  {
    id: "weekends",
    label: "Weekends",
  },
  { id: "weekly", label: "Weekly" },
];

const TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

const COLOR_OPTIONS = [
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#FF9800",
  "#E91E63",
  "#00BCD4",
  "#FF5722",
  "#607D8B",
];

export default function AddHabitScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [selectedFrequency, setSelectedFrequency] = React.useState<string>("");
  const [selectedTimes, setSelectedTimes] = React.useState<string[]>([]);
  const [color, setColor] = React.useState("");
  const [goal, setGoal] = React.useState(1);
  const [reminderEnabled, setReminderEnabled] = React.useState(true);
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  console.log(habitId)

  useEffect(() => {

    const getHabit = async () => {
      const habits = await getHabits();
      const habit = habits.find((h) => h._id === habitId || h.tempId === habitId);
      console.log(habit)
      setName(habit?.name || "");
      setCategory(habit?.category || "");
      setSelectedFrequency(habit?.frequency || "");
      setSelectedTimes(habit?.times || []);
      setColor(habit?.color || "");
      setGoal(habit?.goal || 1);
      setReminderEnabled(habit?.reminderEnabled || true);
    }

    if (habitId) {
      getHabit();
    }
  }, [habitId])

  const handleSave = async () => {
    if (
      !name ||
      !category ||
      !selectedFrequency ||
      !color ||
      selectedTimes.length === 0
    ) {
      // Show error - all fields required
      return;
    }

    if (habitId) { 
      await updateHabit(habitId, {
        name,
        category,
        frequency: selectedFrequency,
        color,
        reminderEnabled,
        goal,
        streak: 0,
        bestStreak: 0,
        times: reminderEnabled ? ["23:20"] : ["23:20"], // Default time if reminders are off
        updatedAt: new Date().toISOString(),
      })
      router.back();
      return;
    }

    const newHabit = {
      tempId: Math.random().toString(36).substr(2, 9),
      name,
      category,
      frequency: selectedFrequency,
      startDate: new Date().toISOString(),
      color,
      reminderEnabled,
      goal,
      streak: 0,
      bestStreak: 0,
      times: reminderEnabled ? ["23:20"] : ["23:20"], // Default time if reminders are off
      updatedAt: new Date().toISOString(),
    };

    await addHabit(newHabit);
    await scheduleHabitReminder(newHabit);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={28}
            color={Colors[colorScheme].text}
          />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Add New Habit</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <ThemedText style={styles.label}>Habit Name</ThemedText>
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
          placeholder="Enter habit name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <ThemedText style={styles.label}>Category</ThemedText>
        <View style={styles.optionsGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.optionChip,
                category === cat && styles.selectedChip,
              ]}
              onPress={() => setCategory(cat)}
            >
              <ThemedText
                style={[
                  styles.optionText,
                  category === cat && styles.selectedOptionText,
                ]}
              >
                {cat}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.label}>Frequency</ThemedText>
        <View style={styles.optionsGrid}>
          {FREQUENCIES.map((freq) => (
            <TouchableOpacity
              key={freq.id}
              style={[
                styles.optionChip,
                selectedFrequency === freq.id && styles.selectedChip,
              ]}
              onPress={() => {
                setSelectedFrequency(freq.id);
              }}
            >
              <ThemedText
                style={[
                  styles.optionText,
                  selectedFrequency === freq.id && styles.selectedOptionText,
                ]}
              >
                {freq.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <ThemedText style={styles.label}>Daily Goal</ThemedText>
        <View style={styles.goalContainer}>
          <TouchableOpacity
            style={styles.goalButton}
            onPress={() => setGoal(Math.max(1, goal - 1))}
          >
            {" "}
            <Ionicons
              name="remove"
              size={24}
              color={Colors[colorScheme].text}
            />
          </TouchableOpacity>
          <ThemedText style={styles.goalValue}>{goal} times per day</ThemedText>
          <TouchableOpacity
            style={styles.goalButton}
            onPress={() => setGoal(goal + 1)}
          >
            <Ionicons name="add" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.label}>Color</ThemedText>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((col) => (
            <TouchableOpacity
              key={col}
              style={[
                styles.colorOption,
                { backgroundColor: col },
                color === col && styles.selectedColor,
              ]}
              onPress={() => setColor(col)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.reminderToggle}
          onPress={() => setReminderEnabled(!reminderEnabled)}
        >
          <Ionicons
            name={reminderEnabled ? "notifications" : "notifications-off"}
            size={24}
            color={Colors[colorScheme ?? "light"].text}
          />
          <ThemedText style={styles.reminderText}>Enable Reminders</ThemedText>
          <View style={{ flex: 1 }} />
          <View
            style={[
              styles.toggle,
              reminderEnabled ? styles.toggleOn : styles.toggleOff,
            ]}
          >
            <View
              style={[
                styles.toggleHandle,
                reminderEnabled && styles.toggleHandleOn,
              ]}
            />
          </View>
        </TouchableOpacity>

        {reminderEnabled && (
          <>
            <ThemedText style={styles.label}>Time</ThemedText>
            <View style={styles.optionsGrid}>
              {TIME_SLOTS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.optionChip,
                    selectedTimes.includes(time) && styles.selectedChip,
                  ]}
                  onPress={() => {
                    if (selectedTimes.includes(time)) {
                      setSelectedTimes(selectedTimes.filter((t) => t !== time));
                    } else {
                      setSelectedTimes([...selectedTimes, time]);
                    }
                  }}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      selectedTimes.includes(time) && styles.selectedOptionText,
                    ]}
                  >
                    {time}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!name || !category || !selectedFrequency || !color) &&
              styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!name || !category || !selectedFrequency || !color}
        >
          <ThemedText style={styles.saveButtonText}>{habitId ? "Update Habit" : "Create Habit"}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff10",
    fontSize: 16,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff15",
  },
  selectedChip: {
    backgroundColor: "#1a8e2d",
  },
  optionText: {
    fontSize: 14,
  },
  selectedOptionText: {
    color: "white",
    fontWeight: "600",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  reminderToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff10",
    borderRadius: 12,
    marginTop: 24,
  },
  reminderText: {
    fontSize: 16,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleOff: {
    backgroundColor: "#00000020",
  },
  toggleOn: {
    backgroundColor: "#1a8e2d",
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
  },
  toggleHandleOn: {
    transform: [{ translateX: 20 }],
  },
  saveButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a8e2d",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  goalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff10",
    justifyContent: "center",
    alignItems: "center",
  },
  goalValue: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
  },
});
