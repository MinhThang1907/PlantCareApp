'use client';

import type React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Card, Avatar } from 'react-native-paper';
import { launchImageLibrary } from 'react-native-image-picker';
import { OptimizedImage } from '../../components/OptimizedImage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import FirebaseService from '../../services/FirebaseService';
import CloudinaryService from '../../services/CloudinaryService';

type CreatePostScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

const CreatePostScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]); // Changed to array for multiple images
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const { user } = useAuth();

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      },
      response => {
        if (response.assets && response.assets[0]) {
          setImageUris([...imageUris, response.assets[0].uri!]);
        }
      },
    );
  };

  const removeImage = (index: number) => {
    setImageUris(imageUris.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    setLoading(true);
    try {
      const imageUrls: string[] = [];

      if (imageUris.length > 0) {
        for (let i = 0; i < imageUris.length; i++) {
          const imageUrl = await CloudinaryService.uploadImage(imageUris[i]);
          imageUrls.push(imageUrl);
        }
      }

      await FirebaseService.createPost({
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL,
        title: title.trim(),
        content: content.trim(),
        imageUrls, // Pass array of images
      });

      Alert.alert('Success', 'Your post has been shared with the community!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Create Post</Text>
          <Button
            mode="contained"
            onPress={handlePost}
            loading={loading}
            disabled={loading || !title.trim() || !content.trim()}
            buttonColor="#15803d"
            style={styles.postButton}
          >
            Post
          </Button>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* User Info */}
          <Card style={styles.userCard}>
            <Card.Content style={styles.userContent}>
              <Avatar.Text
                size={40}
                label={(user?.displayName || 'U').charAt(0).toUpperCase()}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.displayName || 'Anonymous'}
                </Text>
                <Text style={styles.postingAs}>Posting to Community</Text>
              </View>
            </Card.Content>
          </Card>

          {/* Post Form */}
          <Card style={styles.formCard}>
            <Card.Content style={styles.formContent}>
              <TextInput
                label="Post Title"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.titleInput}
                theme={{
                  colors: {
                    primary: '#15803d',
                    outline: '#e5e7eb',
                  },
                }}
                maxLength={100}
              />

              <TextInput
                label="What's on your mind about plants?"
                value={content}
                onChangeText={setContent}
                mode="outlined"
                multiline
                numberOfLines={6}
                style={styles.contentInput}
                theme={{
                  colors: {
                    primary: '#15803d',
                    outline: '#e5e7eb',
                  },
                }}
                maxLength={1000}
              />

              <Text style={styles.characterCount}>{content.length}/1000</Text>

              {imageUris.length > 0 ? (
                <View style={styles.imagesContainer}>
                  <Text style={styles.imagesLabel}>
                    Selected Images ({imageUris.length})
                  </Text>
                  <FlatList
                    data={imageUris}
                    keyExtractor={(_, index) => index.toString()}
                    numColumns={2}
                    scrollEnabled={false}
                    columnWrapperStyle={styles.imageGrid}
                    renderItem={({ item, index }) => (
                      <View style={styles.imageItemWrapper}>
                        <OptimizedImage
                          source={{ uri: item }}
                          style={styles.selectedImage}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Icon name="close" size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickImage}
                >
                  <Icon name="add-photo-alternate" size={24} color="#15803d" />
                  <Text style={styles.addImageText}>Add Photos (multiple)</Text>
                </TouchableOpacity>
              )}

              {/* Add more images button when already has images */}
              {imageUris.length > 0 && (
                <TouchableOpacity
                  style={styles.addMoreButton}
                  onPress={pickImage}
                >
                  <Icon name="add" size={18} color="#15803d" />
                  <Text style={styles.addMoreText}>Add More Photos</Text>
                </TouchableOpacity>
              )}
            </Card.Content>
          </Card>

          {/* Tips Card */}
          <Card style={styles.tipsCard}>
            <Card.Content style={styles.tipsContent}>
              <View style={styles.tipsHeader}>
                <Icon name="lightbulb" size={20} color="#84cc16" />
                <Text style={styles.tipsTitle}>Community Guidelines</Text>
              </View>
              <Text style={styles.tipsText}>
                • Share your plant experiences and knowledge{'\n'}• Be
                respectful and helpful to other members
                {'\n'}• Include clear photos when asking for help{'\n'}• Avoid
                spam and promotional content
              </Text>
            </Card.Content>
          </Card>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  postButton: {
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    backgroundColor: '#15803d',
    marginRight: 12,
  },
  avatarLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  postingAs: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  formCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formContent: {
    padding: 20,
  },
  titleInput: {
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  contentInput: {
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 16,
  },
  imagesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  imagesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  imageGrid: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  imageItemWrapper: {
    flex: 1,
    marginHorizontal: 4,
    position: 'relative',
    marginBottom: 8,
  },
  selectedImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  addImageText: {
    fontSize: 16,
    color: '#15803d',
    marginLeft: 8,
    fontWeight: '500',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    marginTop: 8,
  },
  addMoreText: {
    fontSize: 14,
    color: '#15803d',
    marginLeft: 6,
    fontWeight: '500',
  },
  tipsCard: {
    marginBottom: 32,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsContent: {
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default CreatePostScreen;
