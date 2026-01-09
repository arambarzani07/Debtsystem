import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { CheckCircle, Sparkles, Zap, Star } from 'lucide-react-native';

interface ChangelogItem {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: string[];
}

const changelog: ChangelogItem[] = [
  {
    version: '1.0.0',
    date: '22 دێسەمبەری 2025',
    type: 'major',
    changes: [
      'دەستپێکی فەرمیی سیستەمی بەڕێوەبردنی قەرز',
      'بەڕێوەبردنی کڕیاران و قەرزەکان',
      'سیستەمی مامەڵەکان',
      'ناردنی یادەوەری بە WhatsApp و SMS',
      'ڕاپۆرت و ئامارە پێشکەوتووەکان',
      'پاشەکەوتکردن و گەڕاندنەوەی زانیاری',
      'پشتگیری لە زمانی کوردی و ئینگلیزی',
      'ڕێنگی تاریک و ڕووناک',
      'پاراستن بە Face ID/Fingerprint',
      'سیستەمی کارمەندان',
      'تایبەتمەندیەکانی AI',
      'سیستەمی خاڵە و پاداشت',
      'پلانی پارەدانی زیرەک',
      'پارەدانی دەنگی',
      'نەخشەی کڕیاران',
      'پەیوەندی بە Telegram',
      'Cloud Sync',
      'سیستەمی ستۆری',
      'شیکاری قەرزی پێشکەوتوو',
      'کامپەینی کۆکردنەوە',
    ],
  },
];

function ChangelogCard({ item }: { item: ChangelogItem }) {
  const { colors } = useTheme();

  const getTypeColor = () => {
    switch (item.type) {
      case 'major':
        return colors.primary;
      case 'minor':
        return colors.success;
      case 'patch':
        return colors.warning;
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'major':
        return <Star size={20} color="#FFFFFF" />;
      case 'minor':
        return <Sparkles size={20} color="#FFFFFF" />;
      case 'patch':
        return <Zap size={20} color="#FFFFFF" />;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'major':
        return 'نوێکردنەوەی گەورە';
      case 'minor':
        return 'تایبەتمەندی نوێ';
      case 'patch':
        return 'چاککردنەوە';
    }
  };

  return (
    <View style={[styles.changelogCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
      <View style={styles.headerRow}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor() }]}>
          {getTypeIcon()}
          <Text style={styles.typeText}>{getTypeLabel()}</Text>
        </View>
        <View style={styles.versionContainer}>
          <Text style={[styles.version, { color: colors.text }]}>v{item.version}</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.changesContainer}>
        {item.changes.map((change, index) => (
          <View key={index} style={styles.changeItem}>
            <CheckCircle size={18} color={colors.success} style={styles.checkIcon} />
            <Text style={[styles.changeText, { color: colors.textSecondary }]}>{change}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function WhatsNew() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'چی نوێیە' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>چی نوێیە</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            دوایین نوێکردنەوە و باشترکردنەکان
          </Text>
        </View>

        {changelog.map((item, index) => (
          <ChangelogCard key={index} item={item} />
        ))}

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>نوێکردنەوەی داهاتوو</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            ئێمە بەردەوام کاردەکەین لەسەر باشترکردنی ئەپەکە و زیادکردنی تایبەتمەندی نوێ. پێشنیارەکانت بۆمان بنێرە لە ڕێگەی بەشی پشتگیری.
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 8,
    textAlign: 'right' as const,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'right' as const,
  },
  changelogCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  versionContainer: {
    alignItems: 'flex-end' as const,
  },
  version: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  typeBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold' as const,
    marginLeft: 6,
  },
  changesContainer: {
    marginTop: 8,
  },
  changeItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  checkIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  changeText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    textAlign: 'right' as const,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    textAlign: 'right' as const,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right' as const,
  },
  spacer: {
    height: 40,
  },
});
