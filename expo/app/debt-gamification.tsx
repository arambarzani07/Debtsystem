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
  Trophy,
  Award,
  Target,
  Zap,
  Gift,
  Star,
  TrendingUp,
} from 'lucide-react-native';

export default function DebtGamificationScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const gamificationFeatures = [
    {
      id: 'rewards',
      title: 'پاداشتی دڵسۆزی',
      description: 'خاڵی پاداشت بۆ پارەدانی بەردەوام',
      icon: Gift,
      color: '#EC4899',
      route: '/loyalty-rewards',
    },
    {
      id: 'success',
      title: 'چیرۆکی سەرکەوتن',
      description: 'بینینی سەرکەوتنەکان و ئامانجەکان',
      icon: Trophy,
      color: '#22C55E',
      route: '/success-stories',
    },
    {
      id: 'achievements',
      title: 'دەستکەوتەکان',
      description: 'بەدەستهێنانی باج و دەستکەوت',
      icon: Award,
      color: '#6366F1',
      status: 'بەزووانە',
    },
    {
      id: 'challenges',
      title: 'ڕکابەری و چالێنج',
      description: 'چالێنجی پارەدانەوە',
      icon: Target,
      color: '#8B5CF6',
      status: 'بەزووانە',
    },
    {
      id: 'streaks',
      title: 'زنجیرەی بەردەوامی',
      description: 'بەردەوامبوون لە پارەدانەوە',
      icon: Zap,
      color: '#F59E0B',
      status: 'بەزووانە',
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
            <Text style={[styles.title, { color: colors.text }]}>گەیمیفیکەیشن</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Trophy size={40} color={colors.warning} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              سیستەمی پاداشت
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              هانی کڕیاران بدە بۆ پارەدانەوەی بەردەوام لە ڕێگەی پاداشت و دەستکەوتەوە
            </Text>
          </View>

          {gamificationFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, { 
                backgroundColor: colors.cardGlass,
                borderColor: colors.glassBorder,
                opacity: feature.status === 'بەزووانە' ? 0.6 : 1,
              }]}
              onPress={() => {
                if (feature.route) {
                  router.push(feature.route as any);
                }
              }}
              disabled={feature.status === 'بەزووانە'}
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
                {feature.status && (
                  <View style={[styles.statusBadge, { backgroundColor: colors.warningGlass }]}>
                    <Text style={[styles.statusText, { color: colors.warning }]}>
                      {feature.status}
                    </Text>
                  </View>
                )}
              </View>
              {feature.route && (
                <ChevronLeft size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}

          <View style={[styles.statsCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>ئامارەکان</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Star size={24} color={colors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>خاڵ</Text>
              </View>
              <View style={styles.statItem}>
                <Award size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>دەستکەوت</Text>
              </View>
              <View style={styles.statItem}>
                <TrendingUp size={24} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>پلە</Text>
              </View>
            </View>
          </View>
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statsCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    marginTop: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 13,
  },
});
