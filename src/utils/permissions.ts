import { Platform, PermissionsAndroid, Alert, Linking } from "react-native"
import { Camera } from "react-native-vision-camera"

export class PermissionManager {
  static async requestCameraPermission(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: "Camera Permission",
          message: "PlantCare needs access to your camera to help identify plant diseases.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        })
        return granted === PermissionsAndroid.RESULTS.GRANTED
      } else {
        const permission = await Camera.requestCameraPermission()
        return permission === "granted"
      }
    } catch (error) {
      console.error("Camera permission error:", error)
      return false
    }
  }

  static async requestStoragePermission(): Promise<boolean> {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, {
          title: "Storage Permission",
          message: "PlantCare needs access to your photos to help identify plant diseases.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        })
        return granted === PermissionsAndroid.RESULTS.GRANTED
      }
      return true // iOS doesn't need explicit storage permission for image picker
    } catch (error) {
      console.error("Storage permission error:", error)
      return false
    }
  }

  static showPermissionAlert(type: "camera" | "storage") {
    const title = type === "camera" ? "Camera Permission Required" : "Storage Permission Required"
    const message =
      type === "camera"
        ? "PlantCare needs camera access to help identify plant diseases."
        : "PlantCare needs access to your photos to help identify plant diseases."

    Alert.alert(title, `${message} Please enable this permission in your device settings.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ])
  }
}
