import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function PrivacyPolicy() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'سیاسەتی تایبەتێتی' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>سیاسەتی تایبەتێتی</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>دواین نوێکردنەوە: 22 دێسەمبەری 2025</Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. کۆکردنەوەی زانیاری</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئەم ئەپە زانیاریەکانی خوارەوە کۆدەکاتەوە:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
          • زانیاری کڕیاران (ناو، ژمارەی تەلەفۆن، وێنە){'\n'}
          • زانیاری مامەڵەکان (بڕی قەرز، مێژوو، تێبینی){'\n'}
          • زانیاری هەژمار (ناوی بەکارهێنەر، پاسوۆرد، ڕۆڵ){'\n'}
          • زانیاری شوێنکەوتن (بۆ نەخشەی کڕیاران){'\n'}
          • زانیاری ئامێر (بۆ ئاگادارییەکان)
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. بەکارهێنانی زانیاری</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          زانیاریەکان بۆ ئامانجە خوارەوە بەکاردێن:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
          • بەڕێوەبردنی قەرز و کڕیاران{'\n'}
          • ناردنی یادەوەری و ئاگاداری{'\n'}
          • دروستکردنی ڕاپۆرت و ئامار{'\n'}
          • باشترکردنی خزمەتگوزاری{'\n'}
          • پاراستنی سیستەم لە بەکارهێنانی نایاسایی
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. هەڵگرتنی زانیاری</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          هەموو زانیاریەکان لە ئامێرەکەتدا هەڵدەگیرێن بە شێوەیەکی پارێزراو. ئەگەر Cloud Sync چالاک بکەیت، زانیاریەکان لە سێرڤەری پارێزراودا هەڵدەگیرێن بە شفرەکردنی تەواو.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>4. هاوبەشکردنی زانیاری</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئێمە زانیاریەکانی کەسی بە هیچ لایەنێکی سێیەم نافرۆشین و هاوبەش ناکەین، مەگەر:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
          • بە ڕەزامەندی ڕاشکاوی تۆ{'\n'}
          • بۆ پابەندبوون بە یاسا{'\n'}
          • بۆ پاراستنی مافەکانمان
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>5. پاراستنی زانیاری</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئێمە ڕێکارە تەکنیکی و ئیداریەکانی گونجاو بەکاردێنین بۆ پاراستنی زانیاریەکانت لە دەستکەوتنی نایاسایی، گۆڕین، یان لەناوچوون.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>6. مافەکانت</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          تۆ مافی ئەمانەت هەیە:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
          • دەستکەوتن بە زانیاریەکانت{'\n'}
          • ڕاستکردنەوەی زانیاری هەڵە{'\n'}
          • سڕینەوەی زانیاریەکانت{'\n'}
          • هەڵگوشین لە بەکارهێنانی زانیاریەکانت{'\n'}
          • گواستنەوەی زانیاریەکانت
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>7. تایبەتمەندیەکانی AI</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          کاتێک تایبەتمەندیەکانی AI بەکاردێنیت، زانیاری نهێنیکراو دەنێردرێت بۆ خزمەتگوزاری AI بۆ پرۆسێسکردن. ئێمە زانیاری کەسی هاوبەش ناکەین.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>8. منداڵان</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئەم ئەپە بۆ بەکارهێنەران لە تەمەنی 18 ساڵ و سەرووتر دروستکراوە. ئێمە بە زانیاری زانیاری منداڵانی خوار 18 ساڵ کۆناکەینەوە.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>9. گۆڕانکاری</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئێمە ڕەنگە ئەم سیاسەتە نوێ بکەینەوە لە کاتی پێویستدا. گۆڕانکارییە گرنگەکان بە ئاگاداری پێتدا دەگەین.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>10. پەیوەندیکردن</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          بۆ هەر پرسیار یان نیگەرانییەک دەربارەی ئەم سیاسەتە، تکایە پەیوەندیمان پێوە بکە لە ڕێگەی بەشی پشتگیری لە ئەپەکەدا.
        </Text>

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
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 8,
    textAlign: 'right' as const,
  },
  date: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'right' as const,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'right' as const,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right' as const,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right' as const,
    marginBottom: 8,
  },
  spacer: {
    height: 40,
  },
});
