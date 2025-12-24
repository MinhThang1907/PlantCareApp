'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Card, Avatar, Divider } from 'react-native-paper';
import { OptimizedImage } from '../../components/OptimizedImage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import FirebaseService from '../../services/FirebaseService';
import CommentCard from '../../components/CommentCard';
import type { Post, Comment, CommentReply } from '../../types/index';

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;
type PostDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PostDetail'
>;

interface CommentWithReplies extends Comment {
  replies: CommentReply[];
}

const PostDetailScreen: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  const route = useRoute<PostDetailScreenRouteProp>();
  const navigation = useNavigation<PostDetailScreenNavigationProp>();
  const { user } = useAuth();

  const { postId } = route.params;

  useEffect(() => {
    loadPostAndComments();
  }, [postId]);

  useEffect(() => {
    if (user && post) {
      checkIfLiked();
    }
  }, [post, user]);

  const loadPostAndComments = async () => {
    try {
      setLoading(true);
      const foundPost = await FirebaseService.getPost(postId);

      if (foundPost) {
        setPost(foundPost);
        const postComments = await FirebaseService.getComments(postId);

        const commentsWithReplies = await Promise.all(
          postComments.map(async comment => ({
            ...comment,
            replies: await FirebaseService.getCommentReplies(comment.id),
          })),
        );

        setComments(commentsWithReplies);
      }
    } catch (error) {
      console.error('Load post error:', error);
      Alert.alert('Error', 'Failed to load post details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    try {
      const isLiked = await FirebaseService.isPostLiked(post!.id, user!.uid);
      setLiked(isLiked);
    } catch (error) {
      console.error('Check like error:', error);
    }
  };

  const handleLike = async () => {
    if (!user || !post) return;

    setLoadingLike(true);
    try {
      const newLiked = await FirebaseService.likePost(post.id, user.uid);
      setLiked(newLiked);
      // Update local state
      setPost({
        ...post,
        likes: newLiked ? post.likes + 1 : post.likes - 1,
      });
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert('Error', 'Failed to update like status');
    } finally {
      setLoadingLike(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !post) return;

    setSubmitting(true);
    try {
      await FirebaseService.addComment({
        postId: post.id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: user.photoURL,
        content: newComment.trim(),
      });

      setNewComment('');
      await loadPostAndComments();
    } catch (error) {
      console.error('Add comment error:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyAdded = async () => {
    await loadPostAndComments();
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#f0fdf4', '#ffffff']}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Loading post...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#f0fdf4', '#ffffff']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
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
            <Text style={styles.headerTitle}>Post Details</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Post Content */}
            <Card style={styles.postCard}>
              <View style={styles.postHeader}>
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

              <View style={styles.postContent}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postDescription}>{post.content}</Text>

                {post.imageUrls && post.imageUrls.length > 0 && (
                  <View style={styles.imagesContainer}>
                    {post.imageUrls.map((imageUrl, index) => (
                      <OptimizedImage
                        key={index}
                        source={{ uri: imageUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
              </View>

              <Divider style={styles.divider} />

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.postActionButton}
                  onPress={handleLike}
                  disabled={loadingLike}
                >
                  <Icon
                    name={liked ? 'favorite' : 'favorite-border'}
                    size={24}
                    color={liked ? '#F44336' : '#6b7280'}
                  />
                  <Text
                    style={[styles.postActionText, liked && styles.likedText]}
                  >
                    {post.likes} Likes
                  </Text>
                </TouchableOpacity>

                <Divider style={styles.actionDivider} />

                <View style={styles.postActionButton}>
                  <Icon name="chat-bubble-outline" size={24} color="#6b7280" />
                  <Text style={styles.postActionText}>
                    {comments.length} Comments
                  </Text>
                </View>
              </View>
            </Card>

            {/* Comments Section */}
            <Card style={styles.commentsCard}>
              <Card.Content style={styles.commentsContent}>
                <Text style={styles.commentsTitle}>
                  Comments ({comments.length})
                </Text>

                {comments.length > 0 ? (
                  comments.map(comment => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      replies={comment.replies}
                      onReplyAdded={handleReplyAdded}
                    />
                  ))
                ) : (
                  <View style={styles.noComments}>
                    <Icon
                      name="chat-bubble-outline"
                      size={40}
                      color="#84cc16"
                    />
                    <Text style={styles.noCommentsText}>No comments yet</Text>
                    <Text style={styles.noCommentsSubtext}>
                      Be the first to share your thoughts!
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </ScrollView>

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <Avatar.Text
              size={32}
              label={(user?.displayName || 'U').charAt(0).toUpperCase()}
              style={styles.inputAvatar}
              labelStyle={styles.inputAvatarLabel}
            />
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              mode="outlined"
              style={styles.commentInput}
              theme={{
                colors: {
                  primary: '#15803d',
                  outline: '#e5e7eb',
                },
              }}
              right={
                <TextInput.Icon
                  icon="send"
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || submitting}
                  color={
                    newComment.trim() && !submitting ? '#15803d' : '#6b7280'
                  }
                />
              }
            />
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
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
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  postCard: {
    marginBottom: 16,
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
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
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 28,
  },
  postDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  imagesContainer: {
    marginTop: 8,
    gap: 8,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  divider: {
    backgroundColor: '#e5e7eb',
    height: 1,
  },
  postActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  postActionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  likedText: {
    color: '#F44336',
  },
  actionDivider: {
    backgroundColor: '#e5e7eb',
    height: 1,
    marginVertical: 8,
  },
  commentsCard: {
    marginBottom: 16,
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
  commentsContent: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 12,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputAvatar: {
    backgroundColor: '#15803d',
    marginRight: 12,
  },
  inputAvatarLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default PostDetailScreen;
