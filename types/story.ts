export interface Story {
  id: string;
  marketId: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  createdAt: string;
  expiresAt: string;
  views: StoryView[];
  isActive: boolean;
}

export interface StoryView {
  userId: string;
  userName: string;
  viewedAt: string;
}

export type StoryMediaType = 'image' | 'video' | 'text';
