import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Image,
  Modal,
  Platform,
  Alert,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { X, Eye, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useStories } from '@/contexts/StoryContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Story } from '@/types/story';

const { width, height } = Dimensions.get('window');

export default function StoriesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { stories, deleteStory, viewStory, setContext } = useStories();
  const auth = useAuth();
  const { currentUser, getCurrentMarket } = auth;
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressTimerRef = useRef<any>(null);

  useEffect(() => {
    const market = getCurrentMarket();
    setContext(currentUser || null, market);
  }, [currentUser, getCurrentMarket, setContext]);

  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'owner';

  const handleClose = useCallback(() => {
    if (progressTimerRef.current) {
      progressTimerRef.current.stop();
    }
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    setSelectedStory(null);
    setIsPaused(false);
  }, [progressAnim]);

  const handleNextInternal = useCallback(() => {
    if (progressTimerRef.current) {
      progressTimerRef.current.stop();
    }
    if (currentStoryIndex < stories.length - 1) {
      const nextStory = stories[currentStoryIndex + 1];
      setSelectedStory(nextStory);
      setCurrentStoryIndex(currentStoryIndex + 1);
      viewStory(nextStory.id);
      setIsPaused(false);
    } else {
      handleClose();
    }
  }, [currentStoryIndex, stories, viewStory, handleClose]);

  const startProgressInternal = useCallback(() => {
    if (progressTimerRef.current) {
      progressTimerRef.current.stop();
    }
    progressAnim.setValue(0);
    progressTimerRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    progressTimerRef.current.start(({ finished }: { finished: boolean }) => {
      if (finished && !isPaused) {
        handleNextInternal();
      }
    });
  }, [progressAnim, isPaused, handleNextInternal]);

  useEffect(() => {
    if (selectedStory && !isPaused) {
      const timer = setTimeout(() => {
        startProgressInternal();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedStory, isPaused, currentStoryIndex, startProgressInternal]);

  const pauseProgress = useCallback(() => {
    setIsPaused(true);
    if (progressTimerRef.current) {
      progressAnim.stopAnimation();
    }
  }, [progressAnim]);

  const resumeProgress = useCallback(() => {
    setIsPaused(false);
    if (selectedStory) {
      const currentValue = (progressAnim as any)._value || 0;
      const remainingDuration = (1 - currentValue) * 5000;
      
      if (progressTimerRef.current) {
        progressTimerRef.current.stop();
      }
      
      progressTimerRef.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration: remainingDuration,
        useNativeDriver: false,
      });
      progressTimerRef.current.start(({ finished }: { finished: boolean }) => {
        if (finished && selectedStory) {
          handleNextInternal();
        }
      });
    }
  }, [selectedStory, handleNextInternal, progressAnim]);

  const handleStoryPress = useCallback(async (story: Story, index: number) => {
    setSelectedStory(story);
    setCurrentStoryIndex(index);
    setIsPaused(false);
    await viewStory(story.id);
    setTimeout(() => {
      startProgressInternal();
    }, 100);
  }, [viewStory, startProgressInternal]);

  const handlePrevious = useCallback(() => {
    if (progressTimerRef.current) {
      progressTimerRef.current.stop();
    }
    if (currentStoryIndex > 0) {
      const prevStory = stories[currentStoryIndex - 1];
      setSelectedStory(prevStory);
      setCurrentStoryIndex(currentStoryIndex - 1);
      viewStory(prevStory.id);
      setIsPaused(false);
      setTimeout(() => {
        startProgressInternal();
      }, 100);
    }
  }, [currentStoryIndex, stories, startProgressInternal, viewStory]);

  const handleDeleteStory = useCallback(async (storyId: string) => {
    if (Platform.OS === 'web') {
      if (confirm('ئایا دڵنیایت لە سڕینەوەی ئەم ستۆریە؟')) {
        await deleteStory(storyId);
      }
    } else {
      Alert.alert(
        'سڕینەوەی ستۆری',
        'ئایا دڵنیایت لە سڕینەوەی ئەم ستۆریە؟',
        [
          { text: 'نەخێر', style: 'cancel' },
          {
            text: 'بەڵێ',
            style: 'destructive',
            onPress: async () => {
              await deleteStory(storyId);
            },
          },
        ]
      );
    }
  }, [deleteStory]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pauseProgress();
      },
      onPanResponderRelease: (_, gestureState) => {
        resumeProgress();
        
        const { dx, dy } = gestureState;
        
        if (Math.abs(dy) > 100) {
          handleClose();
        } else if (Math.abs(dx) > 50) {
          if (dx > 0 && currentStoryIndex > 0) {
            handlePrevious();
          } else if (dx < 0 && currentStoryIndex < stories.length - 1) {
            handleNextInternal();
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        progressTimerRef.current.stop();
      }
    };
  }, []);

  const renderStoryRing = ({ item }: { item: Story }) => {
    const hasViewed = item.views.some(v => v.userId === currentUser?.id);
    const gradientColors = hasViewed 
      ? ['#9CA3AF', '#6B7280']
      : ['#F97316', '#EF4444', '#EC4899'];

    return (
      <View style={styles.storyRingContainer}>
        <TouchableOpacity
          onPress={() => handleStoryPress(item, stories.indexOf(item))}
          activeOpacity={0.8}
          onLongPress={() => isManager ? handleDeleteStory(item.id) : undefined}
        >
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            style={styles.storyRingBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.storyRingInner}>
              <View style={[styles.storyRingContent, { backgroundColor: colors.card || '#1F2937' }]}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.storyRingImage} />
                ) : (
                  <LinearGradient
                    colors={[item.backgroundColor || '#1F2937', item.backgroundColor || '#111827']}
                    style={styles.storyRingImage}
                  >
                    <Text style={[styles.storyRingText, { color: item.textColor || '#FFFFFF' }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </View>
          </LinearGradient>
          {item.views.length > 0 && (
            <View style={[styles.viewBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.viewBadgeText}>{item.views.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.storyUsername, { color: colors.text }]} numberOfLines={1}>
          {new Date(item.createdAt).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <X size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>ستۆریەکان</Text>
          {isManager && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/create-story' as any)}
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {stories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              هیچ ستۆریەک نییە
            </Text>
            {isManager && (
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                دوگمەی + دابگرە بۆ زیادکردنی ستۆری نوێ
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={stories}
            renderItem={renderStoryRing}
            keyExtractor={(item) => item.id}
            horizontal
            contentContainerStyle={styles.storiesRingList}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <Modal visible={selectedStory !== null} transparent animationType="fade">
        {selectedStory && (
          <View style={styles.storyModal} {...panResponder.panHandlers}>
            <LinearGradient
              colors={[selectedStory.backgroundColor || '#1F2937', selectedStory.backgroundColor || '#111827']}
              style={styles.storyModalContent}
            >
              <SafeAreaView style={styles.storyModalSafe} edges={['top']}>
                <View style={styles.progressContainer}>
                  {stories.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.progressBar,
                        { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                      ]}
                    >
                      {index < currentStoryIndex && (
                        <View style={[styles.progressFill, { backgroundColor: '#FFFFFF' }]} />
                      )}
                      {index === currentStoryIndex && (
                        <Animated.View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: '#FFFFFF',
                              width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              }),
                            },
                          ]}
                        />
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.storyHeader}>
                  <View style={styles.storyHeaderContent}>
                    <Text style={styles.storyTime}>
                      {new Date(selectedStory.createdAt).toLocaleDateString('ar-IQ')}
                    </Text>
                    {isPaused && (
                      <View style={styles.pausedIndicator}>
                        <Text style={styles.pausedText}>⏸</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <X size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.storyBody}>
                  <TouchableOpacity
                    style={styles.storyTouchLeft}
                    onPress={handlePrevious}
                    onPressIn={pauseProgress}
                    onPressOut={resumeProgress}
                    activeOpacity={1}
                  />
                  <View style={styles.storyCenter}>
                    {selectedStory.imageUrl ? (
                      <Image 
                        source={{ uri: selectedStory.imageUrl }} 
                        style={styles.fullImage} 
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.textStoryContainer}>
                        <Text style={[styles.fullTitle, { color: selectedStory.textColor }]}>
                          {selectedStory.title}
                        </Text>
                        <Text style={[styles.fullContent, { color: selectedStory.textColor }]}>
                          {selectedStory.content}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.storyTouchRight}
                    onPress={handleNextInternal}
                    onPressIn={pauseProgress}
                    onPressOut={resumeProgress}
                    activeOpacity={1}
                  />
                </View>

                {isManager && (
                  <View style={styles.storyFooter}>
                    <TouchableOpacity
                      style={styles.viewsButton}
                      onPress={() => {
                        handleClose();
                        router.push({
                          pathname: '/story-views' as any,
                          params: { storyId: selectedStory.id },
                        });
                      }}
                    >
                      <Eye size={20} color="#FFFFFF" />
                      <Text style={styles.viewsButtonText}>
                        {selectedStory.views.length} بینین
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </SafeAreaView>
            </LinearGradient>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storiesRingList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  storyRingContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  storyRingBorder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingContent: {
    width: 78,
    height: 78,
    borderRadius: 39,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  viewBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  viewBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  storyUsername: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 88,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  storyModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyModalContent: {
    flex: 1,
  },
  storyModalSafe: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row-reverse',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  storyHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  storyHeaderContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  storyTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pausedIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  pausedText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  closeButton: {
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  storyBody: {
    flex: 1,
    flexDirection: 'row',
  },
  storyTouchLeft: {
    flex: 1,
    zIndex: 10,
  },
  storyCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  storyTouchRight: {
    flex: 1,
    zIndex: 10,
  },
  fullImage: {
    width: width,
    height: height,
  },
  textStoryContainer: {
    paddingHorizontal: 32,
    maxWidth: width * 0.9,
  },
  fullTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  fullContent: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  storyFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  viewsButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  viewsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
