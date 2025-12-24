'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip } from 'react-native-paper';
import { OptimizedImage } from '../../components/OptimizedImage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import FirebaseService, {
  type DiagnosisHistory,
} from '../../services/FirebaseService';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

const HomeScreen: React.FC = () => {
  const [diagnoses, setDiagnoses] = useState<DiagnosisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 Lấy thông tin profile từ Firestore
  const [userInfo, setUserInfo] = useState<{
    displayName?: string;
    photoURL?: string;
  }>({});

  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();

  // Load profile + diagnoses mỗi khi quay lại màn hình
  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
      loadDiagnoses();
    }, [user]),
  );

  // 👉 Lấy DisplayName + PhotoURL từ Firestore
  const loadUserInfo = async () => {
    if (!user) return;

    try {
      const profile = await FirebaseService.getUserProfile(user.uid);
      setUserInfo(profile || {});
    } catch (error) {
      console.error('Load user info error:', error);
    }
  };

  const loadDiagnoses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDiagnoses = await FirebaseService.getUserDiagnoses(user.uid);
      setDiagnoses(userDiagnoses);
    } catch (error) {
      console.error('Load diagnoses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserInfo();
    await loadDiagnoses();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#F44336';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderDiagnosisCard = (diagnosis: DiagnosisHistory) => (
    <TouchableOpacity
      key={diagnosis.id}
      onPress={() =>
        navigation.navigate('DiagnosisResult', {
          imageUri: diagnosis.imageUrl,
          diagnosis: diagnosis.diagnosis,
        })
      }
    >
      <Card style={styles.diagnosisCard}>
        <View style={styles.cardContent}>
          <OptimizedImage
            source={{ uri: diagnosis.imageUrl }}
            style={styles.diagnosisImage}
            resizeMode="cover"
          />
          <View style={styles.diagnosisInfo}>
            <Text style={styles.diseaseName}>
              {diagnosis.diagnosis.disease}
            </Text>
            <Text style={styles.diagnosisDate}>
              {formatDate(diagnosis.timestamp)}
            </Text>
            <View style={styles.diagnosisDetails}>
              <Chip
                style={[
                  styles.severityChip,
                  {
                    backgroundColor: getSeverityColor(
                      diagnosis.diagnosis.severity,
                    ),
                  },
                ]}
                textStyle={styles.severityText}
              >
                {diagnosis.diagnosis.severity.toUpperCase()}
              </Chip>
              <Text style={styles.confidenceText}>
                {Math.round(diagnosis.diagnosis.confidence * 100)}% confidence
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#6b7280" />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f0fdf4', '#ffffff']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {userInfo.displayName || 'Plant Lover'}!
            </Text>
            <Text style={styles.subtitle}>How are your plants today?</Text>
          </View>

          {/* Avatar từ Firestore */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            {userInfo.photoURL ? (
              <OptimizedImage
                source={{ uri: userInfo.photoURL }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <Icon name="person" size={24} color="#15803d" />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Card.Content style={styles.quickActionsContent}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Camera')}
              >
                <View style={styles.quickActionIcon}>
                  <Icon name="camera-alt" size={28} color="#15803d" />
                </View>
                <Text style={styles.quickActionText}>Diagnose Plant</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.navigate('Community')}
              >
                <View style={styles.quickActionIcon}>
                  <Icon name="forum" size={28} color="#84cc16" />
                </View>
                <Text style={styles.quickActionText}>Community</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Diagnosis History */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historySectionTitle}>Recent Diagnoses</Text>
            {diagnoses.length > 0 && (
              <Button
                mode="text"
                textColor="#15803d"
                onPress={() => navigation.navigate('DiagnosisHistory')}
              >
                View All
              </Button>
            )}
          </View>

          <ScrollView
            style={styles.historyList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#15803d']}
              />
            }
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  Loading your diagnoses...
                </Text>
              </View>
            ) : diagnoses.length > 0 ? (
              diagnoses.map(renderDiagnosisCard)
            ) : (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Icon
                    name="eco"
                    size={60}
                    color="#84cc16"
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyTitle}>No Diagnoses Yet</Text>
                  <Text style={styles.emptyText}>
                    Start by taking a photo of your plant to get AI-powered
                    disease detection and treatment recommendations.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('Camera')}
                    style={styles.emptyButton}
                    buttonColor="#15803d"
                    icon="camera-alt"
                  >
                    Take Your First Photo
                  </Button>
                </Card.Content>
              </Card>
            )}
          </ScrollView>
        </View>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Camera' as any)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
  },
  quickActionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
  },
  quickActionsContent: {
    padding: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  historyList: {
    flex: 1,
  },
  diagnosisCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  diagnosisImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  diagnosisInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  diagnosisDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  diagnosisDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityChip: {
    height: 24,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 4,
  },
  emptyContent: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

export default HomeScreen;
