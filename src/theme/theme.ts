import { MD3LightTheme, MD3DarkTheme } from "react-native-paper"

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#4CAF50",
    primaryContainer: "#C8E6C9",
    secondary: "#8BC34A",
    secondaryContainer: "#DCEDC8",
    tertiary: "#FF9800",
    surface: "#FFFFFF",
    surfaceVariant: "#F5F5F5",
    background: "#FAFAFA",
    error: "#F44336",
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onSurface: "#212121",
    onBackground: "#212121",
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#66BB6A",
    primaryContainer: "#2E7D32",
    secondary: "#9CCC65",
    secondaryContainer: "#558B2F",
    tertiary: "#FFB74D",
    surface: "#121212",
    surfaceVariant: "#1E1E1E",
    background: "#000000",
    error: "#EF5350",
    onPrimary: "#000000",
    onSecondary: "#000000",
    onSurface: "#FFFFFF",
    onBackground: "#FFFFFF",
  },
}

export const theme = lightTheme
