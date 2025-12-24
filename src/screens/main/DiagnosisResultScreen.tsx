'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Chip, ProgressBar } from 'react-native-paper';
import { OptimizedImage } from '../../components/OptimizedImage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import FirebaseService from '../../services/FirebaseService';
import DiseaseDetectionService from '../../services/DiseaseDetectionService';
import CloudinaryService from '../../services/CloudinaryService';

type DiagnosisResultScreenRouteProp = RouteProp<
  RootStackParamList,
  'DiagnosisResult'
>;
type DiagnosisResultScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DiagnosisResult'
>;

const { width: screenWidth } = Dimensions.get('window');

interface NormalizedDiseasePrediction {
  plant?: string;
  disease: string;
  confidence: number;
  treatment: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'Unknown';
  recommendations?: string[];
}

const DiagnosisResultScreen: React.FC = () => {
  const [diseasePrediction, setDiseasePrediction] =
    useState<NormalizedDiseasePrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const route = useRoute<DiagnosisResultScreenRouteProp>();
  const navigation = useNavigation<DiagnosisResultScreenNavigationProp>();
  const { user } = useAuth();

  const { imageUri } = route.params;

  const normalizeDiseasePrediction = (
    data: any,
  ): NormalizedDiseasePrediction => {
    console.log('Diagnosis data received:', data);

    if (!data) {
      console.log('Data is null or undefined, returning empty prediction');
      return {
        plant: 'Unknown',
        disease: 'Unknown',
        confidence: 0,
        treatment: 'Unable to determine treatment',
        description: 'Could not analyze the image properly',
        severity: 'low',
      };
    }

    // If data comes from API (has nested structure)
    if (data.disease_prediction && data.plant_prediction.plant) {
      console.log('Data has nested structure (from API)');
      return {
        plant: data.plant_prediction.plant,
        ...data.disease_prediction,
      };
    }

    // If data comes from Firebase (already flat)
    console.log('Data is flat structure (from Firebase)');
    return data;
  };

  useEffect(() => {
    if (route.params?.diagnosis) {
      const normalized = normalizeDiseasePrediction(route.params.diagnosis);
      setDiseasePrediction(normalized);
      setLoading(false);
    } else {
      performDiagnosis();
    }
  }, [route.params]);

  const performDiagnosis = async () => {
    try {
      setLoading(true);
      const result = await DiseaseDetectionService.detectDisease(imageUri);
      console.log(result);
      const normalized = normalizeDiseasePrediction(result);
      setDiseasePrediction(normalized);
    } catch (error) {
      console.error('Diagnosis error:', error);
      Alert.alert(
        'Diagnosis Error',
        'Failed to analyze the image. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const saveDiagnosis = async () => {
    if (!diseasePrediction || !user) return;

    setSaving(true);
    try {
      // Upload ảnh lên Cloudinary
      const imageUrl = await CloudinaryService.uploadImage(imageUri);

      // Lưu Firestore
      await FirebaseService.saveDiagnosis({
        userId: user.uid,
        imageUrl,
        diagnosis: {
          plant: diseasePrediction.plant,
          disease: diseasePrediction.disease,
          confidence: diseasePrediction.confidence,
          treatment: diseasePrediction.treatment,
          description: diseasePrediction.description,
          severity: diseasePrediction.severity ?? 'Unknown',
        },
      });

      Alert.alert('Success', 'Diagnosis saved to your history!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Error', 'Failed to save diagnosis. Please try again.');
    } finally {
      setSaving(false);
    }
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'check-circle';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'help';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f0fdf4', '#ffffff']}
          style={styles.loadingContainer}
        >
          <Card style={styles.loadingCard}>
            <Card.Content style={styles.loadingContent}>
              <Icon
                name="psychology"
                size={60}
                color="#15803d"
                style={styles.loadingIcon}
              />
              <Text style={styles.loadingTitle}>Analyzing Your Plant</Text>
              <Text style={styles.loadingText}>
                Our AI is examining the image to identify potential diseases...
              </Text>
              <ProgressBar
                indeterminate
                color="#15803d"
                style={styles.progressBar}
              />
            </Card.Content>
          </Card>
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
              style={styles.backButton}
              icon="arrow-left"
            >
              Back
            </Button>
            <Text style={styles.headerTitle}>Diagnosis Result</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Image Display */}
          <Card style={styles.imageCard}>
            <OptimizedImage
              source={{ uri: imageUri }}
              style={styles.plantImage}
              resizeMode="cover"
            />
          </Card>

          {diseasePrediction && (
            <>
              {/* Main Diagnosis Result */}
              <Card style={styles.resultCard}>
                <Card.Content style={styles.resultContent}>
                  <View style={styles.diseaseHeader}>
                    <View style={styles.diseaseInfo}>
                      <Text style={styles.plantName}>
                        {diseasePrediction.plant ?? 'Unknown'}
                      </Text>
                      <Text style={styles.diseaseName}>
                        {diseasePrediction.disease}
                      </Text>
                      <View style={styles.confidenceContainer}>
                        <Text style={styles.confidenceLabel}>Confidence: </Text>
                        <Text style={styles.confidenceValue}>
                          {Math.round(diseasePrediction.confidence * 100)}%
                        </Text>
                      </View>
                    </View>
                    <Chip
                      icon={() => (
                        <Icon
                          name={getSeverityIcon(diseasePrediction.severity)}
                          size={16}
                          color="#ffffff"
                        />
                      )}
                      style={[
                        styles.severityChip,
                        {
                          backgroundColor: getSeverityColor(
                            diseasePrediction.severity,
                          ),
                        },
                      ]}
                      textStyle={styles.severityText}
                    >
                      {diseasePrediction.severity.toUpperCase()}
                    </Chip>
                  </View>

                  <ProgressBar
                    progress={diseasePrediction.confidence}
                    color="#15803d"
                    style={styles.confidenceBar}
                  />

                  <Text style={styles.description}>
                    {diseasePrediction.description}
                  </Text>
                </Card.Content>
              </Card>

              {/* Treatment Information */}
              <Card style={styles.treatmentCard}>
                <Card.Content style={styles.treatmentContent}>
                  <View style={styles.sectionHeader}>
                    <Icon name="healing" size={24} color="#15803d" />
                    <Text style={styles.sectionTitle}>Treatment</Text>
                  </View>
                  <Text style={styles.treatmentText}>
                    {diseasePrediction.treatment}
                  </Text>
                </Card.Content>
              </Card>

              {/* Recommendations */}
              {diseasePrediction.recommendations &&
                diseasePrediction.recommendations.length > 0 && (
                  <Card style={styles.recommendationsCard}>
                    <Card.Content style={styles.recommendationsContent}>
                      <View style={styles.sectionHeader}>
                        <Icon name="lightbulb" size={24} color="#84cc16" />
                        <Text style={styles.sectionTitle}>Recommendations</Text>
                      </View>
                      {diseasePrediction.recommendations.map(
                        (recommendation, index) => (
                          <View key={index} style={styles.recommendationItem}>
                            <Icon
                              name="check-circle"
                              size={16}
                              color="#4CAF50"
                            />
                            <Text style={styles.recommendationText}>
                              {recommendation}
                            </Text>
                          </View>
                        ),
                      )}
                    </Card.Content>
                  </Card>
                )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={saveDiagnosis}
                  loading={saving}
                  disabled={saving}
                  style={styles.saveButton}
                  buttonColor="#15803d"
                  icon="bookmark"
                >
                  Save to History
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Camera')}
                  style={styles.retakeButton}
                  textColor="#15803d"
                  icon="camera"
                >
                  Take Another Photo
                </Button>
              </View>
            </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 60,
  },
  imageCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  plantImage: {
    width: '100%',
    height: 250,
  },
  resultCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultContent: {
    padding: 20,
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  diseaseInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a3e635',
    marginBottom: 8,
  },
  diseaseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },
  severityChip: {
    marginLeft: 12,
  },
  severityText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 16,
    backgroundColor: '#e5e7eb',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  treatmentCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  treatmentContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  treatmentText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  recommendationsCard: {
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendationsContent: {
    padding: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  retakeButton: {
    borderRadius: 8,
    paddingVertical: 4,
    borderColor: '#15803d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContent: {
    padding: 32,
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
});

export default DiagnosisResultScreen;
