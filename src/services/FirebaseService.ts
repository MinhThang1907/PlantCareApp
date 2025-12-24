import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import type {
  Post,
  Comment,
  CommentReply,
  PostLike,
  DiagnosisHistory,
} from '../types/index';

class FirebaseService {
  // Posts Collection
  async createPost(
    post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>,
  ) {
    try {
      const docRef = await firestore()
        .collection('posts')
        .add({
          ...post,
          timestamp: firestore.FieldValue.serverTimestamp(),
          likes: 0,
          comments: 0,
        });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  async getPosts(limit = 20) {
    try {
      const snapshot = await firestore()
        .collection('posts')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as Post[];
    } catch (error) {
      throw error;
    }
  }

  async getPost(postId: string) {
    try {
      const snapshot = await firestore().collection('posts').doc(postId).get();

      if (!snapshot.exists) {
        throw new Error('Post not found');
      }

      return {
        id: snapshot.id,
        ...snapshot.data(),
        timestamp: snapshot.data()?.timestamp?.toDate(),
      } as Post;
    } catch (error) {
      throw error;
    }
  }

  async likePost(postId: string, userId: string) {
    try {
      const likeRef = firestore()
        .collection('likes')
        .doc(`${postId}_${userId}`);

      const exists = await likeRef.get();

      if (exists.exists) {
        // Unlike
        await likeRef.delete();
        await firestore()
          .collection('posts')
          .doc(postId)
          .update({
            likes: firestore.FieldValue.increment(-1),
          });
        return false;
      } else {
        // Like
        await likeRef.set({
          postId,
          userId,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
        await firestore()
          .collection('posts')
          .doc(postId)
          .update({
            likes: firestore.FieldValue.increment(1),
          });
        return true;
      }
    } catch (error) {
      throw error;
    }
  }

  async isPostLiked(postId: string, userId: string) {
    try {
      const snapshot = await firestore()
        .collection('likes')
        .doc(`${postId}_${userId}`)
        .get();
      return snapshot.exists;
    } catch (error) {
      throw error;
    }
  }

  async getUserPostsCount(userId: string): Promise<number> {
    try {
      const snapshot = await firestore()
        .collection('posts')
        .where('userId', '==', userId)
        .get();
      return snapshot.docs.length;
    } catch (error) {
      throw error;
    }
  }

  // Comments Collection
  async addComment(comment: Omit<Comment, 'id' | 'timestamp' | 'likes'>) {
    try {
      const docRef = await firestore()
        .collection('comments')
        .add({
          ...comment,
          timestamp: firestore.FieldValue.serverTimestamp(),
          likes: 0,
        });

      // Update comment count
      await firestore()
        .collection('posts')
        .doc(comment.postId)
        .update({
          comments: firestore.FieldValue.increment(1),
        });

      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  async getComments(postId: string) {
    try {
      const snapshot = await firestore()
        .collection('comments')
        .where('postId', '==', postId)
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as Comment[];
    } catch (error) {
      throw error;
    }
  }

  async addCommentReply(reply: Omit<CommentReply, 'id' | 'timestamp'>) {
    try {
      const docRef = await firestore()
        .collection('replies')
        .add({
          ...reply,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  async getCommentReplies(commentId: string) {
    try {
      const snapshot = await firestore()
        .collection('replies')
        .where('commentId', '==', commentId)
        .orderBy('timestamp', 'asc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as CommentReply[];
    } catch (error) {
      throw error;
    }
  }

  // Diagnosis History
  async saveDiagnosis(diagnosis: Omit<DiagnosisHistory, 'id' | 'timestamp'>) {
    try {
      const docRef = await firestore()
        .collection('diagnoses')
        .add({
          ...diagnosis,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  async getUserDiagnoses(userId: string): Promise<DiagnosisHistory[]> {
    try {
      const snapshot = await firestore()
        .collection('diagnoses')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      })) as DiagnosisHistory[];
    } catch (error) {
      throw error;
    }
  }

  // Storage
  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      const reference = storage().ref(path);
      await reference.putFile(uri);
      const downloadURL = await reference.getDownloadURL();
      return downloadURL;
    } catch (error) {
      throw error;
    }
  }

  // User Profile Collection
  async updateUserProfile(
    userId: string,
    profileData: { displayName: string; photoURL?: string },
  ) {
    try {
      await firestore()
        .collection('userProfiles')
        .doc(userId)
        .set(
          {
            ...profileData,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    } catch (error) {
      throw error;
    }
  }

  async getUserProfile(userId: string) {
    try {
      const snapshot = await firestore()
        .collection('userProfiles')
        .doc(userId)
        .get();

      if (!snapshot.exists) {
        return null;
      }

      return {
        ...snapshot.data(),
        updatedAt: snapshot.data()?.updatedAt?.toDate(),
      };
    } catch (error) {
      throw error;
    }
  }

  subscribeToUserProfile(userId: string, callback: (profile: any) => void) {
    return firestore()
      .collection('userProfiles')
      .doc(userId)
      .onSnapshot(snapshot => {
        if (snapshot.exists) {
          callback({
            ...snapshot.data(),
            updatedAt: snapshot.data()?.updatedAt?.toDate(),
          });
        }
      });
  }

}

export default new FirebaseService();
export type { Post, Comment, CommentReply, PostLike, DiagnosisHistory };
