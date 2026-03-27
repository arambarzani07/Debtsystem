import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';

export default function TermsOfService() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'مەرجەکانی بەکارهێنان' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>مەرجەکانی بەکارهێنان</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>دواین نوێکردنەوە: 22 دێسەمبەری 2025</Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. پەسەندکردنی مەرجەکان</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          بە بەکارهێنانی ئەم ئەپە، تۆ ڕازی دەبیت بە پابەندبوون بەم مەرجانە. ئەگەر ڕازی نیت، تکایە ئەپەکە بەکارمەهێنە.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. بەکارهێنانی مۆڵەت پێدراو</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئێمە مۆڵەتی سنووردار، نا-ئەکسکلۆسیڤ، و گواستنەوەی نەکراو پێدەدەین بۆ بەکارهێنانی ئەپەکە بۆ ئامانجی کەسی یان بازرگانی یاسایی.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. بەکارهێنانی قەدەغەکراو</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          تۆ ڕێگەت پێنادرێت:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
          • بەکارهێنانی ئەپەکە بۆ هیچ ئامانجێکی نایاسایی{'\n'}
          • هەوڵدان بۆ دەستکەوتنی نایاسایی بە سیستەمەکە{'\n'}
          • کۆپی کردن، گۆڕین، یان بڵاوکردنەوەی ئەپەکە{'\n'}
          • ڕێورەوشاندنی کۆدی سەرچاوەی ئەپەکە{'\n'}
          • زیان گەیاندن بە ئەپەکە یان سێرڤەرەکانی
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>4. هەژماری بەکارهێنەر</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          تۆ بەرپرسیاریت لە:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
          • نهێنیکردنی زانیاری هەژمارەکەت{'\n'}
          • هەموو چالاکییەک لە ژێر هەژمارەکەتدا{'\n'}
          • ئاگادارکردنەوەمان بە دەستکەوتنی نایاسایی
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>5. ناوەڕۆکی بەکارهێنەر</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          تۆ خاوەنی زانیاریەکانی کە دەیخەیتە ناو ئەپەکە. ئێمە مافی نییە بەکاری بهێنین یان هاوبەشی بکەین بێ ڕەزامەندیت.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>6. پاشەکەوتکردن و گەڕانەوە</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئێمە پێشنیاری پاشەکەوتکردنی زانیاریەکانت دەکەین. تۆ بەرپرسیاریت لە پاشەکەوتکردنی زانیاریەکانت بە بەردەوامی. ئێمە بەرپرسیارێتیمان نییە لە لەدەستچوونی زانیاری.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>7. دەستبەردانی خزمەتگوزاری</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئێمە ڕەنگە:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
          • سەرپێچی بکەین یان بگۆڕین بەبێ ئاگادارکردنەوە{'\n'}
          • وەستێنین یان سنووردار بکەین{'\n'}
          • بەرز بکەینەوە بۆ چاککردنەوە یان نوێکردنەوە
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>8. پارەدان و نوێکردنەوە</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          هەندێک تایبەتمەندی ڕەنگە پارەیان لێ بکرێت. هەموو پارەدانێک یەکجار و گەڕانەوەی نییە، مەگەر یاسا پێویستی بکات.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>9. وەک خۆیەتی</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئەپەکە &ldquo;وەک خۆیەتی&rdquo; پێشکەش دەکرێت بەبێ هیچ گەرەنتیەک. ئێمە گەرەنتی ناکەین کە:
        </Text>
        <Text style={[styles.bulletPoint, { color: colors.textSecondary }]}>
          • ئەپەکە بەبێ هەڵە دەبێت{'\n'}
          • هەموو کێشەکان چارەسەر دەکرێن{'\n'}
          • ئەپەکە لەگەڵ هەموو ئامێرێکدا کاردەکات
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>10. سنووردارکردنی بەرپرسیارێتی</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئێمە بەرپرسیار نین بۆ هیچ زیانێکی ڕاستەوخۆ، نا-ڕاستەوخۆ، تایبەت، یان ئەنجامەیی کە لە بەکارهێنانی یان نەتوانینی بەکارهێنانی ئەپەکە سەرچاوە دەگرێت.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>11. یاسا</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئەم مەرجانە بە یاساکانی هەرێمی کوردستان و یاساکانی نێودەوڵەتی بەڕێوە دەبرێن.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>12. گۆڕانکاری</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          ئێمە مافی هەیە ئەم مەرجانە نوێ بکەینەوە لە هەر کاتێکدا. بەکارهێنانی بەردەوامت پاش گۆڕانکارییەکان واتە پەسەندکردنی گۆڕانکارییەکان.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>13. پەیوەندیکردن</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          بۆ هەر پرسیار دەربارەی ئەم مەرجانە، تکایە پەیوەندیمان پێوە بکە لە ڕێگەی بەشی پشتگیری لە ئەپەکەدا.
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
