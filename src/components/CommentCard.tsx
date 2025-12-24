'use client';

import type React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Avatar, Divider, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import FirebaseService from '../services/FirebaseService';
import type { Comment, CommentReply } from '../types/index';

interface CommentCardProps {
  comment: Comment;
  replies: CommentReply[];
  onReplyAdded?: () => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  replies,
  onReplyAdded,
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const { user } = useAuth();

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

  const handleAddReply = async () => {
    if (!replyText.trim() || !user) return;

    setSubmittingReply(true);
    try {
      await FirebaseService.addCommentReply({
        commentId: comment.id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        content: replyText.trim(),
      });

      setReplyText('');
      setShowReplyInput(false);
      onReplyAdded?.();
    } catch (error) {
      console.error('Add reply error:', error);
      Alert.alert('Error', 'Failed to add reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Comment */}
      <View style={styles.commentItem}>
        <Avatar.Text
          size={32}
          label={comment.userName.charAt(0).toUpperCase()}
          style={styles.commentAvatar}
          labelStyle={styles.commentAvatarLabel}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUserName}>{comment.userName}</Text>
            <Text style={styles.commentTime}>
              {formatTimeAgo(comment.timestamp)}
            </Text>
          </View>
          <Text style={styles.commentText}>{comment.content}</Text>

          {/* Reply Button */}
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setShowReplyInput(!showReplyInput)}
          >
            <Icon name="reply" size={14} color="#15803d" />
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reply Input */}
      {showReplyInput && (
        <View style={styles.replyInputContainer}>
          <Avatar.Text
            size={24}
            label={(user?.displayName || 'U').charAt(0).toUpperCase()}
            style={styles.inputAvatar}
            labelStyle={styles.inputAvatarLabel}
          />
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              value={replyText}
              onChangeText={setReplyText}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
            />
            <View style={styles.replyActions}>
              <Button
                mode="text"
                onPress={() => setShowReplyInput(false)}
                textColor="#6b7280"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddReply}
                loading={submittingReply}
                disabled={!replyText.trim() || submittingReply}
                buttonColor="#15803d"
              >
                Reply
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {replies.map(reply => (
            <View key={reply.id} style={styles.replyItem}>
              <View style={styles.replyLine} />
              <Avatar.Text
                size={24}
                label={reply.userName.charAt(0).toUpperCase()}
                style={styles.replyAvatar}
                labelStyle={styles.replyAvatarLabel}
              />
              <View style={styles.replyContent}>
                <View style={styles.replyHeader}>
                  <Text style={styles.replyUserName}>{reply.userName}</Text>
                  <Text style={styles.replyTime}>
                    {formatTimeAgo(reply.timestamp)}
                  </Text>
                </View>
                <Text style={styles.replyText}>{reply.content}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Divider style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    backgroundColor: '#15803d',
    marginRight: 12,
  },
  commentAvatarLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyButtonText: {
    fontSize: 12,
    color: '#15803d',
    marginLeft: 4,
    fontWeight: '500',
  },
  replyInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 40,
  },
  inputAvatar: {
    backgroundColor: '#84cc16',
    marginRight: 8,
  },
  inputAvatarLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  inputWrapper: {
    flex: 1,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 8,
    maxHeight: 100,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  repliesContainer: {
    marginLeft: 40,
    marginBottom: 12,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  replyLine: {
    position: 'absolute',
    left: -20,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e5e7eb',
  },
  replyAvatar: {
    backgroundColor: '#84cc16',
    marginRight: 8,
  },
  replyAvatarLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyUserName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    marginRight: 8,
  },
  replyTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  replyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  divider: {
    backgroundColor: '#e5e7eb',
    height: 1,
    marginTop: 8,
  },
});

export default CommentCard;
