// app/(drawer)/_layout.tsx
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTheme } from "@/store/themeContext";
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import React from "react";

export default function DrawerLayout() {
  const { theme } = useTheme();
  const cardBg = useThemeColor(
    { light: "#fff", dark: "#23272a" },
    "background"
  );
  const textColor = useThemeColor({}, "text");
  const headerBg = useThemeColor(
    { light: "#fff", dark: "#23272a" },
    "background"
  );
  const headerText = useThemeColor({}, "text");

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerContentStyle: {
          backgroundColor: cardBg,
        },
        drawerInactiveTintColor: textColor,
        drawerActiveTintColor: textColor,
        headerStyle: {
          backgroundColor: headerBg,
        },
        headerTintColor: headerText,
      }}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: "Home",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="cloud-sync"
        options={{
          title: "Enable Cloud Syncing",
          headerShown: true,
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cloud-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
