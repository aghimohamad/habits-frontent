import AsyncStorage from "@react-native-async-storage/async-storage";

const HABITS_KEY = "@habits";
const HABIT_LOGS_KEY = "@habit_logs";

export interface Habit {
  _id?: string;
  tempId: string;
  name: string;
  category: string;
  frequency: string; // Daily, Weekdays, Weekends, Weekly
  startDate: string;
  times: string[]; // Array of time strings in "HH:mm" format
  color: string;
  reminderEnabled: boolean;
  goal: number; // daily/weekly goal
  streak: number; // current streak
  bestStreak: number; // best streak achieved
  lastCompleted?: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface HabitLog {
  _id?: string;
  tempId: string;
  habitId: string;
  timestamp: string;
  completedCount: number;
  goal: number;
  notes?: string; // optional notes for the habit completion
}

export async function getHabits(): Promise<Habit[]> {
  try {
    const data = await AsyncStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting habits:", error);
    return [];
  }
}

export async function addHabit(habit: Habit): Promise<void> {
  try {
    const habits = await getHabits();
    habits.push(habit);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (error) {
    console.error("Error adding habit:", error);
    throw error;
  }
}

export async function updateHabit(
  tempId: string,
  updatedHabit: Partial<Habit>
): Promise<void> {
  try {
    const habits = await getHabits();
    const index = habits.findIndex(
      (h) => h._id === tempId || h.tempId === tempId
    );
    if (index !== -1) {
      habits[index] = { ...habits[index], ...updatedHabit };
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    }
  } catch (error) {
    console.error("Error updating habit:", error);
    throw error;
  }
}

export async function softDeleteHabit(id: string): Promise<void> {
  try {
    const habits = await getHabits();
    const habitToDelete = habits.find((h) => h._id === id || h.tempId === id);
    if (habitToDelete) {
      habitToDelete.deleted = true;
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    }
  } catch (error) {
    console.error("Error deleting habit:", error);
    throw error;
  }
}

export async function hardDeleteHabit(id: string): Promise<void> {
  try {
    const habits = await getHabits();
    const habitToDelete = habits.find((h) => h._id === id || h.tempId === id);
    if (habitToDelete) {
      await AsyncStorage.setItem(
        HABITS_KEY,
        JSON.stringify(habits.filter((h) => h._id !== id && h.tempId !== id))
      );
    }
  } catch (error) {
    console.error("Error deleting habit:", error);
    throw error;
  }
}

export async function getTodaysHabits(): Promise<HabitLog[]> {
  try {
    const logs = await getHabitLogs();
    const today = new Date().toDateString();
    return logs.filter(
      (log) => new Date(log.timestamp).toDateString() === today
    );
  } catch (error) {
    console.error("Error getting today's habits:", error);
    return [];
  }
}

export async function getHabitLogs(): Promise<HabitLog[]> {
  try {
    const data = await AsyncStorage.getItem(HABIT_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting habit logs:", error);
    return [];
  }
}

export async function recordHabitCompletion(
  habitId: string,
  timestamp: string,
  goal: number,
  notes?: string
): Promise<void> {
  try {
    // const logs = await getHabitLogs();
    // const
    // const newLog: HabitLog = {
    //   tempId: Math.random().toString(36).substr(2, 9),
    //   habitId: habitId,
    //   timestamp,
    //   goal:
    //   notes,
    // };
    const logs = await getHabitLogs();
    const today = new Date().toDateString();
    let log = logs.find(
      (l) =>
        l.habitId === habitId && new Date(l.timestamp).toDateString() === today
    );

    if (log && log?.completedCount === log?.goal) {
      console.log("not completed");
      // If not completed, remove any existing log for today
      const today = new Date().toDateString();
      const existingLogIndex = logs.findIndex(
        (log) =>
          log.habitId === habitId &&
          new Date(log.timestamp).toDateString() === today
      );
      if (existingLogIndex !== -1) {
        logs.splice(existingLogIndex, 1);
      }
      await AsyncStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(logs));
      return;
    }
    console.log("existing =====", log);
    let completed;

    if (log) {
      if (log.goal > log.completedCount) log.completedCount += 1;
      if (log.completedCount < 0) log.completedCount = 0; // Prevent negative
    } else {
      log = {
        tempId: Math.random().toString(36).substr(2, 9),
        habitId,
        timestamp,
        completedCount: 1,
        goal,
        notes,
      };
      logs.push(log);
    }
    completed = log && log?.goal === log?.completedCount;
    console.log('completed boolean', completed)

    

    await AsyncStorage.setItem(HABIT_LOGS_KEY, JSON.stringify(logs));

    // Update habit streak if completed
    if (completed) {
      const habits = await getHabits();
      const habit = habits.find(
        (h) => h._id === habitId || h.tempId === habitId
      );
      if (habit) {
        console.log(habit);
        const lastCompletedDate = habit.lastCompleted
          ? new Date(habit.lastCompleted).toDateString()
          : null;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (!lastCompletedDate || lastCompletedDate === yesterday) {
          console.log("incrementing streak");
          habit.streak += 1;
          habit.bestStreak = Math.max(habit.streak, habit.bestStreak);
        } else if (lastCompletedDate !== today) {
          console.log("resetting streak");
          habit.streak = 1;
        }

        habit.lastCompleted = timestamp;
        const id = habit._id || habit.tempId;
        await updateHabit(id, habit);
      }
    }
  } catch (error) {
    console.error("Error recording habit completion:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([HABITS_KEY, HABIT_LOGS_KEY]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}

export async function getWeeklyStats(habitId?: string): Promise<{
  total: number;
  completed: number;
  streak: number;
}> {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const logs = await getHabitLogs();
    const weekLogs = logs.filter(
      (log) =>
        new Date(log.timestamp) > weekAgo &&
        (!habitId || log.habitId === habitId)
    );

    const total = weekLogs.length;
    const completed = weekLogs.filter((log) => log.completedCount === log.goal).length;

    // Get current streak if habitId is provided
    let streak = 0;
    if (habitId) {
      const habit = (await getHabits()).find((h) => h._id === habitId);
      streak = habit?.streak || 0;
    }

    return { total, completed, streak };
  } catch (error) {
    console.error("Error getting weekly stats:", error);
    return { total: 0, completed: 0, streak: 0 };
  }
}
