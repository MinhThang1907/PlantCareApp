import type React from "react"
import { View, StyleSheet } from "react-native"
import { ActivityIndicator, Text } from "react-native-paper"
import LinearGradient from "react-native-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"

const LoadingScreen: React.FC = () => {
  return (
    <LinearGradient colors={["#f0fdf4", "#ffffff"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Icon name="eco" size={60} color="#15803d" />
        </View>
        <Text style={styles.appTitle}>PlantCare</Text>
        <ActivityIndicator size="large" color="#15803d" style={styles.loader} />
        <Text style={styles.loadingText}>Loading your plant journey...</Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#15803d",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#15803d",
    marginBottom: 32,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
})

export default LoadingScreen
