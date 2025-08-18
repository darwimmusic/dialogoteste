export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  area?: string;
  companyName?: string;
  tags?: [string, string, string];
  xp: number;
  level: number;
  title: string;
  completedCourses: string[];
  completedLessons?: string[];
  badges: Badge[];
  isAdmin: boolean;
  createdAt: any; // ou um tipo mais específico se você usar Timestamps
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Attachment {
  name: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  themeTitle: string;
  videoUrl: string;
  transcript: string;
  attachments?: Attachment[];
  summary?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  themeId: string;
  lessons: Lesson[];
  isFeatured?: boolean;
  badge?: Badge;
}

export interface Theme {
  id: string;
  title: string;
  courses: Course[];
}

// --- Tipos do Fórum (Estrutura Reddit) ---

export interface ForumComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: any; // Firestore Timestamp
  upvotes: number;
  postId: string;
  parentId?: string | null;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string; // HTML content from Tiptap
  coverImageUrl: string;
  authorId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  likes: number;
  likedBy: string[]; // Array of user UIDs
}

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string; // Conteúdo em HTML do editor de texto rico
  createdAt: any; // Firestore Timestamp
  upvotes: number;
  commentCount: number;
}
