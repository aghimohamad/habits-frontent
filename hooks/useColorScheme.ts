import { useTheme } from "@/store/themeContext";

export function useColorScheme() {
  const { theme } = useTheme();
  return theme;
}
