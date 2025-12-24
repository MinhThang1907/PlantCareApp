'use client';

import type React from 'react';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import FirebaseService, {
  type DiagnosisHistory,
} from '../../services/FirebaseService';

type DiagnosisHistoryScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

const DiagnosisHistoryScreen: React.FC = () => {
  const [diagnoses, setDiagnoses] = useState<DiagnosisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null);

  const navigation = useNavigation<DiagnosisHistoryScreenNavigationProp>();
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      loadDiagnoses();
    }, [user]),
  );

  const loadDiagnoses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await FirebaseService.getUserDiagnoses(user.uid);
      setDiagnoses(data);
    } catch (error) {
      console.error('Load diagnoses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDiseaseStats = () => {
    const stats: { [key: string]: { count: number; avgConfidence: number } } =
      {};

    diagnoses.forEach(diagnosis => {
      const disease = diagnosis.diagnosis.disease;
      if (!stats[disease]) {
        stats[disease] = { count: 0, avgConfidence: 0 };
      }
      stats[disease].count += 1;
      stats[disease].avgConfidence += diagnosis.diagnosis.confidence;
    });

    Object.keys(stats).forEach(disease => {
      stats[disease].avgConfidence =
        stats[disease].avgConfidence / stats[disease].count;
    });

    return stats;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const diseaseStats = getDiseaseStats();

  const renderDiagnosisItem = ({ item }: { item: DiagnosisHistory }) => (
    <Card style={styles.diagnosisCard}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('DiagnosisResult' as any, {
            imageUri: item.imageUrl,
            diagnosis: item.diagnosis,
          })
        }
      >
        <Card.Content style={styles.diagnosisContent}>
          <View style={styles.diagnosisHeader}>
            <View style={styles.diseaseInfo}>
              <Text style={styles.diseaseName}>{item.diagnosis.disease}</Text>
              <Text style={styles.diagnosisDateTime}>
                {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
              </Text>
            </View>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceValue}>
                {Math.round(item.diagnosis.confidence * 100)}%
              </Text>
              <Text style={styles.confidenceLabel}>confidence</Text>
            </View>
          </View>

          <View style={styles.diagnosisBody}>
            <View style={styles.severityBadge}>
              <Icon
                name={
                  item.diagnosis.severity === 'high'
                    ? 'warning'
                    : item.diagnosis.severity === 'medium'
                    ? 'info'
                    : 'check-circle'
                }
                size={16}
                color={
                  item.diagnosis.severity === 'high'
                    ? '#F44336'
                    : item.diagnosis.severity === 'medium'
                    ? '#FF9800'
                    : '#4CAF50'
                }
              />
              <Text
                style={[
                  styles.severityText,
                  {
                    color:
                      item.diagnosis.severity === 'high'
                        ? '#F44336'
                        : item.diagnosis.severity === 'medium'
                        ? '#FF9800'
                        : '#4CAF50',
                  },
                ]}
              >
                {item.diagnosis.severity.charAt(0).toUpperCase() +
                  item.diagnosis.severity.slice(1)}
              </Text>
            </View>

            <Text style={styles.treatmentText} numberOfLines={2}>
              {item.diagnosis.treatment}
            </Text>
          </View>

          <View style={styles.diagnosisFooter}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                navigation.navigate('DiagnosisResult' as any, {
                  imageUri: item.imageUrl,
                  diagnosis: item.diagnosis,
                })
              }
            >
              <Icon name="arrow-forward" size={16} color="#15803d" />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#f0fdf4', '#ffffff']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#15803d" />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f0fdf4', '#ffffff']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              textColor="#15803d"
              icon="arrow-left"
            >
              Back
            </Button>
            <Text style={styles.headerTitle}>Diagnosis History</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Stats Overview */}
          {diagnoses.length > 0 && (
            <Card style={styles.statsCard}>
              <Card.Content style={styles.statsContent}>
                <Text style={styles.statsTitle}>Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{diagnoses.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {Object.keys(diseaseStats).length}
                    </Text>
                    <Text style={styles.statLabel}>Diseases</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {Math.round(
                        (diagnoses.reduce(
                          (sum, d) => sum + d.diagnosis.confidence,
                          0,
                        ) /
                          diagnoses.length) *
                          100,
                      )}
                      %
                    </Text>
                    <Text style={styles.statLabel}>Avg</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Disease Breakdown */}
          {Object.keys(diseaseStats).length > 0 && (
            <Card style={styles.diseaseCard}>
              <Card.Content style={styles.diseaseContent}>
                <Text style={styles.diseaseTitle}>Disease Breakdown</Text>
                {Object.entries(diseaseStats).map(([disease, stats]) => (
                  <TouchableOpacity
                    key={disease}
                    style={[
                      styles.diseaseItem,
                      selectedDisease === disease && styles.diseaseItemSelected,
                    ]}
                    onPress={() =>
                      setSelectedDisease(
                        selectedDisease === disease ? null : disease,
                      )
                    }
                  >
                    <View style={styles.diseaseItemLeft}>
                      <Text style={styles.diseaseItemName}>{disease}</Text>
                      <Text style={styles.diseaseItemCount}>
                        {stats.count} occurrence(s)
                      </Text>
                    </View>
                    <Text style={styles.diseaseItemConfidence}>
                      {Math.round(stats.avgConfidence * 100)}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Diagnoses List */}
          <Text style={styles.listTitle}>All Diagnoses</Text>
          {diagnoses.length > 0 ? (
            <FlatList
              data={diagnoses}
              renderItem={renderDiagnosisItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="history" size={48} color="#d1d5db" />
              <Text style={styles.emptyStateText}>
                No diagnosis history yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Start diagnosing plants to build your history
              </Text>
            </View>
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  statsContent: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15803d',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  diseaseCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  diseaseContent: {
    padding: 20,
  },
  diseaseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  diseaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  diseaseItemSelected: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#15803d',
  },
  diseaseItemLeft: {
    flex: 1,
  },
  diseaseItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  diseaseItemCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  diseaseItemConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  diagnosisCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  diagnosisContent: {
    padding: 16,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  diagnosisDateTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  confidenceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  diagnosisBody: {
    marginBottom: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  treatmentText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  diagnosisFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
});

export default DiagnosisHistoryScreen;
