import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getHabitLogs, getHabits, Habit, HabitLog } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

interface GroupedLogs {
  [date: string]: {
    date: Date;
    logs: (HabitLog & { habit: Habit })[];
  };
}

export default function HistoryScreen() {
  const [groupedLogs, setGroupedLogs] = React.useState<GroupedLogs>({});
  const [topStreaks, setTopStreaks] = React.useState<
    (Habit & { streak: number })[]
  >([]);

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const [habits, logs] = await Promise.all([getHabits(), getHabitLogs()]);

      // Group logs by date
      const grouped: GroupedLogs = {};
      logs.forEach((log) => {
        const habit = habits.find((h) => h._id === log.habitId);
        if (!habit) return;

        const date = new Date(log.timestamp).toDateString();
        if (!grouped[date]) {
          grouped[date] = {
            date: new Date(log.timestamp),
            logs: [],
          };
        }
        grouped[date].logs.push({ ...log, habit });
      }); 

      // Sort by date descending
      const sortedGrouped = Object.fromEntries(
        Object.entries(grouped).sort(
          (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
        )
      );

      setGroupedLogs(sortedGrouped);

      // Calculate top streaks
      const streaks = habits
        .map((habit) => ({ ...habit, streak: habit.bestStreak }))
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 3);

      console.log(habits)

      setTopStreaks(streaks);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>History</ThemedText>

      <ScrollView style={styles.content}>
        {/* Top Streaks Section */}
        <View style={styles.streaksContainer}>
          <ThemedText style={styles.sectionTitle}>Top Streaks 🏆</ThemedText>
          <View style={styles.streakCards}>
            {topStreaks.map((habit, index) => (
              <View
                key={habit._id}
                style={[
                  styles.streakCard,
                  { backgroundColor: habit.color + "20" },
                ]}
              >
                <View style={styles.streakHeader}>
                  <ThemedText style={styles.streakRank}>
                    #{index + 1}
                  </ThemedText>
                  <View
                    style={[
                      styles.streakIcon,
                      { backgroundColor: habit.color + "30" },
                    ]}
                  >
                    <Ionicons name="flame" size={20} color={habit.color} />
                  </View>
                </View>
                <ThemedText style={styles.streakName}>{habit.name}</ThemedText>
                <ThemedText style={styles.streakValue}>
                  {habit.streak} days
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Daily Logs Section */}
        <ThemedText style={styles.sectionTitle}>Daily Logs</ThemedText>
        {Object.entries(groupedLogs).map(([date, { date: dateObj, logs }]) => (
          <View key={date} style={styles.dayGroup}>
            <ThemedText style={styles.dateHeader}>
              {formatDate(dateObj)}
            </ThemedText>
            {logs.map((log) => (
              <View
                key={log._id}
                style={[
                  styles.logItem,
                  { backgroundColor: log.habit.color + "15" },
                ]}
              >
                <View style={styles.logContent}>
                  <View
                    style={[
                      styles.logIcon,
                      { backgroundColor: log.habit.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={log.completed ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={log.habit.color}
                    />
                  </View>
                  <View style={styles.logDetails}>
                    <ThemedText style={styles.habitName}>
                      {log.habit.name}
                    </ThemedText>
                    <ThemedText style={styles.logTime}>
                      {new Date(log.timestamp).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </ThemedText>
                  </View>
                </View>
                {log.notes && (
                  <ThemedText style={styles.logNotes}>{log.notes}</ThemedText>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingTop: 60,
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  streaksContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  streakCards: {
    flexDirection: "row",
    gap: 12,
  },
  streakCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
  },
  streakHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  streakRank: {
    fontSize: 12,
    opacity: 0.7,
  },
  streakIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  streakName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  dayGroup: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  logItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  logContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  logTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  logNotes: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
    marginLeft: 48,
  },
});
