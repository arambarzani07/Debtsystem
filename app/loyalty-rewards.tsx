import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import {
  Gift,
  Award,
  Crown,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import {
  getRewards,
  getLoyaltyTier,
  getPointsForNextReward,
  type LoyaltyReward,
} from '@/utils/loyaltyPoints';

export default function LoyaltyRewardsScreen() {
  const { debtors } = useDebt();
  const { colors } = useTheme();
  const router = useRouter();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    const loaded = await getRewards();
    setRewards(loaded);
  };

  const topLoyaltyCustomers = useMemo(() => {
    return [...debtors]
      .filter(d => d.loyaltyPoints && d.loyaltyPoints > 0)
      .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
      .slice(0, 10);
  }, [debtors]);

  const totalPointsDistributed = useMemo(() => {
    return debtors.reduce((sum, d) => sum + (d.loyaltyPoints || 0), 0);
  }, [debtors]);

  const getTierIcon = (tierName: string) => {
    if (tierName.includes('زێڕین')) return <Crown size={24} color="#FFD700" />;
    if (tierName.includes('زیو')) return <Award size={24} color="#C0C0C0" />;
    if (tierName.includes('برۆنز')) return <Award size={24} color="#CD7F32" />;
    return <Star size={24} color="#6B7280" />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>سیستەمی خاڵ و داشکاندن</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              پاداشت بۆ کڕیارە دڵسۆزەکان
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <Gift size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>کۆی خاڵە دابەشکراوەکان</Text>
            </View>
            <Text style={[styles.totalPoints, { color: colors.primary }]}>
              {totalPointsDistributed.toLocaleString('en-US')} خاڵ
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>باشترین کڕیاران</Text>
            </View>
            {topLoyaltyCustomers.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  هیچ کڕیارێک خاڵی نییە
                </Text>
              </View>
            ) : (
              topLoyaltyCustomers.map((debtor, index) => {
                const tier = getLoyaltyTier(debtor.loyaltyPoints || 0);
                const nextReward = getPointsForNextReward(debtor.loyaltyPoints || 0, rewards);
                
                return (
                  <TouchableOpacity
                    key={debtor.id}
                    style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => router.push({ pathname: '/debtor/[id]', params: { id: debtor.id } } as any)}
                  >
                    <View style={styles.customerRank}>
                      <Text style={[styles.rankNumber, { color: colors.text }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <View style={styles.customerNameRow}>
                        <Text style={[styles.customerName, { color: colors.text }]}>{debtor.name}</Text>
                        <View style={[styles.tierBadge, { backgroundColor: tier.color + '20' }]}>
                          {getTierIcon(tier.name)}
                          <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                        </View>
                      </View>
                      <View style={styles.customerStats}>
                        <Text style={[styles.pointsText, { color: colors.primary }]}>
                          {debtor.loyaltyPoints?.toLocaleString('en-US')} خاڵ
                        </Text>
                        {nextReward && (
                          <Text style={[styles.nextRewardText, { color: colors.textSecondary }]}>
                            {nextReward.pointsNeeded} خاڵی تر بۆ: {nextReward.reward.name}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Gift size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>پاداشتە بەردەستەکان</Text>
            </View>
            {rewards.filter(r => r.isActive).map(reward => (
              <View
                key={reward.id}
                style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={styles.rewardHeader}>
                  <Text style={[styles.rewardName, { color: colors.text }]}>{reward.name}</Text>
                  <View style={[styles.rewardCost, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.rewardCostText, { color: colors.primary }]}>
                      {reward.pointsCost} خاڵ
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rewardDescription, { color: colors.textSecondary }]}>
                  {reward.description}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>چۆنیەتی وەرگرتنی خاڵ</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  • هەر ١٠٠٠ دینار پارەدان = ١ خاڵ
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  • کڕیارانی VIP خاڵی دووبەرابەر وەردەگرن
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  • خاڵەکان بۆ ماوەی ١ ساڵ دەمێننەوە
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>پلەکانی دڵسۆزی</Text>
            <View style={[styles.tiersCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.tierItem}>
                <Crown size={20} color="#FFD700" />
                <Text style={[styles.tierItemText, { color: colors.text }]}>VIP زێڕین</Text>
                <Text style={[styles.tierItemPoints, { color: colors.textSecondary }]}>٥٠٠+ خاڵ</Text>
              </View>
              <View style={styles.tierItem}>
                <Award size={20} color="#C0C0C0" />
                <Text style={[styles.tierItemText, { color: colors.text }]}>VIP زیو</Text>
                <Text style={[styles.tierItemPoints, { color: colors.textSecondary }]}>٣٠٠+ خاڵ</Text>
              </View>
              <View style={styles.tierItem}>
                <Award size={20} color="#CD7F32" />
                <Text style={[styles.tierItemText, { color: colors.text }]}>VIP برۆنز</Text>
                <Text style={[styles.tierItemPoints, { color: colors.textSecondary }]}>١٠٠+ خاڵ</Text>
              </View>
              <View style={styles.tierItem}>
                <Star size={20} color="#6B7280" />
                <Text style={[styles.tierItemText, { color: colors.text }]}>ئاسایی</Text>
                <Text style={[styles.tierItemPoints, { color: colors.textSecondary }]}>&lt; ١٠٠ خاڵ</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  totalPoints: {
    fontSize: 32,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  customerCard: {
    flexDirection: 'row-reverse',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16,
  },
  customerRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6' as const,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF' as const,
  },
  customerInfo: {
    flex: 1,
    gap: 8,
  },
  customerNameRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  tierBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tierName: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  customerStats: {
    gap: 4,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  nextRewardText: {
    fontSize: 12,
    textAlign: 'right',
  },
  rewardCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  rewardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  rewardCost: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rewardCostText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  rewardDescription: {
    fontSize: 14,
    textAlign: 'right',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row-reverse',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'right',
  },
  tiersCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  tierItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  tierItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right',
  },
  tierItemPoints: {
    fontSize: 14,
  },
});
