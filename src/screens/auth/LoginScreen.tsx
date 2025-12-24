"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native"
import { TextInput, Button, Card } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import LinearGradient from "react-native-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../navigation/AppNavigator"

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { signIn } = useAuth()
  const navigation = useNavigation<LoginScreenNavigationProp>()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
    } catch (error: any) {
      Alert.alert("Login Failed", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f0fdf4", "#ffffff"]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <Icon name="eco" size={60} color="#15803d" />
              </View>
              <Text style={styles.appTitle}>PlantCare</Text>
              <Text style={styles.subtitle}>Care for your plants with AI</Text>
            </View>

            {/* Login Form */}
            <Card style={styles.formCard}>
              <Card.Content style={styles.cardContent}>
                <Text style={styles.formTitle}>Welcome Back</Text>
                <Text style={styles.formSubtitle}>Sign in to continue your plant journey</Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: "#15803d",
                        outline: "#e5e7eb",
                      },
                    }}
                    left={<TextInput.Icon icon="email" />}
                  />

                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: "#15803d",
                        outline: "#e5e7eb",
                      },
                    }}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? "eye-off" : "eye"}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.loginButton}
                  buttonColor="#15803d"
                  textColor="#ffffff"
                  contentStyle={styles.buttonContent}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>

                <View style={styles.linkContainer}>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate("Register")}
                    textColor="#84cc16"
                    style={styles.linkButton}
                  >
                    Don't have an account? Sign Up
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Decorative Elements */}
            <View style={styles.decorativeContainer}>
              <Icon name="local-florist" size={24} color="#84cc16" style={styles.decorativeIcon} />
              <Icon name="nature" size={20} color="#15803d" style={styles.decorativeIcon} />
              <Icon name="eco" size={28} color="#84cc16" style={styles.decorativeIcon} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  cardContent: {
    padding: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#f0fdf4",
  },
  loginButton: {
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkContainer: {
    alignItems: "center",
  },
  linkButton: {
    marginTop: 8,
  },
  decorativeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  decorativeIcon: {
    opacity: 0.3,
  },
})

export default LoginScreen
