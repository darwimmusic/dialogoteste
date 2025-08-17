
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface Lesson {
  id: string;
  title: string;
  themeTitle: string;
  videoUrl: string;
  transcript: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  lessons: Lesson[];
}

export interface Theme {
  id: string;
  title: string;
  courses: Course[];
}
