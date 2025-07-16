import { CircularProgress } from "@/components/CircularProgress";
import { HabitCard } from "@/components/HabitCard";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import {
  Habit,
  clearAllData,
  getHabits,
  getTodaysHabits,
  recordHabitCompletion,
} from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { ParamListBase } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect, useNavigation } from "expo-router";

import React, { useCallback } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const QUICK_ACTIONS = [
  {
    icon: "add-circle-outline" as const,
    label: "New\nHabit",
    route: "/habits/add" as const,
    color: "#2E7D32",
    gradient: ["#4CAF50", "#2E7D32"] as [string, string],
  },
  {
    icon: "stats-chart-outline" as const,
    label: "Progress\nStats",
    route: "/calendar" as const,
    color: "#1976D2",
    gradient: ["#2196F3", "#1976D2"] as [string, string],
  },
  {
    icon: "flame-outline" as const,
    label: "Streaks\nView",
    route: "/history" as const,
    color: "#C2185B",
    gradient: ["#E91E63", "#C2185B"] as [string, string],
  },
  {
    icon: "create-outline" as const,
    label: "Manage\nHabits",
    route: "/habits/manage" as const,
    color: "#E64A19",
    gradient: ["#FF5722", "#E64A19"] as [string, string],
  },
];

export default function Home() {
  // const router = useRouter()
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [habits, setHabits] = React.useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = React.useState<string[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [todayHabits, setTodayHabits] = React.useState<Habit[]>([]);
  const loadHabits = useCallback(async () => {
    await registerForPushNotificationsAsync();
    try {
      const [allHabits, todaysLogs] = await Promise.all([
        getHabits(),
        getTodaysHabits(),
      ]);

      setHabits(allHabits.filter((habit) => !habit.deleted));
      const todaysHabits = allHabits.filter((habit) => {
        const startDate = new Date(habit.startDate);
        const today = new Date();
        const frequency = habit.frequency;
        const isToday =
          frequency === "daily" ||
          (frequency === "weekdays" &&
            today.getDay() >= 1 &&
            today.getDay() <= 5) ||
          (frequency === "weekends" &&
            (today.getDay() === 0 || today.getDay() === 6)) ||
          (frequency === "weekly" && today.getDay() === 0);
        return isToday && startDate <= today;
      });
      setTodayHabits(todaysHabits);
      console.log(todaysLogs)
      const completedIds = todaysLogs
        .filter((log) => log.timestamp)
        .map((log) => log.habitId)
      console.log(completedIds)
      setCompletedHabits(completedIds);

      const completionRate =
        allHabits.length > 0
          ? (completedIds.length / allHabits.length) * 100
          : 0;
      setProgress(completionRate);
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  }, []);

  React.useEffect(() => {
    loadHabits();
  }, [loadHabits]);
  console.log(habits)
  useFocusEffect(
    useCallback(() => {
      loadHabits();
      return () => {};
    }, [loadHabits])
  );

  const handleToggleHabit = async (habitId: string) => {
    try {
      const isCompleted = completedHabits.includes(habitId);
      console.log(isCompleted)
      await recordHabitCompletion(
        habitId,
        !isCompleted,
        new Date().toISOString()
      );
      await loadHabits();
    } catch (error) {
      console.error("Error toggling habit:", error);
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#1a8e2d", "#146922"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.openDrawer()}
              >
                <Ionicons name="menu" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Daily Progress</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotifications(!showNotifications)}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <CircularProgress
            progress={progress}
            total={habits.length}
            completed={completedHabits.length}
            label="habits"
          />
        </View>
      </LinearGradient>

      {/* btn to clear all habits  */}
      <TouchableOpacity onPress={() => clearAllData()}>
        <Text>Clear All Habits</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Link href={action.route} asChild key={action.label}>
                <TouchableOpacity
                  key={action.label}
                  style={{
                    // flexBasis: "48%",
                    width: (width - 50) * 0.5,
                    height: 100,
                    backgroundColor: action.color,
                    borderRadius: 15,
                  }}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={{
                      width: "100%",
                      height: "100%",
                      flex: 1,
                      borderRadius: 15,
                      alignItems: "flex-start",
                      justifyContent: "center",
                      padding: 15,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 5,
                      }}
                    >
                      <Ionicons name={action.icon} size={28} color="white" />
                    </View>
                    <Text
                      style={{
                        color: "white",
                        textAlign: "left",
                        fontSize: 12,
                        fontWeight: "500",
                      }}
                    >
                      {action.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Habits</Text>
            <Link href="/habits" style={styles.seeAllButton}>
              See All
            </Link>
          </View>

          {todayHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No habits added yet</Text>
              <Link href="/habits/add" asChild>
                <TouchableOpacity style={styles.addHabitButton}>
                  <Text style={styles.addHabitButtonText}>
                    Add Your First Habit
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            <View style={styles.habitsList}>
              {todayHabits.map((habit) => (
                <HabitCard
                  key={habit._id || habit.tempId}
                  habit={habit}
                  isCompleted={completedHabits.includes(habit._id || habit.tempId || "")}
                  onToggle={handleToggleHabit}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reminders</Text>
              <TouchableOpacity
                onPress={() => setShowNotifications(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {habits
              .filter((habit) => habit.reminderEnabled)
              .map((habit) => (
                <View key={habit._id || habit.tempId} style={styles.notificationItem}>
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: habit.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={
                        completedHabits.includes(habit.id)
                          ? "checkmark-circle"
                          : "time"
                      }
                      size={24}
                      color={habit.color}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{habit.name}</Text>
                    <Text style={styles.notificationCategory}>
                      {habit.category}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {habit.frequency[0]}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingVertical: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  headerTitle: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: "#ffffff2d",
    borderRadius: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    width: (width - 40) / 2,
    height: 100,
    borderRadius: 15,
    overflow: "hidden",
  },
  actionGradient: {
    flex: 1,
    padding: 15,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAllButton: {
    color: "#1a8e2d",
    fontSize: 16,
    fontWeight: "500",
  },
  habitsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
    borderRadius: 16,
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    marginBottom: 20,
  },
  addHabitButton: {
    backgroundColor: "#1a8e2d",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addHabitButtonText: {
    color: "white",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  notificationCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
});
