import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  BrainCircuit,
  Sparkles,
  Brain,
  Target,
  Shield,
} from 'lucide-react-native';

export default function AIFeaturesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const aiFeatures = [
    {
      id: 'ai-chat',
      title: 'AI چات',
      description: 'گفتووگۆ لەگەڵ AI بۆ ڕاوێژ و یارمەتی',
      icon: BrainCircuit,
      color: '#6366F1',
      route: '/ai-chat',
    },
    {
      id: 'ai-analysis',
      title: 'شیکاری AI',
      description: 'شیکاری قەرزەکان بە هۆشی دەستکرد',
      icon: Brain,
      color: '#9333EA',
      route: '/ai-debt-analysis',
    },
    {
      id: 'debtor-insights',
      title: 'تێگەیشتنی قەرزار',
      description: 'زانیاری و پێشبینی لەسەر قەرزداران',
      icon: Target,
      color: '#F59E0B',
      route: '/debtor-insights',
    },
    {
      id: 'fraud-detection',
      title: 'دۆزینەوەی فریودان',
      description: 'سیستەمی AI بۆ دۆزینەوەی فریودان',
      icon: Shield,
      color: '#EF4444',
      route: '/advanced-fraud-detection',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>تایبەتمەندیەکانی AI</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Sparkles size={32} color={colors.warning} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              هۆشی دەستکرد
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              تایبەتمەندیەکانی AI یارمەتیت دەدەن بۆ بەڕێوەبردنی باشتری قەرزەکان و وەرگرتنی بڕیاری زیرەکانە
            </Text>
          </View>

          {aiFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, { 
                backgroundColor: colors.cardGlass,
                borderColor: colors.glassBorder,
              }]}
              onPress={() => router.push(feature.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${feature.color}20` }]}>
                <feature.icon size={32} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-end',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  featureDescription: {
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 20,
  },
});
