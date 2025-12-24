'use client';

import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  getCameraDevice,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { Button, Card } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import DiseaseDetectionService from '../../services/DiseaseDetectionService';
import ImageEditor from '@react-native-community/image-editor';

interface NormalizedDiseasePrediction {
  plant?: string;
  disease: string;
  confidence: number;
  treatment: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'Unknown';
}

type CameraScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Camera'
>;

const mapBoxToImage = (
  photoWidth,
  photoHeight,
  previewWidth,
  previewHeight,
  box,
) => {
  const scaleX = photoWidth / previewWidth;
  const scaleY = photoHeight / previewHeight;

  return {
    offset: {
      x: box.x * scaleX,
      y: box.y * scaleY,
    },
    size: {
      width: box.width * scaleX,
      height: box.height * scaleY,
    },
  };
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const FRAME_WIDTH = screenWidth * 0.7;
const FRAME_HEIGHT = screenHeight * 0.4;

const CameraScreen: React.FC = () => {
  const [isActive, setIsActive] = useState(true);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>(
    'back',
  );
  const [isCapturing, setIsCapturing] = useState(false);

  const [livePrediction, setLivePrediction] =
    useState<NormalizedDiseasePrediction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = getCameraDevice(devices, cameraPosition);

  const navigation = useNavigation<CameraScreenNavigationProp>();

  // ✅ Permission hook theo chuẩn VisionCamera mới
  const {
    hasPermission,
    requestPermission,
    status: permissionStatus,
  } = useCameraPermission();

  // Gọi xin permission ngay khi vào screen
  useEffect(() => {
    if (!hasPermission && permissionStatus === 'not-determined') {
      requestPermission();
    }
  }, [hasPermission, permissionStatus, requestPermission]);

  // Xử lý active camera theo focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsActive(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsActive(false);
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation]);

  useEffect(() => {
    // Bắt đầu xử lý liên tục
    intervalRef.current = setInterval(() => {
      runLiveScan();
    }, 2000);

    // Cleanup khi rời màn hình
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!camera.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await camera.current.takePhoto({
        flash: flash,
        qualityPrioritization: 'quality',
        enableAutoRedEyeReduction: true,
      });

      // 🟢 Convert photo.path → file://
      const rawPath = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      // 🟢 FRAME BOX: vị trí 4 góc xanh
      const frameBox = {
        x: (screenWidth - FRAME_WIDTH) / 2,
        y: (screenHeight - FRAME_HEIGHT) / 2,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
      };

      // 🟢 Kích thước Preview = kích thước Camera view
      const previewSize = {
        width: screenWidth,
        height: screenHeight,
      };

      // 🟢 Tính cropData theo tỷ lệ ảnh thật ↔ preview
      const cropData = mapBoxToImage(
        photo.width,
        photo.height,
        previewSize.width,
        previewSize.height,
        frameBox,
      );

      // 🟢 Tiến hành crop
      const croppedUri = await ImageEditor.cropImage(rawPath, {
        offset: cropData.offset,
        size: cropData.size,
      });

      navigation.navigate('DiagnosisResult', {
        imageUri: croppedUri.uri,
        diagnosis: null,
      });
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Capture Error', 'Failed to take photo');
    } finally {
      setIsCapturing(false);
    }
  }, [flash, navigation, isCapturing]);

  const pickImageFromLibrary = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      response => {
        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          navigation.navigate('DiagnosisResult', {
            imageUri: asset.uri!,
            diagnosis: null,
          });
        }
      },
    );
  }, [navigation]);

  const runLiveScan = async () => {
    if (!camera.current || isProcessing) return;

    try {
      setIsProcessing(true);

      // 1️⃣ Chụp ảnh không hiệu ứng
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
        skipMetadata: true,
      });

      // 🟢 Convert photo.path → file://
      const rawPath = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      // 🟢 FRAME BOX: vị trí 4 góc xanh
      const frameBox = {
        x: (screenWidth - FRAME_WIDTH) / 2,
        y: (screenHeight - FRAME_HEIGHT) / 2,
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
      };

      // 🟢 Kích thước Preview = kích thước Camera view
      const previewSize = {
        width: screenWidth,
        height: screenHeight,
      };

      // 🟢 Tính cropData theo tỷ lệ ảnh thật ↔ preview
      const cropData = mapBoxToImage(
        photo.width,
        photo.height,
        previewSize.width,
        previewSize.height,
        frameBox,
      );

      // 🟢 Tiến hành crop
      const croppedUri = await ImageEditor.cropImage(rawPath, {
        offset: cropData.offset,
        size: cropData.size,
      });

      // 2️⃣ Gửi ảnh lên API
      const result = await DiseaseDetectionService.detectDisease(
        croppedUri.uri,
        { lite: true },
      );

      const plantName = result?.plant_prediction?.plant || null;
      const diseaseName = result?.disease_prediction?.disease || null;
      const diseaseConf = result?.disease_prediction?.confidence ?? 0;
      const diseaseSeverity = result?.disease_prediction?.severity ?? null;

      setLivePrediction({
        plant: plantName ?? 'Unknown',
        disease: diseaseName ?? 'Unknown',
        confidence: diseaseConf,
        treatment: '', // keep empty in live mode
        description: '', // keep empty in live mode
        severity: diseaseSeverity ?? 'Unknown',
      } as NormalizedDiseasePrediction);
    } catch (error: any) {
      console.log('Live scan error:', error);
      // handle rate-limit hint
      if (error?.retryAfter) {
        // optionally pause live scanning for retryAfter
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          setTimeout(() => {
            intervalRef.current = setInterval(() => runLiveScan(), 2000);
          }, error.retryAfter * 1000);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFlash = useCallback(() => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  }, []);

  const toggleCameraPosition = useCallback(() => {
    setCameraPosition(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  // ===============================
  //  UI WHEN NO PERMISSION
  // ===============================

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f0fdf4', '#ffffff']}
          style={styles.permissionContainer}
        >
          <Card style={styles.permissionCard}>
            <Card.Content style={styles.permissionContent}>
              <Icon
                name="camera-alt"
                size={80}
                color="#15803d"
                style={styles.permissionIcon}
              />
              <Text style={styles.permissionTitle}>Camera Access Required</Text>
              <Text style={styles.permissionText}>
                PlantCare needs camera access to help you identify plant
                diseases. Please grant camera permission to continue.
              </Text>
              <Button
                mode="contained"
                onPress={requestPermission}
                style={styles.permissionButton}
                buttonColor="#15803d"
              >
                Grant Permission
              </Button>
            </Card.Content>
          </Card>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ===============================
  //  LOADING DEVICE
  // ===============================

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===============================
  //  MAIN CAMERA UI
  // ===============================

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isActive && hasPermission}
        photo={true}
        enableZoomGesture={true}
      />

      {/* Camera Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Plant Diagnosis</Text>

          <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
            <Icon
              name={flash === 'on' ? 'flash-on' : 'flash-off'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </SafeAreaView>

        {livePrediction && (
          <View
            style={{
              marginHorizontal: 20,
              padding: 16,
              borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          >
            <Text style={{ color: '#a3e635', marginTop: 4, fontSize: 14 }}>
              {livePrediction.plant ?? 'Plant: Unknown'}
            </Text>

            <Text
              style={{
                color: '#fff',
                fontSize: 20,
                fontWeight: 'bold',
                marginTop: 6,
              }}
            >
              {livePrediction.disease}
            </Text>

            <Text style={{ color: '#a3e635', marginTop: 4 }}>
              Confidence: {Math.round(livePrediction.confidence * 100)}%
            </Text>

            <Text style={{ color: '#e5e7eb', marginTop: 4 }}>
              Severity: {livePrediction.severity ?? 'unknown'}
            </Text>

            {livePrediction.description ? (
              <Text style={{ color: '#e5e7eb', marginTop: 4 }}>
                {livePrediction.description}
              </Text>
            ) : null}

            {livePrediction.treatment ? (
              <Text style={{ color: '#86efac', marginTop: 4 }}>
                Treatment: {livePrediction.treatment}
              </Text>
            ) : null}
          </View>
        )}

        {/* Camera Frame Guide */}
        <View style={styles.frameGuide}>
          <View style={[styles.frameCorner, styles.frameCornerTopLeft]} />
          <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
          <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={pickImageFromLibrary}
          >
            <Icon name="photo-library" size={28} color="#ffffff" />
            <Text style={styles.controlButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              isCapturing && styles.captureButtonDisabled,
            ]}
            onPress={capturePhoto}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner}>
              {isCapturing ? (
                <Icon name="hourglass-empty" size={32} color="#15803d" />
              ) : (
                <Icon name="camera" size={32} color="#15803d" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraPosition}
          >
            <Icon name="flip-camera-android" size={28} color="#ffffff" />
            <Text style={styles.controlButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // (GIỮ NGUYÊN TOÀN BỘ STYLE — KHÔNG THAY ĐỔI)
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  instructionsContainer: { paddingHorizontal: 20, marginTop: 20 },
  instructionsCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  instructionsContent: { paddingVertical: 12, paddingHorizontal: 16 },
  instructionsText: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 20,
  },
  frameGuide: {
    position: 'absolute',
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    top: (screenHeight - FRAME_HEIGHT) / 2,
    left: (screenWidth - FRAME_WIDTH) / 2,
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#84cc16',
  },
  frameCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  frameCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  frameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlButton: { alignItems: 'center', width: 60 },
  controlButtonText: { fontSize: 12, color: '#fff', marginTop: 4 },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: { opacity: 0.6 },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  permissionCard: { backgroundColor: '#fff', borderRadius: 16 },
  permissionContent: { padding: 32, alignItems: 'center' },
  permissionIcon: { marginBottom: 24 },
  permissionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: { borderRadius: 8, paddingHorizontal: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#15803d', fontWeight: '500' },
});

export default CameraScreen;
