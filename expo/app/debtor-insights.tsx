import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  TrendingUp, Brain, Heart, Zap, Shield, 
  Activity, Star,
  ChevronRight, Sparkles
} from 'lucide-react-native';

export default function DebtorInsightsScreen() {
  const { id } = useLocalSearchParams();
  const { getDebtor, debtors } = useDebt();
  const { colors } = useTheme();
  const router = useRouter();
  const debtor = id ? getDebtor(id as string) : null;

  const [scaleAnim] = useState(new Animated.Value(1));

  const insights = useMemo(() => {
    if (!debtor) return null;

    const transactions = debtor.transactions;
    const debtTransactions = transactions.filter(t => t.type === 'debt');
    const paymentTransactions = transactions.filter(t => t.type === 'payment');
    
    const avgDebtAmount = debtTransactions.length > 0 
      ? debtTransactions.reduce((sum, t) => sum + t.amount, 0) / debtTransactions.length 
      : 0;
    
    const avgPaymentAmount = paymentTransactions.length > 0 
      ? paymentTransactions.reduce((sum, t) => sum + t.amount, 0) / paymentTransactions.length 
      : 0;

    const totalDebt = debtTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPaid = paymentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const paymentRatio = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;

    const lastTransactionDate = transactions.length > 0 
      ? new Date(transactions[transactions.length - 1].date)
      : null;
    
    const daysSinceLastTransaction = lastTransactionDate 
      ? Math.floor((Date.now() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const paymentFrequency = paymentTransactions.length;
    const debtFrequency = debtTransactions.length;
    
    const activityScore = Math.min(100, (paymentFrequency + debtFrequency) * 5);
    
    const reliabilityScore = Math.min(100, paymentRatio);
    
    const engagementScore = daysSinceLastTransaction !== null && daysSinceLastTransaction < 30 
      ? Math.max(0, 100 - daysSinceLastTransaction * 3)
      : 0;

    const loyaltyPoints = debtor.loyaltyPoints || 0;

    let personalityType = '';
    let personalityIcon = Brain;
    let personalityColor = '#8B5CF6';
    let personalityDescription = '';

    if (paymentRatio > 90 && paymentFrequency > 5) {
      personalityType = 'پارەدەرەوەی نموونەیی';
      personalityIcon = Star;
      personalityColor = '#FFD700';
      personalityDescription = 'هەمیشە لە کاتی خۆیدا پارە دەداتەوە و باوەڕپێکراوە';
    } else if (paymentRatio > 70) {
      personalityType = 'پارەدەرەوەی باش';
      personalityIcon = Heart;
      personalityColor = '#10B981';
      personalityDescription = 'بە شێوەیەکی باش پارە دەداتەوە و متمانەپێکراوە';
    } else if (paymentRatio > 40) {
      personalityType = 'پارەدەرەوەی ناوەند';
      personalityIcon = Activity;
      personalityColor = '#F59E0B';
      personalityDescription = 'هەندێک جار درەنگ دەکەوێت بەڵام دەیداتەوە';
    } else if (debtFrequency > paymentFrequency * 2) {
      personalityType = 'قەرزگری زیاتر';
      personalityIcon = TrendingUp;
      personalityColor = '#EF4444';
      personalityDescription = 'زیاتر قەرز دەکات لە پارەدانەوە';
    } else {
      personalityType = 'قەرزگری نوێ';
      personalityIcon = Sparkles;
      personalityColor = '#3B82F6';
      personalityDescription = 'هێشتا زانیاری کەم هەیە';
    }

    const trustScore = Math.floor((reliabilityScore * 0.5) + (engagementScore * 0.3) + (activityScore * 0.2));

    return {
      avgDebtAmount,
      avgPaymentAmount,
      paymentRatio,
      daysSinceLastTransaction,
      activityScore,
      reliabilityScore,
      engagementScore,
      trustScore,
      personalityType,
      personalityIcon,
      personalityColor,
      personalityDescription,
      loyaltyPoints,
      totalTransactions: transactions.length,
      debtCount: debtFrequency,
      paymentCount: paymentFrequency,
    };
  }, [debtor]);

  if (!id || !debtor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>شیکاری کەسایەتی</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>هەڵبژاردنی کڕیار</Text>
            </View>
            
            {debtors.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.debtorListItem, { 
                  backgroundColor: colors.cardGlass,
                  borderColor: colors.glassBorder,
                }]}
                onPress={() => router.push(`/debtor-insights?id=${d.id}` as any)}
              >
                <View style={styles.debtorInfo}>
                  <Text style={[styles.debtorName, { color: colors.text }]}>{d.name}</Text>
                  <Text style={[styles.debtorDebt, { color: d.totalDebt > 0 ? colors.error : colors.success }]}>
                    {Math.abs(d.totalDebt).toLocaleString('en-US')}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: colors.primaryGlass,
                borderColor: colors.primary,
                marginTop: 20,
              }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>گەڕانەوە</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
  
  if (!insights) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.errorText, { color: colors.error }]}>هەڵە لە باکردنی زانیاریەکان</Text>
      </View>
    );
  }

  const PersonalityIcon = insights.personalityIcon;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>شیکاری کەسایەتی</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{debtor.name}</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <LinearGradient
                colors={[insights.personalityColor + '30', insights.personalityColor + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.personalityCard, { 
                  borderColor: insights.personalityColor + '50',
                }]}
              >
                <PersonalityIcon size={64} color={insights.personalityColor} />
                <Text style={[styles.personalityType, { color: insights.personalityColor }]}>
                  {insights.personalityType}
                </Text>
                <Text style={[styles.personalityDescription, { color: colors.textSecondary }]}>
                  {insights.personalityDescription}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={[styles.trustScoreCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <View style={styles.trustScoreHeader}>
              <Shield size={28} color="#3B82F6" />
              <Text style={[styles.trustScoreTitle, { color: colors.text }]}>نمرەی باوەڕ</Text>
            </View>
            <View style={styles.trustScoreValueContainer}>
              <Text style={styles.trustScoreValue}>{insights.trustScore}</Text>
              <Text style={[styles.trustScoreMax, { color: colors.textTertiary }]}>/100</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.cardBorder }]}>
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${insights.trustScore}%` }]}
              />
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#10B98140' }]}>
                <TrendingUp size={24} color="#10B981" />
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {insights.paymentRatio.toFixed(0)}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                ڕێژەی پارەدانەوە
              </Text>
            </View>

            <View style={[styles.metricCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#F59E0B40' }]}>
                <Activity size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {insights.activityScore}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                چالاکی
              </Text>
            </View>

            <View style={[styles.metricCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#EC489940' }]}>
                <Heart size={24} color="#EC4899" />
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {insights.reliabilityScore.toFixed(0)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                متمانەپێکراوی
              </Text>
            </View>

            <View style={[styles.metricCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <View style={[styles.metricIconContainer, { backgroundColor: '#8B5CF640' }]}>
                <Zap size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {insights.engagementScore.toFixed(0)}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                بەشداری
              </Text>
            </View>
          </View>

          <View style={[styles.statsCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>ئاماری تایبەت</Text>
            
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {insights.avgDebtAmount.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                ناوەندی قەرز
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {insights.avgPaymentAmount.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                ناوەندی پارەدانەوە
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {insights.totalTransactions}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                کۆی مامەڵەکان
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: insights.daysSinceLastTransaction && insights.daysSinceLastTransaction > 30 ? colors.error : colors.success }]}>
                {insights.daysSinceLastTransaction !== null ? `${insights.daysSinceLastTransaction} ڕۆژ` : 'نەزانراو'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                کۆتا مامەڵە
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: '#FFD700' }]}>
                {insights.loyaltyPoints}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                خاڵی دڵسۆزی
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: colors.primaryGlass,
              borderColor: colors.primary,
            }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              گەڕانەوە
            </Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  personalityCard: {
    borderRadius: 32,
    borderWidth: 2,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  personalityType: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  personalityDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  trustScoreCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  trustScoreHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  trustScoreTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  trustScoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  trustScoreValue: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  trustScoreMax: {
    fontSize: 24,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  metricIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 20,
    textAlign: 'right',
  },
  statRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  actionButton: {
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  debtorListItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  debtorInfo: {
    flex: 1,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12,
  },
  debtorName: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  debtorDebt: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
