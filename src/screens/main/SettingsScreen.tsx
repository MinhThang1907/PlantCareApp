"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Card, Switch, Button, Divider } from "react-native-paper"
import LinearGradient from "react-native-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../navigation/AppNavigator"

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">

const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  const navigation = useNavigation<SettingsScreenNavigationProp>()

  const settingSections = [
    {
      title: "Notifications",
      items: [
        {
          icon: "notifications",
          title: "Enable Notifications",
          subtitle: "Receive app notifications",
          type: "switch" as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: "phone-android",
          title: "Push Notifications",
          subtitle: "Get push notifications on your device",
          type: "switch" as const,
          value: pushNotifications,
          onToggle: setPushNotifications,
          disabled: !notifications,
        },
        {
          icon: "email",
          title: "Email Notifications",
          subtitle: "Receive updates via email",
          type: "switch" as const,
          value: emailNotifications,
          onToggle: setEmailNotifications,
          disabled: !notifications,
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          icon: "dark-mode",
          title: "Dark Mode",
          subtitle: "Use dark theme (Coming Soon)",
          type: "switch" as const,
          value: darkMode,
          onToggle: setDarkMode,
          disabled: true,
        },
      ],
    },
    {
      title: "Data & Storage",
      items: [
        {
          icon: "save",
          title: "Auto-save Diagnoses",
          subtitle: "Automatically save diagnosis results",
          type: "switch" as const,
          value: autoSave,
          onToggle: setAutoSave,
        },
        {
          icon: "cloud-sync",
          title: "Sync Data",
          subtitle: "Sync your data across devices",
          type: "action" as const,
          onPress: () => Alert.alert("Sync", "Data sync functionality coming soon!"),
        },
        {
          icon: "storage",
          title: "Storage Usage",
          subtitle: "View app storage usage",
          type: "action" as const,
          onPress: () => Alert.alert("Storage", "Storage management coming soon!"),
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        {
          icon: "privacy-tip",
          title: "Privacy Policy",
          subtitle: "Read our privacy policy",
          type: "action" as const,
          onPress: () => Alert.alert("Privacy Policy", "Privacy policy coming soon!"),
        },
        {
          icon: "security",
          title: "Data Security",
          subtitle: "Learn about data protection",
          type: "action" as const,
          onPress: () => Alert.alert("Security", "Security information coming soon!"),
        },
        {
          icon: "delete",
          title: "Delete Account",
          subtitle: "Permanently delete your account",
          type: "action" as const,
          onPress: () =>
            Alert.alert(
              "Delete Account",
              "Are you sure you want to delete your account? This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => {} },
              ],
            ),
          danger: true,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "help",
          title: "Help Center",
          subtitle: "Get help and support",
          type: "action" as const,
          onPress: () => Alert.alert("Help", "Help center coming soon!"),
        },
        {
          icon: "feedback",
          title: "Send Feedback",
          subtitle: "Share your thoughts with us",
          type: "action" as const,
          onPress: () => Alert.alert("Feedback", "Feedback form coming soon!"),
        },
        {
          icon: "bug-report",
          title: "Report a Bug",
          subtitle: "Report issues or bugs",
          type: "action" as const,
          onPress: () => Alert.alert("Bug Report", "Bug report form coming soon!"),
        },
      ],
    },
  ]

  const renderSettingItem = (item: any, index: number, sectionItems: any[]) => (
    <View key={item.title}>
      <View style={[styles.settingItem, item.disabled && styles.settingItemDisabled]}>
        <View style={styles.settingItemLeft}>
          <View style={[styles.settingIcon, item.danger && styles.settingIconDanger]}>
            <Icon name={item.icon} size={20} color={item.danger ? "#F44336" : "#15803d"} />
          </View>
          <View style={styles.settingItemInfo}>
            <Text style={[styles.settingItemTitle, item.danger && styles.settingItemTitleDanger]}>{item.title}</Text>
            <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        {item.type === "switch" ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            disabled={item.disabled}
            thumbColor={item.value ? "#15803d" : "#f4f3f4"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        ) : (
          <TouchableOpacity onPress={item.onPress} disabled={item.disabled}>
            <Icon name="chevron-right" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      {index < sectionItems.length - 1 && <Divider style={styles.settingDivider} />}
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f0fdf4", "#ffffff"]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Button mode="text" onPress={() => navigation.goBack()} textColor="#15803d" icon="arrow-left">
            Back
          </Button>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {settingSections.map((section) => (
            <Card key={section.title} style={styles.sectionCard}>
              <Card.Content style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item, index) => renderSettingItem(item, index, section.items))}
              </Card.Content>
            </Card>
          ))}

          {/* App Info */}
          <Card style={styles.infoCard}>
            <Card.Content style={styles.infoContent}>
              <View style={styles.appInfo}>
                <View style={styles.appIcon}>
                  <Icon name="eco" size={32} color="#15803d" />
                </View>
                <View style={styles.appDetails}>
                  <Text style={styles.appName}>PlantCare</Text>
                  <Text style={styles.appVersion}>Version 1.0.0</Text>
                  <Text style={styles.appDescription}>AI-powered plant disease detection</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingIconDanger: {
    backgroundColor: "#fef2f2",
  },
  settingItemInfo: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  settingItemTitleDanger: {
    color: "#F44336",
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  settingDivider: {
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
  },
  infoCard: {
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoContent: {
    padding: 20,
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  appVersion: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  appDescription: {
    fontSize: 14,
    color: "#84cc16",
    marginTop: 4,
    fontWeight: "500",
  },
})

export default SettingsScreen
