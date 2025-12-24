import type React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { PaperProvider } from "react-native-paper"
import { StatusBar } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./src/contexts/AuthContext"
import AppNavigator from "./src/navigation/AppNavigator"
import { theme } from "./src/theme/theme"

function App(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}

export default App
