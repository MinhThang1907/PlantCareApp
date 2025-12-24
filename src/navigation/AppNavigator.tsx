"use client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useAuth } from "../contexts/AuthContext"

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"

// Main Screens
import HomeScreen from "../screens/main/HomeScreen"
import CameraScreen from "../screens/main/CameraScreen"
import CommunityScreen from "../screens/main/CommunityScreen"
import ProfileScreen from "../screens/main/ProfileScreen"
import DiagnosisResultScreen from "../screens/main/DiagnosisResultScreen"
import CreatePostScreen from "../screens/main/CreatePostScreen"
import PostDetailScreen from "../screens/main/PostDetailScreen"
import DiagnosisHistoryScreen from "../screens/main/DiagnosisHistoryScreen"
import EditProfileScreen from "../screens/main/EditProfileScreen"
import SettingsScreen from "../screens/main/SettingsScreen"

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  Login: undefined
  Register: undefined
  Home: undefined
  Camera: undefined
  Community: undefined
  Profile: undefined
  DiagnosisResult: {
    imageUri: string
    diagnosis: any
  }
  PostDetail: {
    postId: string
  }
  CreatePost: undefined
  Settings: undefined
  DiagnosisHistory: undefined
  EditProfile: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
)

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = ""
        switch (route.name) {
          case "Home":
            iconName = "home"
            break
          case "Camera":
            iconName = "camera-alt"
            break
          case "Community":
            iconName = "forum"
            break
          case "Profile":
            iconName = "person"
            break
        }
        return <Icon name={iconName} size={size} color={color} />
      },
      tabBarActiveTintColor: "#4CAF50",
      tabBarInactiveTintColor: "gray",
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Camera" component={CameraScreen} />
    <Tab.Screen name="Community" component={CommunityScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
)

const AppNavigator = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Group screenOptions={{ presentation: "modal" }}>
            <Stack.Screen name="DiagnosisResult" component={DiagnosisResultScreen} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="DiagnosisHistory" component={DiagnosisHistoryScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Group>
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  )
}

export default AppNavigator
