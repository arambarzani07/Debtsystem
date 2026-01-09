import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Story, StoryView } from '@/types/story';
import type { User, Market } from '@/types';
import { safeJSONParse } from '@/utils/storageRecovery';

const STORIES_KEY = 'app_stories';

export const [StoryContext, useStories] = createContextHook(() => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentMarket, setCurrentMarket] = useState<Market | null>(null);

  const loadStories = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORIES_KEY);
      if (stored) {
        const allStories = await safeJSONParse<Story[]>(stored, []);
        
        if (!Array.isArray(allStories)) {
          console.warn('Stories data is not array, clearing');
          await AsyncStorage.removeItem(STORIES_KEY);
          setStories([]);
          return;
        }
        
        const now = new Date();
        
        const validStories = allStories.filter(story => {
          const expiresAt = new Date(story.expiresAt);
          return expiresAt > now && story.isActive;
        });

        if (validStories.length !== allStories.length) {
          await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(validStories));
        }

        setStories(validStories);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      await AsyncStorage.removeItem(STORIES_KEY);
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  const saveStories = async (updatedStories: Story[]) => {
    try {
      await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(updatedStories));
      setStories(updatedStories);
    } catch (error) {
      console.error('Error saving stories:', error);
    }
  };

  const addStory = useCallback(async (
    title: string,
    content: string,
    imageUrl?: string,
    videoUrl?: string,
    backgroundColor?: string,
    textColor?: string,
    durationHours: number = 24
  ): Promise<string> => {
    if (!currentMarket) return '';

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    const newStory: Story = {
      id: Date.now().toString(),
      marketId: currentMarket.id,
      title,
      content,
      imageUrl,
      videoUrl,
      backgroundColor: backgroundColor || '#1F2937',
      textColor: textColor || '#FFFFFF',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      views: [],
      isActive: true,
    };

    const updatedStories = [...stories, newStory];
    await saveStories(updatedStories);
    return newStory.id;
  }, [stories, currentMarket]);

  const deleteStory = useCallback(async (storyId: string) => {
    const updatedStories = stories.filter(s => s.id !== storyId);
    await saveStories(updatedStories);
  }, [stories]);

  const viewStory = useCallback(async (storyId: string) => {
    if (!currentUser) return;

    const updatedStories = stories.map(story => {
      if (story.id === storyId) {
        const alreadyViewed = story.views.some(v => v.userId === currentUser.id);
        
        if (!alreadyViewed) {
          const newView: StoryView = {
            userId: currentUser.id,
            userName: currentUser.fullName || currentUser.username,
            viewedAt: new Date().toISOString(),
          };
          
          return {
            ...story,
            views: [...story.views, newView],
          };
        }
      }
      return story;
    });

    await saveStories(updatedStories);
  }, [stories, currentUser]);

  const getStoryViews = useCallback((storyId: string): StoryView[] => {
    const story = stories.find(s => s.id === storyId);
    return story?.views || [];
  }, [stories]);

  const activeStories = useMemo(() => {
    if (!currentMarket) return [];
    return stories.filter(s => s.marketId === currentMarket.id);
  }, [stories, currentMarket]);

  const setContext = useCallback((user: User | null, market: Market | null) => {
    setCurrentUser(user);
    setCurrentMarket(market);
  }, []);

  return {
    stories: activeStories,
    activeStories,
    addStory,
    deleteStory,
    viewStory,
    getStoryViews,
    isLoading,
    setContext,
  };
});


