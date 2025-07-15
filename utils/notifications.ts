import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from './storage';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
})


export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token: string | null = null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const response = await Notifications.getExpoPushTokenAsync();
    token = response.data;
    console.log(token, 'token')
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1a8e2d",
      });
    }

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export async function scheduleHabitReminder(
  habit: Habit
): Promise<string | undefined> {
  if (!habit.reminderEnabled) return;

  try {
    // Schedule notifications for each time
    for (const time of habit.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);

      // If time has passed for today, schedule for tomorrow
      if (today < new Date()) {
        today.setDate(today.getDate() + 1);
      }

      console.log(hours, minutes, 'timeee')

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Habit Reminder",
          body: `Time to ${habit.name}`,
          data: { habitId: habit.id },
        },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        //   repeats: true,
        },
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling habit reminder:", error);
    return undefined;
  }
}

export async function cancelHabitReminders(
  habitId: string
): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        habitId?: string;
      } | null;
      if (data?.habitId === habitId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error("Error canceling habit reminders:", error);
  }
}

export async function updateHabitReminders(
  habit: Habit
): Promise<void> {
  try {
    // Cancel existing reminders
    await cancelHabitReminders(habit.id);

    // Schedule new reminders
    await scheduleHabitReminder(habit);
    await scheduleRefillReminder(habit);
  } catch (error) {
    console.error("Error updating habit reminders:", error);
  }
}