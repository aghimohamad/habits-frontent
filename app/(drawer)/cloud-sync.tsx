import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  addHabit,
  getHabitLogs,
  getHabits,
  Habit,
  hardDeleteHabit,
  updateHabit,
} from "@/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, TextInput, View } from "react-native";

const API_BASE = "https://habits-server-busi.onrender.com/api/v1/";
const TOKEN_KEY = "@jwt_token";

const CloudSync = () => {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check for token
    const checkToken = async () => {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        // Optionally decode token for user info, here we just use email from last login
        const storedEmail = await AsyncStorage.getItem("@user_email");
        if (storedEmail) setUser({ email: storedEmail });
      }
      setLoading(false);
    };
    checkToken();
  }, []);

  const handleAuth = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    console.log(name, email, password);
    try {
      const endpoint = mode === "sign-in" ? "/sign-in" : "/sign-up";
      const res = await fetch(`${API_BASE}auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        console.log("error");
        setError(data.message || "Authentication failed");
        return;
      }
      if (!data.payload.token) {
        setError("No token received");
        return;
      }
      await AsyncStorage.setItem(TOKEN_KEY, data.payload.token);
      await AsyncStorage.setItem("@user_email", email);
      setToken(data.payload.token);
      setUser({ email });
      setError("");
    } catch (err) {
      console.log(err);
      setError("Network error. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem("@user_email");
    setToken(null);
    setUser(null);
    setEmail("");
    setPassword("");
  };

  const handleSync = async () => {
    setSyncing(true);
    const [allHabits, logs] = await Promise.all([getHabits(), getHabitLogs()]);
    console.log(allHabits, logs);

    // send to cloud
    const res = await fetch(`${API_BASE}habits/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(allHabits),
    });
    const data = await res.json();
    console.log(data);
    for (const tempId of Object.keys(data.payload.tempIds)) {
      await updateHabit(
        tempId,
        data.payload.allHabits.find((h: Habit) => h.tempId === tempId)!
      );
    }
    for (const habit of data.payload.allHabits) {
      const index = allHabits.find((h) => h.tempId === habit.tempId);
      console.log(index);
      if (index) {
        if (index.updatedAt < habit.updatedAt) {
          await updateHabit(habit.tempId, habit);
        }
      } else {
        await addHabit(habit);
      }
    }
    for (const habit of allHabits) {
      if (
        !data.payload.allHabits.find(
          (h: Habit) => h.tempId === habit.tempId && h._id === habit._id
        )
      ) {
        await hardDeleteHabit(habit._id || habit.tempId);
      }
    }

    const logsToSync = logs
      .filter((log) => !log._id)
      .map((log) => ({
        ...log,
        habitId: data.payload.tempIds[log.habitId] || log.habitId, // update to real _id if needed
      }));

    const logRes = await fetch(`${API_BASE}logs/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(logsToSync),
    });
    const logData = await logRes.json();
    console.log(logData);

    // Merge logs like habits
    if (logData.payload && logData.payload.allLogs) {
      const serverLogs = logData.payload.allLogs;
      // Get local logs again in case they changed
      let localLogs = await getHabitLogs();
      // Update or add logs from server
      for (const log of serverLogs) {
        const idx = localLogs.findIndex(
          (l) =>
            (l._id && log._id && l._id === log._id) || l.tempId === log.tempId
        );
        if (idx !== -1) {
          // Update if server log is newer (or just replace)
          localLogs[idx] = { ...localLogs[idx], ...log };
        } else {
          localLogs.push(log);
        }
      }
      // Remove local logs not present on server
      localLogs = localLogs.filter((l) =>
        serverLogs.find(
          (s: import("@/utils/storage").HabitLog) =>
            (s._id && l._id && s._id === l._id) || s.tempId === l.tempId
        )
      );
      await AsyncStorage.setItem("@habit_logs", JSON.stringify(localLogs));
    }
    Alert.alert("Data synced to cloud!");
    setSyncing(false);
  };

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
  const inputBg = useThemeColor(
    { light: "#fafafa", dark: "#23272a" },
    "background"
  );
  const inputBorder = useThemeColor(
    { light: "#ccc", dark: "#444" },
    "background"
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <ThemedText style={{ color: textColor }}>Loading...</ThemedText>
      </ThemedView>
    );
  }
  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {!token ? (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={[styles.title, { color: textColor }]}>
            {mode === "sign-in" ? "Sign In" : "Sign Up"} to Cloud Sync
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
            placeholder="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            keyboardType="default"
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
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
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
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={secondaryText}
          />
          {error ? (
            <ThemedText style={[styles.error, { color: "red" }]}>
              {error}
            </ThemedText>
          ) : null}
          <Button
            title={mode === "sign-in" ? "Sign In" : "Sign Up"}
            onPress={handleAuth}
          />
          <View style={{ height: 12 }} />
          <Button
            title={
              mode === "sign-in"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"
            }
            onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          />
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={[styles.title, { color: textColor }]}>
            Cloud Sync
          </ThemedText>
          <ThemedText style={[styles.label, { color: secondaryText }]}>
            Signed in as:
          </ThemedText>
          <ThemedText style={[styles.userInfo, { color: textColor }]}>
            {user?.email}
          </ThemedText>
          <Button
            title={syncing ? "Syncing..." : "Sync to Cloud"}
            onPress={handleSync}
            disabled={syncing}
          />
          <View style={{ height: 12 }} />
          <Button title="Sign Out" onPress={handleSignOut} color="#d32f2f" />
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
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
  label: {
    fontSize: 16,
    marginTop: 8,
    color: "#666",
  },
  userInfo: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 20,
    color: "#333",
  },
  error: {
    color: "red",
    marginBottom: 8,
  },
});

export default CloudSync;
