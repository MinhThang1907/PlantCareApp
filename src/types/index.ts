export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  imageUrl: string;
  commonDiseases: string[];
}

export interface Disease {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  treatment: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DiagnosisHistory {
  id: string;
  userId: string;
  imageUrl: string;
  diagnosis: {
    plant?: string;
    disease: string;
    confidence: number;
    treatment: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'Unknown';
  };
  timestamp: Date;
}

//
// --------------------
// NEW TYPES FOR BACKEND
// --------------------
//

export interface PlantPrediction {
  plant: string;
  confidence: number;
  classes: { label: string; prob: number }[];
}

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  description: string;
  treatment: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface DiagnosisResult {
  plant_prediction: PlantPrediction;
  disease_prediction: DiseasePrediction;
  uploaded_image_url?: string | null;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  timestamp: Date;
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  content: string;
  timestamp: Date;
  likes?: number;
}

export interface CommentWithReplies extends Comment {
  replies: CommentReply[];
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  title: string;
  content: string;
  imageUrls?: string[]; // Changed from single image to array
  timestamp: Date;
  likes: number;
  comments: number;
}
