import { Habit } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: (habitId: string) => void;
}

export const HabitCard = ({ habit, isCompleted, onToggle }: HabitCardProps) => {
  console.log(habit)
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: habit.color + "20" }]}
      onPress={() => onToggle(habit._id || habit.tempId)}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: habit.color + "33" }]}
      >
        <Ionicons
          name={isCompleted ? "checkmark-circle" : "time-outline"}
          size={20}
          color={habit.color}
        />
      </View>
      <View style={styles.content}>
        <ThemedText style={styles.title}>{habit.name}</ThemedText>
        <ThemedText style={styles.subtitle}>{habit.category}</ThemedText>
        {habit.streak > 0 && (
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color="#FF9800" />
            <ThemedText style={styles.streakText}>
              {habit.streak} day streak
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.status}>
        {isCompleted ? (
          <View style={[styles.badge, styles.completedBadge]}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <ThemedText style={styles.completedText}>Done</ThemedText>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: habit.color + "33" }]}>
            <ThemedText style={[styles.pendingText, { color: habit.color }]}>
              Tick
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    color: "#FF9800",
  },
  status: {
    minWidth: 80,
    alignItems: "flex-end",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  completedBadge: {
    backgroundColor: "#E8F5E9",
  },
  completedText: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 14,
  },
  pendingText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
