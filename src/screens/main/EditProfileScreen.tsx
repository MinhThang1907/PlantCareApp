'use client';

import type React from 'react';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Card, Avatar } from 'react-native-paper';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import FirebaseService from '../../services/FirebaseService';
import CloudinaryService from '../../services/CloudinaryService';
import auth from '@react-native-firebase/auth';

type EditProfileScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

type UpdateProfilePayload = {
  displayName: string;
  photoURL?: string;
};

const EditProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null); // local file uri (to upload)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null); // image shown in UI
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<EditProfileScreenNavigationProp>();

  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
    }, [user]),
  );

  const loadUserInfo = async () => {
    if (!user) return;

    try {
      const profile = await FirebaseService.getUserProfile(user.uid);
      setAvatarUri(profile.photoURL);
      setPreviewPhoto(profile.photoURL);
      setDisplayName(profile.displayName);
    } catch (error) {
      console.error('Load user info error:', error);
    }
  };

  const pickAvatar = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      response => {
        // handle cancel or error
        if (response.didCancel) return;
        if (response.errorCode) {
          console.error('ImagePicker error:', response.errorMessage);
          Alert.alert('Error', 'Failed to pick image');
          return;
        }
        const asset: Asset | undefined = response.assets && response.assets[0];
        if (asset && asset.uri) {
          // set local uri for upload and preview immediately
          setAvatarUri(asset.uri);
          setPreviewPhoto(asset.uri);
        }
      },
    );
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setLoading(true);
    try {
      let photoURL: string | undefined;

      // Upload avatar if changed (avatarUri is local uri)
      if (avatarUri) {
        // CloudinaryService.uploadImage should return the hosted URL string
        photoURL = await CloudinaryService.uploadImage(avatarUri);
      }

      // Build data without undefined fields
      const updateData: UpdateProfilePayload = {
        displayName: displayName.trim(),
      };

      if (photoURL) updateData.photoURL = photoURL;
      if (user?.uid) {
        // Update Firestore / user profile in your service
        await FirebaseService.updateUserProfile(user.uid, updateData);

        // Also try to update Firebase Auth's profile so auth().currentUser.photoURL / displayName reflect change
        // (If your FirebaseService already updates Auth, this is optional but harmless)
        const currentUser = auth().currentUser;
        if (currentUser) {
          const authProfileUpdate: { displayName?: string; photoURL?: string } =
            {};
          authProfileUpdate.displayName = displayName.trim();
          if (photoURL) authProfileUpdate.photoURL = photoURL;
          // updateProfile on auth user
          // use optional chaining to avoid throwing when fields missing
          await currentUser.updateProfile(authProfileUpdate);
          // force reload currentUser so fields reflect new values
          await currentUser.reload();
        }
      }

      // Update preview to the final hosted photo if available
      if (photoURL) {
        setPreviewPhoto(photoURL);
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Update profile error:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const avatarSource = previewPhoto ? { uri: previewPhoto } : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f0fdf4', '#ffffff']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            textColor="#6b7280"
            icon="close"
          >
            Cancel
          </Button>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading || !displayName.trim()}
            buttonColor="#15803d"
            style={styles.saveButton}
          >
            Save
          </Button>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <Card style={styles.avatarCard}>
            <Card.Content style={styles.avatarContent}>
              <View style={styles.avatarSection}>
                {avatarSource ? (
                  // If we have an image URI (preview), show Avatar.Image
                  <Avatar.Image
                    size={100}
                    source={avatarSource}
                    style={styles.avatarImage}
                  />
                ) : (
                  // otherwise show text avatar using initial
                  <Avatar.Text
                    size={100}
                    label={(displayName || 'U').charAt(0).toUpperCase()}
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                  />
                )}
                <TouchableOpacity
                  style={styles.avatarEditButton}
                  onPress={pickAvatar}
                  testID="pick-avatar"
                >
                  <Icon name="camera-alt" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.avatarText}>Tap to change profile photo</Text>
            </Card.Content>
          </Card>

          {/* Profile Form */}
          <Card style={styles.formCard}>
            <Card.Content style={styles.formContent}>
              <Text style={styles.formTitle}>Personal Information</Text>

              <TextInput
                label="Display Name *"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#15803d',
                    outline: '#e5e7eb',
                  },
                }}
                maxLength={50}
              />

              <TextInput
                label="Email"
                value={email}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                theme={{
                  colors: {
                    primary: '#15803d',
                    outline: '#e5e7eb',
                  },
                }}
                disabled
                right={<TextInput.Icon icon="lock" />}
              />
            </Card.Content>
          </Card>

          {/* Privacy Settings */}
          <Card style={styles.privacyCard}>
            <Card.Content style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>Privacy Settings</Text>
              <Text style={styles.privacyText}>
                Your email address is private and will not be shared with other
                users. Your display name and bio will be visible to the
                community.
              </Text>
            </Card.Content>
          </Card>

          {/* Danger Zone */}
          <Card style={styles.dangerCard}>
            <Card.Content style={styles.dangerContent}>
              <Text style={styles.dangerTitle}>Danger Zone</Text>
              <Button
                mode="outlined"
                onPress={() =>
                  Alert.alert(
                    'Delete Account',
                    'Are you sure you want to delete your account? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {},
                      },
                    ],
                  )
                }
                style={styles.deleteButton}
                textColor="#F44336"
                icon="delete"
              >
                Delete Account
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  saveButton: { borderRadius: 20 },
  scrollView: { flex: 1, padding: 16 },
  avatarCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContent: { padding: 32, alignItems: 'center' },
  avatarSection: { position: 'relative', marginBottom: 16 },
  avatar: { backgroundColor: '#15803d' },
  avatarImage: { borderRadius: 50 },
  avatarLabel: { color: '#ffffff', fontSize: 40, fontWeight: '600' },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  formCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formContent: { padding: 20 },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  input: { marginBottom: 16, backgroundColor: '#f9fafb' },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: -12,
    marginBottom: 16,
  },
  privacyCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  privacyContent: { padding: 20 },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  privacyText: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  dangerCard: {
    marginBottom: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerContent: { padding: 20 },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 12,
  },
  deleteButton: { borderColor: '#F44336', borderRadius: 8 },
});

export default EditProfileScreen;
