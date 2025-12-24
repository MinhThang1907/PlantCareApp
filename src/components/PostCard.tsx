'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Card, Avatar, Menu, Divider } from 'react-native-paper';
import { OptimizedImage } from './OptimizedImage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Post } from '../services/FirebaseService';
import { useAuth } from '../contexts/AuthContext';
import FirebaseService from '../services/FirebaseService';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
}

type PostCardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  const navigation = useNavigation<PostCardNavigationProp>();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [post.id, user]);

  const checkIfLiked = async () => {
    try {
      const isLiked = await FirebaseService.isPostLiked(post.id, user!.uid);
      setLiked(isLiked);
    } catch (error) {
      console.error('Check like error:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to like posts');
      return;
    }

    setLoadingLike(true);
    try {
      const newLiked = await FirebaseService.likePost(post.id, user.uid);
      setLiked(newLiked);
      setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
      onPostUpdate?.();
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert('Error', 'Failed to update like status');
    } finally {
      setLoadingLike(false);
    }
  };

  const handleComment = () => {
    navigation.navigate('PostDetail' as any, { postId: post.id });
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleMenuAction = (action: string) => {
    setMenuVisible(false);
    switch (action) {
      case 'report':
        Alert.alert('Report', 'Report functionality coming soon!');
        break;
      case 'hide':
        Alert.alert('Hide', 'Hide functionality coming soon!');
        break;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text
            size={40}
            label={post.userName.charAt(0).toUpperCase()}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.timestamp}>
              {formatTimeAgo(post.timestamp)}
            </Text>
          </View>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.menuButton}
            >
              <Icon name="more-vert" size={24} color="#6b7280" />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            onPress={() => handleMenuAction('report')}
            title="Report"
            leadingIcon="flag"
          />
          <Menu.Item
            onPress={() => handleMenuAction('hide')}
            title="Hide"
            leadingIcon="visibility-off"
          />
        </Menu>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.description}>{post.content}</Text>

        {post.imageUrls && post.imageUrls.length > 0 && (
          <View style={styles.imageCarouselContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              style={styles.imageCarousel}
            >
              {post.imageUrls.map((imageUrl, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <OptimizedImage
                    source={{ uri: imageUrl }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                  {post.imageUrls!.length > 1 && (
                    <View style={styles.imageCounter}>
                      <Text style={styles.imageCounterText}>
                        {index + 1}/{post.imageUrls!.length}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <Divider style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          disabled={loadingLike}
        >
          <Icon
            name={liked ? 'favorite' : 'favorite-border'}
            size={20}
            color={liked ? '#F44336' : '#6b7280'}
          />
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Icon name="chat-bubble-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share" size={20} color="#6b7280" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingRight: 40
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  imageCarouselContainer: {
    marginTop: 8,
    marginHorizontal: -16,
  },
  imageCarousel: {
    flexDirection: 'row',
  },
  imageWrapper: {
    position: 'relative',
    marginHorizontal: 4,
  },
  postImage: {
    width: 250,
    height: 200,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageCounterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    backgroundColor: '#e5e7eb',
    height: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  likedText: {
    color: '#F44336',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
});

export default PostCard;
