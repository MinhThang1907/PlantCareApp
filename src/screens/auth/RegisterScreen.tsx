"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native"
import { TextInput, Button, Card, Checkbox } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import LinearGradient from "react-native-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../navigation/AppNavigator"

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">

const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const { signUp } = useAuth()
  const navigation = useNavigation<RegisterScreenNavigationProp>()

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    if (!acceptTerms) {
      Alert.alert("Error", "Please accept the terms and conditions")
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, displayName)
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f0fdf4", "#ffffff"]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Button
                mode="text"
                onPress={() => navigation.goBack()}
                textColor="#15803d"
                style={styles.backButton}
                icon="arrow-left"
              >
                Back
              </Button>

              <View style={styles.logoContainer}>
                <Icon name="eco" size={50} color="#15803d" />
              </View>
              <Text style={styles.formTitle}>Join PlantCare</Text>
              <Text style={styles.subtitle}>Start your plant care journey today</Text>
            </View>

            {/* Registration Form */}
            <Card style={styles.formCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Full Name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    mode="outlined"
                    autoCapitalize="words"
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: "#15803d",
                        outline: "#e5e7eb",
                      },
                    }}
                    left={<TextInput.Icon icon="account" />}
                  />

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

                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    mode="outlined"
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                    theme={{
                      colors: {
                        primary: "#15803d",
                        outline: "#e5e7eb",
                      },
                    }}
                    left={<TextInput.Icon icon="lock-check" />}
                    right={
                      <TextInput.Icon
                        icon={showConfirmPassword ? "eye-off" : "eye"}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    }
                  />
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <Checkbox
                    status={acceptTerms ? "checked" : "unchecked"}
                    onPress={() => setAcceptTerms(!acceptTerms)}
                    color="#15803d"
                  />
                  <Text style={styles.termsText}>
                    I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text> and{" "}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={handleRegister}
                  loading={loading}
                  disabled={loading}
                  style={styles.registerButton}
                  buttonColor="#15803d"
                  textColor="#ffffff"
                  contentStyle={styles.buttonContent}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <View style={styles.linkContainer}>
                  <Button
                    mode="text"
                    onPress={() => navigation.navigate("Login")}
                    textColor="#84cc16"
                    style={styles.linkButton}
                  >
                    Already have an account? Sign In
                  </Button>
                </View>
              </Card.Content>
            </Card>

            {/* Decorative Elements */}
            <View style={styles.decorativeContainer}>
              <Icon name="local-florist" size={20} color="#84cc16" style={styles.decorativeIcon} />
              <Icon name="nature" size={24} color="#15803d" style={styles.decorativeIcon} />
              <Icon name="eco" size={18} color="#84cc16" style={styles.decorativeIcon} />
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
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#15803d",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 28,
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
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#f0fdf4",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    lineHeight: 20,
  },
  termsLink: {
    color: "#84cc16",
    fontWeight: "500",
  },
  registerButton: {
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
    gap: 12,
  },
  decorativeIcon: {
    opacity: 0.3,
  },
})

export default RegisterScreen
