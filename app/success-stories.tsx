import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, TrendingUp, Heart, MessageCircle, Trophy, CheckCircle, DollarSign, Calendar } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SuccessStory {
  id: string;
  debtorId: string;
  debtorName: string;
  type: 'full_payment' | 'milestone' | 'streak' | 'improvement';
  title: string;
  titleKu: string;
  description: string;
  descriptionKu: string;
  amount?: number;
  metric?: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = 'success_stories';

export default function SuccessStoriesScreen() {
  const { debtors } = useDebt();
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { settings } = useTheme();
  const isDarkMode = settings.theme === 'dark';

  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  React.useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setStories(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    }
  };

  const saveStories = async (newStories: SuccessStory[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStories));
    } catch (error) {
      console.error('Error saving stories:', error);
    }
  };

  const generateStories = useCallback(() => {
    const newStories: SuccessStory[] = [];
    const existingStoryIds = new Set(stories.map(s => `${s.debtorId}-${s.type}`));

    debtors.forEach(debtor => {
      const payments = debtor.transactions.filter(t => t.type === 'payment');

      if (debtor.totalDebt === 0 && payments.length > 0) {
        const storyId = `${debtor.id}-full_payment`;
        if (!existingStoryIds.has(storyId)) {
          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          newStories.push({
            id: Date.now().toString() + debtor.id,
            debtorId: debtor.id,
            debtorName: debtor.name,
            type: 'full_payment',
            title: `${debtor.name} is Debt-Free! 🎉`,
            titleKu: `${debtor.name} قەرزی نەماوە! 🎉`,
            description: `Successfully paid off all debt of ${totalPaid.toLocaleString('en-US')}`,
            descriptionKu: `بە سەرکەوتوویی هەموو قەرزەکانی دایەوە: ${totalPaid.toLocaleString('en-US')}`,
            amount: totalPaid,
            createdAt: payments[payments.length - 1].date,
            likes: [],
            comments: [],
          });
        }
      }

      if (payments.length >= 10 && payments.length % 10 === 0) {
        const storyId = `${debtor.id}-milestone`;
        if (!existingStoryIds.has(storyId)) {
          newStories.push({
            id: Date.now().toString() + debtor.id + '-milestone',
            debtorId: debtor.id,
            debtorName: debtor.name,
            type: 'milestone',
            title: `${debtor.name} reached ${payments.length} payments! 🏆`,
            titleKu: `${debtor.name} گەیشتە ${payments.length} پارەدان! 🏆`,
            description: `Consistent payment history milestone`,
            descriptionKu: `گەیشتنە ئامانجی پارەدانی بەردەوام`,
            metric: `${payments.length} payments`,
            createdAt: payments[payments.length - 1].date,
            likes: [],
            comments: [],
          });
        }
      }

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid >= 10000 && totalPaid % 10000 < 5000) {
        const storyId = `${debtor.id}-improvement`;
        if (!existingStoryIds.has(storyId)) {
          newStories.push({
            id: Date.now().toString() + debtor.id + '-improvement',
            debtorId: debtor.id,
            debtorName: debtor.name,
            type: 'improvement',
            title: `${debtor.name} paid ${totalPaid.toLocaleString('en-US')}! 💪`,
            titleKu: `${debtor.name} بڕی ${totalPaid.toLocaleString('en-US')} دایەوە! 💪`,
            description: `Great progress in debt reduction`,
            descriptionKu: `پێشکەوتنێکی زۆر لە کەمکردنەوەی قەرز`,
            amount: totalPaid,
            createdAt: payments[payments.length - 1].date,
            likes: [],
            comments: [],
          });
        }
      }
    });

    if (newStories.length > 0) {
      const updated = [...newStories, ...stories].slice(0, 50);
      setStories(updated);
      saveStories(updated);
    }
  }, [debtors, stories]);

  React.useEffect(() => {
    generateStories();
  }, [generateStories]);

  const toggleLike = (storyId: string) => {
    if (!currentUser) return;

    const updated = stories.map(story => {
      if (story.id === storyId) {
        const likes = story.likes.includes(currentUser.id)
          ? story.likes.filter(id => id !== currentUser.id)
          : [...story.likes, currentUser.id];
        return { ...story, likes };
      }
      return story;
    });

    setStories(updated);
    saveStories(updated);
  };

  const addComment = (storyId: string) => {
    if (!currentUser || !commentText.trim()) return;

    const updated = stories.map(story => {
      if (story.id === storyId) {
        const newComment: Comment = {
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.fullName || currentUser.username,
          text: commentText,
          createdAt: new Date().toISOString(),
        };
        return {
          ...story,
          comments: [...story.comments, newComment],
        };
      }
      return story;
    });

    setStories(updated);
    saveStories(updated);
    setCommentText('');
  };

  const sortedStories = useMemo(() => {
    return [...stories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stories]);

  const totalLikes = stories.reduce((sum, s) => sum + s.likes.length, 0);
  const totalComments = stories.reduce((sum, s) => sum + s.comments.length, 0);

  const bgColor = isDarkMode ? '#1F2937' : '#F9FAFB';
  const cardBg = isDarkMode ? '#374151' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const secondaryText = isDarkMode ? '#D1D5DB' : '#6B7280';
  const inputBg = isDarkMode ? '#4B5563' : '#F3F4F6';

  const getStoryIcon = (type: string) => {
    switch (type) {
      case 'full_payment': return <CheckCircle size={32} color="#10B981" />;
      case 'milestone': return <Trophy size={32} color="#F59E0B" />;
      case 'streak': return <TrendingUp size={32} color="#3B82F6" />;
      case 'improvement': return <DollarSign size={32} color="#8B5CF6" />;
      default: return <Sparkles size={32} color="#6B7280" />;
    }
  };

  const getStoryColor = (type: string): [string, string] => {
    switch (type) {
      case 'full_payment': return ['#10B981', '#34D399'];
      case 'milestone': return ['#F59E0B', '#FBBF24'];
      case 'streak': return ['#3B82F6', '#60A5FA'];
      case 'improvement': return ['#8B5CF6', '#A78BFA'];
      default: return ['#6B7280', '#9CA3AF'];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen 
        options={{
          title: language === 'ku' ? 'چیرۆکی سەرکەوتن' : 'Success Stories',
          headerStyle: { backgroundColor: cardBg },
          headerTintColor: textColor,
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#F59E0B', '#EC4899']}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Sparkles size={48} color="#FFF" />
          <Text style={styles.headerTitle}>
            {language === 'ku' ? 'چیرۆکی سەرکەوتن' : 'Success Stories'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {language === 'ku' 
              ? 'ئامانج و دەستکەوتەکان پێکەوە بەرزبکەینەوە' 
              : 'Celebrate achievements together'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stories.length}</Text>
              <Text style={styles.statLabel}>
                {language === 'ku' ? 'چیرۆک' : 'Stories'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalLikes}</Text>
              <Text style={styles.statLabel}>
                {language === 'ku' ? 'حەز' : 'Likes'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalComments}</Text>
              <Text style={styles.statLabel}>
                {language === 'ku' ? 'تێبینی' : 'Comments'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          {sortedStories.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
              <Sparkles size={48} color={secondaryText} />
              <Text style={[styles.emptyText, { color: secondaryText }]}>
                {language === 'ku' 
                  ? 'هیچ چیرۆکێک نییە تا ئێستا. دەستپێبکە و یەکەم سەرکەوتن دروست بکە!' 
                  : 'No stories yet. Start making payments and create the first success story!'}
              </Text>
            </View>
          )}

          {sortedStories.map(story => {
            const isLiked = currentUser ? story.likes.includes(currentUser.id) : false;
            const storyColors = getStoryColor(story.type);

            return (
              <TouchableOpacity
                key={story.id}
                style={[styles.storyCard, { backgroundColor: cardBg }]}
                onPress={() => setSelectedStory(selectedStory === story.id ? null : story.id)}
              >
                <LinearGradient
                  colors={storyColors}
                  style={styles.storyHeader}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.iconContainer}>
                    {getStoryIcon(story.type)}
                  </View>
                  <View style={styles.storyHeaderText}>
                    <Text style={styles.storyTitle}>
                      {language === 'ku' ? story.titleKu : story.title}
                    </Text>
                    <Text style={styles.storyDescription}>
                      {language === 'ku' ? story.descriptionKu : story.description}
                    </Text>
                  </View>
                </LinearGradient>

                {story.amount && (
                  <View style={styles.metricBox}>
                    <DollarSign size={20} color={storyColors[0]} />
                    <Text style={[styles.metricText, { color: textColor }]}>
                      {story.amount.toLocaleString('en-US')} {language === 'ku' ? 'دینار' : 'IQD'}
                    </Text>
                  </View>
                )}

                <View style={styles.storyFooter}>
                  <View style={styles.interactionRow}>
                    <TouchableOpacity
                      style={styles.interactionButton}
                      onPress={() => toggleLike(story.id)}
                    >
                      <Heart size={20} color={isLiked ? '#EC4899' : secondaryText} fill={isLiked ? '#EC4899' : 'none'} />
                      <Text style={[styles.interactionText, { color: isLiked ? '#EC4899' : secondaryText }]}>
                        {story.likes.length}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.interactionButton}
                      onPress={() => setSelectedStory(selectedStory === story.id ? null : story.id)}
                    >
                      <MessageCircle size={20} color={secondaryText} />
                      <Text style={[styles.interactionText, { color: secondaryText }]}>
                        {story.comments.length}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.dateContainer}>
                      <Calendar size={16} color={secondaryText} />
                      <Text style={[styles.dateText, { color: secondaryText }]}>
                        {new Date(story.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedStory === story.id && (
                  <View style={styles.commentsSection}>
                    {story.comments.length > 0 && (
                      <View style={styles.commentsList}>
                        {story.comments.map(comment => (
                          <View key={comment.id} style={styles.commentItem}>
                            <Text style={[styles.commentUser, { color: textColor }]}>
                              {comment.userName}
                            </Text>
                            <Text style={[styles.commentText, { color: secondaryText }]}>
                              {comment.text}
                            </Text>
                            <Text style={[styles.commentDate, { color: secondaryText }]}>
                              {new Date(comment.createdAt).toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.addCommentContainer}>
                      <TextInput
                        style={[styles.commentInput, { backgroundColor: inputBg, color: textColor }]}
                        value={commentText}
                        onChangeText={setCommentText}
                        placeholder={language === 'ku' ? 'تێبینییەک زیاد بکە...' : 'Add a comment...'}
                        placeholderTextColor={secondaryText}
                      />
                      <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: storyColors[0] }]}
                        onPress={() => addComment(story.id)}
                      >
                        <MessageCircle size={20} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  storyCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  storyHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
  },
  storyHeaderText: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 4,
  },
  storyDescription: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  metricText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  storyFooter: {
    padding: 16,
    paddingTop: 0,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto' as any,
  },
  dateText: {
    fontSize: 12,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  commentsList: {
    marginBottom: 12,
  },
  commentItem: {
    marginBottom: 12,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    marginBottom: 2,
  },
  commentDate: {
    fontSize: 11,
  },
  addCommentContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
