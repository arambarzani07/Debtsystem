import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Eye } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useStories } from '@/contexts/StoryContext';
import type { StoryView } from '@/types/story';

export default function StoryViewsScreen() {
  const { colors } = useTheme();
  const { storyId } = useLocalSearchParams();
  const { getStoryViews } = useStories();

  const views = getStoryViews(storyId as string);

  const renderViewItem = ({ item }: { item: StoryView }) => {
    const viewDate = new Date(item.viewedAt);
    const timeAgo = getTimeAgo(viewDate);

    return (
      <View style={[styles.viewCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.viewInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{item.userName}</Text>
          <Text style={[styles.viewTime, { color: colors.textSecondary }]}>{timeAgo}</Text>
        </View>
        <Eye size={20} color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={[styles.viewCount, { color: colors.text }]}>
            {views.length} بینین
          </Text>
        </View>

        {views.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Eye size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              هێشتا کەس نەیبینیوە
            </Text>
          </View>
        ) : (
          <FlatList
            data={views}
            renderItem={renderViewItem}
            keyExtractor={(item, index) => `${item.userId}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'ئێستا';
  if (diffMins < 60) return `${diffMins} خولەک پێش ئێستا`;
  if (diffHours < 24) return `${diffHours} کاتژمێر پێش ئێستا`;
  return `${diffDays} ڕۆژ پێش ئێستا`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  viewCount: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  viewCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  viewInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
    textAlign: 'right',
  },
  viewTime: {
    fontSize: 13,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
