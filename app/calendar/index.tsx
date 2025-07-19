import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { JSX, useCallback, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getHabitLogs,
  getHabits,
  Habit,
  HabitLog,
  recordHabitCompletion,
} from "../../utils/storage";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);
  const [dayHabits, setDayHabits] = useState<Habit[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [allHabits, logs] = await Promise.all([
        getHabits(),
        getHabitLogs(),
      ]);
      setHabits(allHabits.filter((habit) => !habit.deleted));
      setHabitLogs(logs);

      // Filter habits for the selected date
      const date = selectedDate;
      const frequencyFilter = (habit: Habit) => {
        const startDate = new Date(habit.startDate);
        const frequency = habit.frequency;
        const isDay =
          frequency === "daily" ||
          (frequency === "weekdays" &&
            date.getDay() >= 1 &&
            date.getDay() <= 5) ||
          (frequency === "weekends" &&
            (date.getDay() === 0 || date.getDay() === 6)) ||
          (frequency === "weekly" && date.getDay() === 0);
        return isDay && startDate <= date;
      };
      const filteredHabits = allHabits.filter(frequencyFilter);
      setDayHabits(filteredHabits);

      // Get completed habits for the selected date
      const dateStr = date.toDateString();
      const completedIds = logs
        .filter((log) => new Date(log.timestamp).toDateString() === dateStr)
        .map((log) => log.habitId);
      setCompletedHabits(completedIds);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }, [selectedDate]);

  console.log(completedHabits);
  console.log(dayHabits);
  console.log(habitLogs);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month, days).getDay();
    return { days, firstDay, lastDay };
  };

  const { days, firstDay, lastDay } = getDaysInMonth(selectedDate);

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
  const accent = colorScheme === "dark" ? "#1a8e2d" : "#1a8e2d";
  const headerGradient =
    colorScheme === "dark" ? ["#23272a", "#151718"] : ["#1a8e2d", "#146922"];

  const renderCalendar = () => {
    const calendar: JSX.Element[] = [];
    let week: JSX.Element[] = [];

    for (let i = 0; i < firstDay; i++) {
      week.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= days; day++) {
      const date = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        day
      );
      const isToday = new Date().toDateString() === date.toDateString();
      const hasCompleted = habitLogs.some(
        (log) => new Date(log.timestamp).toDateString() === date.toDateString()
      );

      week.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && { backgroundColor: accent + "15" },
            hasCompleted && styles.hasEvents,
            date.toDateString() === selectedDate.toDateString() && {
              borderWidth: 2,
              borderColor: accent,
            },
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <ThemedText
            style={[
              styles.dayText,
              isToday && { color: accent, fontWeight: "600" },
            ]}
          >
            {day}
          </ThemedText>
          {hasCompleted && (
            <View style={[styles.eventDot, { backgroundColor: accent }]} />
          )}
        </TouchableOpacity>
      );

      if (day === days) {
        for (let i = lastDay; i <= 6; i++) {
          week.push(<View key={`empty-end-${i}`} style={styles.calendarDay} />);
        }
      }

      if ((firstDay + day) % 7 === 0 || day === days) {
        calendar.push(
          <View key={day} style={styles.calendarWeek}>
            {week}
          </View>
        );
        week = [];
      }
    }

    return calendar;
  };

  const handleToggleHabit = async (habitId: string) => {
    try {
      const isCompleted = completedHabits.includes(habitId);
      await recordHabitCompletion(
        habitId,
        !isCompleted,
        new Date(selectedDate).toISOString()
      );
      await loadData();
    } catch (error) {
      console.error("Error toggling habit:", error);
      Alert.alert("Error", "Failed to update habit. Please try again.");
    }
  };

  const renderHabitsForDate = () => {
    if (dayHabits.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color={secondaryText} />
          <ThemedText style={[styles.emptyStateText, { color: secondaryText }]}>
            No habits scheduled for this day
          </ThemedText>
        </View>
      );
    }
    return dayHabits.map((habit) => {
      const isCompleted = completedHabits.includes(
        habit._id || habit.tempId || ""
      );
      return (
        <View
          key={habit._id || habit.tempId}
          style={[styles.habitCard, { backgroundColor: cardBg, borderColor }]}
        >
          <View style={[styles.habitColor, { backgroundColor: habit.color }]} />
          <View style={styles.habitInfo}>
            <ThemedText style={[styles.habitName, { color: textColor }]}>
              {habit.name}
            </ThemedText>
            <ThemedText
              style={[styles.habitCategory, { color: secondaryText }]}
            >
              {habit.category}
            </ThemedText>
            <ThemedText style={[styles.habitTime, { color: secondaryText }]}>
              {habit.times[0]}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isCompleted
                ? [styles.completedButton, { backgroundColor: accent }]
                : { backgroundColor: habit.color },
            ]}
            onPress={() => handleToggleHabit(habit._id || habit.tempId)}
          >
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            ) : (
              <ThemedText style={styles.toggleButtonText}>Mark Done</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      );
    });
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <LinearGradient
        colors={headerGradient as [string, string]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: cardBg }]}
          >
            <Ionicons name="chevron-back" size={28} color={accent} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Calendar
          </ThemedText>
        </View>

        <View
          style={[
            styles.calendarContainer,
            {
              backgroundColor: cardBg,
              borderColor,
              shadowColor: colorScheme === "dark" ? "#000" : "#000",
            },
          ]}
        >
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() - 1,
                    1
                  )
                )
              }
            >
              <Ionicons name="chevron-back" size={24} color={textColor} />
            </TouchableOpacity>
            <ThemedText style={[styles.monthText, { color: textColor }]}>
              {selectedDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </ThemedText>
            <TouchableOpacity
              onPress={() =>
                setSelectedDate(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth() + 1,
                    1
                  )
                )
              }
            >
              <Ionicons name="chevron-forward" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayHeader}>
            {WEEKDAYS.map((day) => (
              <ThemedText
                key={day}
                style={[styles.weekdayText, { color: secondaryText }]}
              >
                {day}
              </ThemedText>
            ))}
          </View>

          {renderCalendar()}
        </View>

        <View
          style={[
            styles.scheduleContainer,
            {
              backgroundColor: cardBg,
              shadowColor: colorScheme === "dark" ? "#000" : "#000",
            },
          ]}
        >
          <ThemedText style={[styles.scheduleTitle, { color: textColor }]}>
            {selectedDate.toLocaleDateString("default", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {renderHabitsForDate()}
          </ScrollView>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 140 : 120,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginLeft: 15,
  },
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    margin: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  weekdayHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    color: "#666",
    fontWeight: "500",
  },
  calendarWeek: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 5,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    // height: 44,
    // width: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: "#888",
  },
  today: {
    backgroundColor: "#1a8e2d15",
  },
  todayText: {
    color: "#1a8e2d",
    fontWeight: "600",
  },
  hasEvents: {
    position: "relative",
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1a8e2d",
    position: "absolute",
    bottom: "15%",
  },
  scheduleContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  habitColor: {
    width: 12,
    height: 40,
    borderRadius: 6,
    marginRight: 15,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  habitCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  habitTime: {
    fontSize: 14,
    color: "#666",
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  completedButton: {
    backgroundColor: "#1a8e2d",
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },
});
