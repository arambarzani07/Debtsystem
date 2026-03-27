import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Package, Users, Shield, Zap } from 'lucide-react-native';

export default function About() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'دەربارە' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>سیستەمی بەڕێوەبردنی قەرز</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>وەشانی 1.0.0</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>دەربارەی ئەپەکە</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            سیستەمی بەڕێوەبردنی قەرز چارەسەرێکی تەواو و پڕ تایبەتمەندییە بۆ بەڕێوەبردنی قەرز و کڕیاران. ئەم ئەپە تایبەتە بۆ بازرگانان و کەسانی کە دەیانەوێت قەرزەکانیان بە شێوەیەکی پرۆفیشناڵ بەڕێوە ببەن.
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Package size={24} color={colors.primary} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.text }]}>تایبەتمەندیە سەرەکیەکان</Text>
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            • بەڕێوەبردنی کڕیاران و قەرزەکان{'\n'}
            • ناردنی یادەوەری و ئاگاداری{'\n'}
            • ڕاپۆرت و ئامارە پێشکەوتووەکان{'\n'}
            • پاشەکەوتکردن و گەڕاندنەوەی زانیاری{'\n'}
            • تایبەتمەندیەکانی AI{'\n'}
            • سیستەمی خاڵە و پاداشت{'\n'}
            • پلانی پارەدانی زیرەک{'\n'}
            • نەخشەی کڕیاران{'\n'}
            • سیستەمی کارمەندان{'\n'}
            • پەیوەندی بە WhatsApp و Telegram
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Shield size={24} color={colors.success} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.text }]}>پاراستن و تایبەتێتی</Text>
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            ئێمە پاراستنی زانیاریەکانت بە جدی وەردەگرین. هەموو زانیاریەکان بە شێوەیەکی پارێزراو هەڵدەگیرێن و بە شفرەکردنی تەواو پارێزراون. تۆ دەتوانیت Face ID یان Fingerprint بەکاربهێنیت بۆ پاراستنی زیاتر.
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
            <Zap size={24} color={colors.warning} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.text }]}>خێرا و بەکارهێنانی ئاسان</Text>
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            دیزاینی سادە و بەکارهێنانی ئاسان دەکات کە بتوانیت بە خێرایی زانیاریەکانت بەڕێوە ببەیت. پشتگیری لە زمانی کوردی و ئینگلیزی.
          </Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
            <Users size={24} color={colors.error} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.text }]}>تیمی گەشەپێدان</Text>
          <Text style={[styles.featureText, { color: colors.textSecondary }]}>
            ئەم ئەپە بە خۆشەویستی و تێکۆشانی زۆرەوە دروستکراوە بۆ یارمەتیدانی بازرگانان لە هەرێمی کوردستان. ئامانجمان باشترکردنی کاری بازرگانییە بە تەکنەلۆژیای نوێ.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>پەیوەندی</Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            بۆ پشتگیری، پێشنیار، یان گوزارشتی کێشە، تکایە بڕۆ بۆ بەشی پشتگیری لە ڕێکخستنەکاندا.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: colors.textSecondary }]}>
            © 2025 سیستەمی بەڕێوەبردنی قەرز
          </Text>
          <Text style={[styles.copyright, { color: colors.textSecondary }]}>
            هەموو مافەکان پارێزراون
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
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    textAlign: 'center' as const,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    textAlign: 'right' as const,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right' as const,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center' as const,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  featureText: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right' as const,
  },
  footer: {
    alignItems: 'center' as const,
    marginTop: 32,
    paddingTop: 20,
  },
  copyright: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  spacer: {
    height: 40,
  },
});
