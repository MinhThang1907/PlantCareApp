'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Avatar, Button, Divider } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import FirebaseService, {
  type DiagnosisHistory,
} from '../../services/FirebaseService';
import auth from '@react-native-firebase/auth';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

interface UserStats {
  totalDiagnoses: number;
  totalPosts: number;
  joinDate: Date;
}

interface UserProfileData {
  displayName: string;
  photoURL?: string;
}

const ProfileScreen: React.FC = () => {
  const [stats, setStats] = useState<UserStats>({
    totalDiagnoses: 0,
    totalPosts: 0,
    joinDate: new Date(),
  });
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    displayName: '',
    photoURL: undefined,
  });
  const [recentDiagnoses, setRecentDiagnoses] = useState<DiagnosisHistory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, signOut } = useAuth();

  useFocusEffect(
    useCallback(() => {
      let unsubProfile: (() => void) | undefined;
      if (user) {
        loadUserData();

        // Subscribe to profile document in Firestore (your FirebaseService implementation)
        unsubProfile = FirebaseService.subscribeToUserProfile(
          user.uid,
          profile => {
            // profile expected shape { displayName, photoURL, ... }
            if (profile) {
              setUserProfile({
                displayName: profile.displayName || user.displayName || '',
                photoURL: profile.photoURL || user.photoURL || undefined,
              });
            } else {
              // fallback to auth user
              setUserProfile({
                displayName: user.displayName || '',
                photoURL: user.photoURL || undefined,
              });
            }
          },
        );
      }

      return () => {
        if (typeof unsubProfile === 'function') unsubProfile();
      };
    }, [user]),
  );

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const diagnoses = await FirebaseService.getUserDiagnoses(user.uid);
      const postsCount = await FirebaseService.getUserPostsCount(user.uid);

      setRecentDiagnoses(diagnoses.slice(0, 3));
      setStats({
        totalDiagnoses: diagnoses.length,
        totalPosts: postsCount,
        joinDate: user.metadata.creationTime
          ? new Date(user.metadata.creationTime)
          : new Date(),
      });
    } catch (error) {
      console.error('Load user data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const formatJoinDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const menuItems = [
    {
      icon: 'edit',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => navigation.navigate('EditProfile' as any),
    },
    {
      icon: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and notifications',
      onPress: () => navigation.navigate('Settings' as any),
    },
    {
      icon: 'history',
      title: 'Diagnosis History',
      subtitle: 'View all your plant diagnoses',
      onPress: () => navigation.navigate('DiagnosisHistory' as any),
    },
    {
      icon: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Help', 'Help functionality coming soon!'),
    },
    {
      icon: 'info',
      title: 'About PlantCare',
      subtitle: 'Learn more about the app',
      onPress: () =>
        Alert.alert(
          'About',
          'PlantCare v1.0.0\nAI-powered plant disease detection',
        ),
    },
  ];

  // Decide avatar to show: prefer subscription userProfile.photoURL, then auth current user, then initial
  const avatarUri =
    userProfile.photoURL ?? auth().currentUser?.photoURL ?? undefined;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f0fdf4', '#ffffff']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings' as any)}
            >
              <Icon name="settings" size={24} color="#15803d" />
            </TouchableOpacity>
          </View>

          {/* Profile Info Card */}
          <Card style={styles.profileCard}>
            <Card.Content style={styles.profileContent}>
              <View style={styles.profileHeader}>
                {avatarUri ? (
                  <Avatar.Image
                    size={80}
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Avatar.Text
                    size={80}
                    label={(userProfile.displayName || 'U')
                      .charAt(0)
                      .toUpperCase()}
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />
                )}

                <View style={styles.profileInfo}>
                  <Text style={styles.displayName}>
                    {userProfile.displayName || 'Anonymous'}
                  </Text>
                  <Text style={styles.email}>{user?.email}</Text>
                  <Text style={styles.joinDate}>
                    Joined {formatJoinDate(stats.joinDate)}
                  </Text>
                </View>
              </View>

              <Button
                mode="outlined"
                onPress={() => navigation.navigate('EditProfile' as any)}
                style={styles.editButton}
                textColor="#15803d"
              >
                Edit Profile
              </Button>
            </Card.Content>
          </Card>

          {/* Stats Card */}
          <Card style={styles.statsCard}>
            <Card.Content style={styles.statsContent}>
              <Text style={styles.statsTitle}>Your Activity</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.totalDiagnoses}</Text>
                  <Text style={styles.statLabel}>Diagnoses</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.totalPosts}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {recentDiagnoses.length > 0 ? 'Active' : 'New'}
                  </Text>
                  <Text style={styles.statLabel}>Status</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Recent Diagnoses */}
          {recentDiagnoses.length > 0 && (
            <Card style={styles.recentCard}>
              <Card.Content style={styles.recentContent}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recent Diagnoses</Text>
                  <Button
                    mode="text"
                    textColor="#15803d"
                    onPress={() =>
                      navigation.navigate('DiagnosisHistory' as any)
                    }
                  >
                    View All
                  </Button>
                </View>
                {recentDiagnoses.map((diagnosis, index) => (
                  <View key={diagnosis.id}>
                    <View style={styles.diagnosisItem}>
                      <View style={styles.diagnosisIcon}>
                        <Icon name="eco" size={20} color="#15803d" />
                      </View>
                      <View style={styles.diagnosisInfo}>
                        <Text style={styles.diagnosisDisease}>
                          {diagnosis.diagnosis.disease}
                        </Text>
                        <Text style={styles.diagnosisDate}>
                          {diagnosis.timestamp.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.diagnosisConfidence}>
                        {Math.round(diagnosis.diagnosis.confidence * 100)}%
                      </Text>
                    </View>
                    {index < recentDiagnoses.length - 1 && (
                      <Divider style={styles.diagnosisDivider} />
                    )}
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Menu Items */}
          <Card style={styles.menuCard}>
            <Card.Content style={styles.menuContent}>
              {menuItems.map((item, index) => (
                <View key={item.title}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIcon}>
                        <Icon name={item.icon} size={20} color="#15803d" />
                      </View>
                      <View style={styles.menuItemInfo}>
                        <Text style={styles.menuItemTitle}>{item.title}</Text>
                        <Text style={styles.menuItemSubtitle}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color="#6b7280" />
                  </TouchableOpacity>
                  {index < menuItems.length - 1 && (
                    <Divider style={styles.menuDivider} />
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Sign Out Button */}
          <Button
            mode="outlined"
            onPress={handleSignOut}
            style={styles.signOutButton}
            textColor="#F44336"
            icon="logout"
          >
            Sign Out
          </Button>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollView: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileContent: { padding: 20 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: { backgroundColor: '#15803d', marginRight: 16 },
  avatarImage: { marginRight: 16 },
  avatarLabel: { color: '#ffffff', fontSize: 32, fontWeight: '600' },
  profileInfo: { flex: 1 },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: { fontSize: 16, color: '#6b7280', marginBottom: 4 },
  joinDate: { fontSize: 14, color: '#84cc16', fontWeight: '500' },
  editButton: { borderColor: '#15803d', borderRadius: 8 },
  statsCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContent: { padding: 20 },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 4,
  },
  statLabel: { fontSize: 14, color: '#6b7280' },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  recentCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recentContent: { padding: 20 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  diagnosisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  diagnosisIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  diagnosisInfo: { flex: 1 },
  diagnosisDisease: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  diagnosisDate: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  diagnosisConfidence: { fontSize: 14, fontWeight: '600', color: '#15803d' },
  diagnosisDivider: { backgroundColor: '#e5e7eb', marginVertical: 4 },
  menuCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuContent: { padding: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemInfo: { flex: 1 },
  menuItemTitle: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  menuItemSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  menuDivider: { backgroundColor: '#e5e7eb', marginVertical: 4 },
  signOutButton: { borderColor: '#F44336', borderRadius: 8, marginBottom: 32 },
});

export default ProfileScreen;
