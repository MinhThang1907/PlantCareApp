"use client"

import type React from "react"
import { useState } from "react"
import { Image, View, ActivityIndicator, StyleSheet, type ImageProps } from "react-native"

interface OptimizedImageProps extends Omit<ImageProps, "source"> {
  source: { uri: string } | number
  placeholder?: React.ReactNode
  fallback?: React.ReactNode
}

export const OptimizedImage: React.FunctionComponent<OptimizedImageProps> = ({
  source,
  placeholder,
  fallback,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const handleLoadStart = () => {
    setLoading(true)
    setError(false)
  }

  const handleLoadEnd = () => {
    setLoading(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  if (error && fallback) {
    return <>{fallback}</>
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        {...props}
        source={source}
        style={[styles.image, style]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      {loading && (
        <View style={styles.loadingContainer}>{placeholder || <ActivityIndicator size="small" color="#4CAF50" />}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
})
