"use client"

import { useState, useCallback, useEffect } from "react"
import { Alert, Linking } from "react-native"
import { Camera } from "react-native-vision-camera"

export interface CameraHookReturn {
  hasPermission: boolean
  isLoading: boolean
  requestPermission: () => Promise<void>
  checkPermission: () => Promise<void>
}

export const useCamera = (): CameraHookReturn => {
  const [hasPermission, setHasPermission] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkPermission = useCallback(async () => {
    try {
      const cameraPermission = await Camera.getCameraPermissionStatus()
      setHasPermission(cameraPermission === "granted")
    } catch (error) {
      console.error("Check permission error:", error)
      setHasPermission(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true)
      const cameraPermission = await Camera.getCameraPermissionStatus()

      if (cameraPermission === "not-determined") {
        const newPermission = await Camera.requestCameraPermission()
        setHasPermission(newPermission === "granted")

        if (newPermission === "denied") {
          Alert.alert(
            "Camera Permission Required",
            "PlantCare needs camera access to help identify plant diseases. Please enable camera permission in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ],
          )
        }
      } else if (cameraPermission === "denied") {
        Alert.alert(
          "Camera Permission Denied",
          "Camera permission has been denied. Please enable it in your device settings to use this feature.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        )
      } else {
        setHasPermission(cameraPermission === "granted")
      }
    } catch (error) {
      console.error("Request permission error:", error)
      Alert.alert("Permission Error", "Unable to request camera permission")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    hasPermission,
    isLoading,
    requestPermission,
    checkPermission,
  }
}
