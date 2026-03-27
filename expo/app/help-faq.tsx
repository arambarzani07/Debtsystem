import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'چۆن کڕیارێکی نوێ زیاد بکەم؟',
    answer: 'لە پەیجی سەرەکیدا، دوگمەی "+" ی سەوز لە خوارەوە دابگرە. ناو و ژمارەی تەلەفۆنی کڕیارەکە بنووسە و دوگمەی "زیادکردن" دابگرە.',
  },
  {
    question: 'چۆن قەرزێک زیاد بکەم؟',
    answer: 'لەسەر کڕیارەکە کلیک بکە، پاشان دوگمەی "زیادکردنی قەرز" دابگرە. بڕی قەرز و تێبینی بنووسە و دوگمەی "زیادکردن" دابگرە.',
  },
  {
    question: 'چۆن پارەیەک وەربگرم؟',
    answer: 'لەسەر کڕیارەکە کلیک بکە، پاشان دوگمەی "وەرگرتنی پارە" دابگرە. بڕی پارە بنووسە و دوگمەی "وەرگرتن" دابگرە.',
  },
  {
    question: 'چۆن یادەوەریەک بنێرم؟',
    answer: 'بڕۆ بۆ "ناردنی یادەوەری" لە مێنووی سەرەکیدا. کڕیارەکان هەڵبژێرە، نامەکە بنووسە و ڕێگای ناردن هەڵبژێرە (WhatsApp یان SMS).',
  },
  {
    question: 'چۆن پاشەکەوتی زانیاریەکانم بکەم؟',
    answer: 'بڕۆ بۆ ڕێکخستنەکان > پاشەکەوتکردن و گەڕانەوە. دەتوانیت پاشەکەوتی بکەیت بۆ فایل، Google Drive، یان Cloud.',
  },
  {
    question: 'چۆن زمان بگۆڕم؟',
    answer: 'بڕۆ بۆ ڕێکخستنەکان > زمان و ئەو زمانەی کە دەتەوێت هەڵبژێرە (کوردی یان ئینگلیزی).',
  },
  {
    question: 'چۆن ڕێنگ بگۆڕم (Dark/Light)?',
    answer: 'بڕۆ بۆ ڕێکخستنەکان > ڕێنگ و ئەو ڕێنگەی کە دەتەوێت هەڵبژێرە (Light، Dark، یان ئۆتۆماتیک).',
  },
  {
    question: 'چۆن ئەپەکە بە Face ID/Fingerprint پاراستن بکەم؟',
    answer: 'بڕۆ بۆ ڕێکخستنەکان > پاراستن و دەستەڵاتەکان. بەشی "Face ID/Touch ID" چالاک بکە.',
  },
  {
    question: 'چۆن کارمەندێک زیاد بکەم؟',
    answer: 'بڕۆ بۆ پانێڵی خاوەندار > بەڕێوەبردنی کارمەندان. دوگمەی "زیادکردنی کارمەند" دابگرە و زانیاریەکان بنووسە.',
  },
  {
    question: 'چۆن ڕاپۆرتێک دروست بکەم؟',
    answer: 'بڕۆ بۆ ڕاپۆرت و ئامار لە مێنووی سەرەکیدا. دەتوانیت ڕاپۆرتی مانگانە، ساڵانە، یان تایبەت دروست بکەیت.',
  },
  {
    question: 'چۆن سوود بە قەرزێک زیاد بکەم؟',
    answer: 'کاتێک کڕیارێک زیاد دەکەیت یان دەستکاری دەکەیت، ڕێژەی سوود لە بەشی "ڕێژەی سوود" بنووسە. سوود بە شێوەیەکی ئۆتۆماتیک حیساب دەکرێت.',
  },
  {
    question: 'چۆن کاتی حیسابکردن دیاری بکەم؟',
    answer: 'کاتێک کڕیارێک زیاد دەکەیت، "بەرواری حیسابکردن" هەڵبژێرە. ئەگەر دیاری نەکەیت، وای لێدێت کە بەروارەکە ئێستایە.',
  },
  {
    question: 'چۆن کڕیارەکان بە جۆرەکان (Categories) دابەش بکەم؟',
    answer: 'کاتێک کڕیارێک زیاد دەکەیت یان دەستکاری دەکەیت، جۆرێک هەڵبژێرە (وەک خێزان، هاوڕێ، بازرگانی، هتد).',
  },
  {
    question: 'چۆن ڕەنگێک بە کڕیارێک زیاد بکەم؟',
    answer: 'کاتێک کڕیارێک زیاد دەکەیت یان دەستکاری دەکەیت، لە بەشی "ڕەنگی تاگ" ڕەنگێک هەڵبژێرە بۆ ناسینەوەی ئاسان.',
  },
  {
    question: 'چۆن نەخشەی کڕیاران بەکاربهێنم؟',
    answer: 'بڕۆ بۆ "نەخشەی کڕیاران" لە مێنووی سەرەکیدا. پێویستە شوێنکەوتن ڕێگەپێبدرێت بۆ ئەپەکە و شوێنکەوتنی کڕیارەکان زیاد بکەیت.',
  },
  {
    question: 'چۆن تایبەتمەندیەکانی AI بەکاربهێنم؟',
    answer: 'بڕۆ بۆ "تایبەتمەندیەکانی AI" لە مێنووی سەرەکیدا. دەتوانیت AI Chat، شیکاری قەرز، پێشبینی کاش فلۆ و زۆر شتی تر بەکاربهێنیت.',
  },
  {
    question: 'چۆن سیستەمی خاڵە و پاداشت چالاک بکەم؟',
    answer: 'بڕۆ بۆ "خاڵە و پاداشت" لە مێنووی سەرەکیدا. دەتوانیت خاڵە بە کڕیارەکان بدەیت و پاداشت دیاری بکەیت.',
  },
  {
    question: 'چۆن پلانی پارەدانی زیرەک دروست بکەم؟',
    answer: 'لەسەر کڕیارەکە کلیک بکە، پاشان "پلانی پارەدانی زیرەک". AI پێشنیاری باشترین پلانی پارەدان دەکات بەپێی باری کڕیارەکە.',
  },
  {
    question: 'چۆن پارەدانی دەنگی بەکاربهێنم؟',
    answer: 'بڕۆ بۆ "پارەدانی دەنگی" لە مێنووی سەرەکیدا. دوگمەی مایکرۆفۆن دابگرە و بە دەنگ ناو و بڕی پارە بڵێ.',
  },
  {
    question: 'زانیاریەکانم لەدەستدەدەن؟',
    answer: 'نەخێر! هەموو زانیاریەکان لە ئامێرەکەتدا هەڵدەگیرێن بە شێوەیەکی پارێزراو. ئەگەر Cloud Sync چالاک بکەیت، لە سێرڤەری پارێزراودا بە شفرەکردنی تەواو هەڵدەگیرێت.',
  },
];

function FAQItemComponent({ item }: { item: FAQItem }) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
        {expanded ? (
          <ChevronUp size={20} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.answerContainer}>
          <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function HelpFAQ() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'یارمەتی و پرسیارە باوەکان' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>پرسیارە باوەکان (FAQ)</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          وەڵامی پرسیارە باوەکان لە خوارەوە ببینە
        </Text>

        {faqs.map((faq, index) => (
          <FAQItemComponent key={index} item={faq} />
        ))}

        <View style={[styles.helpCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <Text style={[styles.helpTitle, { color: colors.text }]}>پێویستیت بە یارمەتیی زیاترە؟</Text>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            ئەگەر وەڵامی پرسیارەکەت نەدۆزییەوە، تکایە بڕۆ بۆ بەشی &ldquo;پشتگیری&rdquo; لە ڕێکخستنەکاندا یان پەیوەندیمان پێوە بکە.
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
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 8,
    textAlign: 'right' as const,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'right' as const,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden' as const,
  },
  faqHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right' as const,
    marginRight: 12,
  },
  answerContainer: {
    padding: 16,
    paddingTop: 0,
  },
  answer: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right' as const,
  },
  helpCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    textAlign: 'right' as const,
  },
  helpText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right' as const,
  },
  spacer: {
    height: 40,
  },
});
