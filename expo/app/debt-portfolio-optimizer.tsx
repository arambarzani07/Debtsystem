import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Debtor } from '@/types';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OptimizationStrategy {
  id: string;
  name: string;
  nameKu: string;
  description: string;
  descriptionKu: string;
  priority: 'high' | 'medium' | 'low';
  impact: number;
  difficulty: number;
  expectedReturn: number;
  timeframe: string;
  timeframeKu: string;
  icon: string;
  color: string;
}

interface PortfolioMetrics {
  totalDebt: number;
  weightedAge: number;
  diversificationScore: number;
  riskScore: number;
  recoveryRate: number;
  optimizationPotential: number;
}

export default function DebtPortfolioOptimizer() {
  const { debtors } = useDebt();
  const { language } = useLanguage();
  const { settings } = useTheme();
  
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [strategies, setStrategies] = useState<OptimizationStrategy[]>([]);

  const activeDebts = debtors.filter((d: Debtor) => d.totalDebt > 0);

  const analyzePortfolio = () => {
    setAnalyzing(true);
    
    setTimeout(() => {
      const totalDebt = activeDebts.reduce((sum: number, d: Debtor) => sum + d.totalDebt, 0);
      const avgAge = activeDebts.reduce((sum: number, d: Debtor) => {
        const daysSinceCreation = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysSinceCreation;
      }, 0) / (activeDebts.length || 1);
      
      const totalAmount = activeDebts.reduce((sum: number, d: Debtor) => sum + d.totalDebt, 0);
      const totalPaid = activeDebts.reduce((sum: number, d: Debtor) => {
        return sum + d.transactions.filter(t => t.type === 'payment').reduce((s: number, t) => s + t.amount, 0);
      }, 0);
      const recoveryRate = totalAmount > 0 ? (totalPaid / (totalAmount + totalPaid)) * 100 : 0;
      
      const debtGroups = new Set(activeDebts.map((d: Debtor) => Math.floor(d.totalDebt / 10000)));
      const diversificationScore = Math.min((debtGroups.size / activeDebts.length) * 100, 100);
      
      const highRiskCount = activeDebts.filter((d: Debtor) => {
        const days = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const totalPaidDebtor = d.transactions.filter(t => t.type === 'payment').reduce((s: number, t) => s + t.amount, 0);
        return days > 90 && totalPaidDebtor === 0;
      }).length;
      const riskScore = (highRiskCount / (activeDebts.length || 1)) * 100;
      
      const optimizationPotential = Math.min(
        (riskScore * 0.4 + (100 - diversificationScore) * 0.3 + (100 - recoveryRate) * 0.3),
        100
      );

      setMetrics({
        totalDebt,
        weightedAge: avgAge,
        diversificationScore,
        riskScore,
        recoveryRate,
        optimizationPotential,
      });

      const generatedStrategies: OptimizationStrategy[] = [];

      if (riskScore > 50) {
        generatedStrategies.push({
          id: 'high-risk-focus',
          name: 'High-Risk Debt Prioritization',
          nameKu: 'گرنگی دان بە قەرزە مەترسیدارەکان',
          description: 'Focus collection efforts on high-risk debts over 90 days old with zero payment',
          descriptionKu: 'سەرنجدان بە قەرزە مەترسیدارەکانی سەروو 90 ڕۆژ بە بێ پارەدان',
          priority: 'high',
          impact: 85,
          difficulty: 60,
          expectedReturn: riskScore * totalDebt * 0.3 / 100,
          timeframe: '30-45 days',
          timeframeKu: '30-45 ڕۆژ',
          icon: 'alert',
          color: '#ef4444',
        });
      }

      if (recoveryRate < 60) {
        generatedStrategies.push({
          id: 'recovery-boost',
          name: 'Recovery Rate Enhancement',
          nameKu: 'بەرزکردنەوەی ڕێژەی گەڕاندنەوە',
          description: 'Implement aggressive collection campaigns and incentive programs',
          descriptionKu: 'جێبەجێکردنی کەمپەینی کۆکردنەوەی توند و بەرنامەی هاندان',
          priority: 'high',
          impact: 90,
          difficulty: 70,
          expectedReturn: totalDebt * (0.6 - recoveryRate / 100) * 0.5,
          timeframe: '60-90 days',
          timeframeKu: '60-90 ڕۆژ',
          icon: 'trending',
          color: '#f59e0b',
        });
      }

      if (diversificationScore < 50) {
        generatedStrategies.push({
          id: 'portfolio-balance',
          name: 'Portfolio Rebalancing',
          nameKu: 'هاوسەنگکردنەوەی پۆرتفۆلیۆ',
          description: 'Diversify debt portfolio by targeting different customer segments',
          descriptionKu: 'جۆراوجۆرکردنی پۆرتفۆلیۆی قەرز بە ئامانجگرتنی بەشە جیاوازەکانی کڕیار',
          priority: 'medium',
          impact: 65,
          difficulty: 50,
          expectedReturn: totalDebt * 0.15,
          timeframe: '90-120 days',
          timeframeKu: '90-120 ڕۆژ',
          icon: 'chart',
          color: '#8b5cf6',
        });
      }

      generatedStrategies.push({
        id: 'ai-segmentation',
        name: 'AI-Powered Customer Segmentation',
        nameKu: 'پۆلێنکردنی کڕیاران بە AI',
        description: 'Use machine learning to segment customers and personalize collection strategies',
        descriptionKu: 'بەکارهێنانی فێربوونی ئامێر بۆ پۆلێنکردنی کڕیاران و تایبەتکردنی ستراتیژی کۆکردنەوە',
        priority: 'high',
        impact: 95,
        difficulty: 80,
        expectedReturn: totalDebt * 0.25,
        timeframe: '45-60 days',
        timeframeKu: '45-60 ڕۆژ',
        icon: 'sparkles',
        color: '#06b6d4',
      });

      generatedStrategies.push({
        id: 'payment-plan-optimizer',
        name: 'Smart Payment Plan Optimizer',
        nameKu: 'باشکردنی پلانی پارەدانی زیرەک',
        description: 'Optimize payment plans based on customer behavior and payment history',
        descriptionKu: 'باشکردنی پلانەکانی پارەدان بەپێی ڕەفتاری کڕیار و مێژووی پارەدان',
        priority: 'medium',
        impact: 75,
        difficulty: 55,
        expectedReturn: totalDebt * 0.18,
        timeframe: '30-60 days',
        timeframeKu: '30-60 ڕۆژ',
        icon: 'target',
        color: '#10b981',
      });

      generatedStrategies.push({
        id: 'early-intervention',
        name: 'Early Intervention Program',
        nameKu: 'بەرنامەی دەستێوەردانی پێشوەختە',
        description: 'Identify and intervene with at-risk accounts before they become problematic',
        descriptionKu: 'ناسینەوە و دەستێوەردان لە هەژمارە مەترسیدارەکان پێش ئەوەی ببنە کێشە',
        priority: 'high',
        impact: 88,
        difficulty: 65,
        expectedReturn: totalDebt * 0.22,
        timeframe: '15-30 days',
        timeframeKu: '15-30 ڕۆژ',
        icon: 'zap',
        color: '#ec4899',
      });

      setStrategies(generatedStrategies.sort((a, b) => b.impact - a.impact));
      setAnalyzing(false);
    }, 2000);
  };

  const getIconComponent = (iconName: string, color: string, size: number) => {
    const props = { color, size };
    switch (iconName) {
      case 'alert': return <AlertTriangle {...props} />;
      case 'trending': return <TrendingUp {...props} />;
      case 'chart': return <BarChart3 {...props} />;
      case 'sparkles': return <Sparkles {...props} />;
      case 'target': return <Target {...props} />;
      case 'zap': return <Zap {...props} />;
      default: return <CheckCircle {...props} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const isDark = settings.theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: language === 'ku' ? 'باشکردنی پۆرتفۆلیۆی قەرز' : 'Debt Portfolio Optimizer',
          headerStyle: { backgroundColor: cardBg },
          headerTintColor: textColor,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: '#8b5cf6' }]}>
          <View style={styles.heroContent}>
            <PieChartIcon color="#ffffff" size={48} />
            <Text style={styles.heroTitle}>
              {language === 'ku' ? 'باشکردنی پۆرتفۆلیۆ' : 'Portfolio Optimizer'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {language === 'ku' 
                ? 'باشترین ستراتیژەکان بۆ بەڕێوەبردنی قەرزەکانت' 
                : 'Best strategies for managing your debt portfolio'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {!metrics ? (
            <View style={[styles.analyzeCard, { backgroundColor: cardBg, borderColor }]}>
              <Sparkles color="#8b5cf6" size={64} />
              <Text style={[styles.analyzeTitle, { color: textColor }]}>
                {language === 'ku' ? 'شیکردنەوەی پۆرتفۆلیۆ' : 'Analyze Portfolio'}
              </Text>
              <Text style={[styles.analyzeDescription, { color: subTextColor }]}>
                {language === 'ku'
                  ? `شیکردنەوەی ${activeDebts.length} قەرزی چالاک و دۆزینەوەی ستراتیژی باشترین`
                  : `Analyze ${activeDebts.length} active debts and find the best strategies`}
              </Text>
              <TouchableOpacity
                style={[styles.analyzeButton, analyzing && styles.analyzingButton]}
                onPress={analyzePortfolio}
                disabled={analyzing}
              >
                {analyzing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Sparkles color="#ffffff" size={20} />
                    <Text style={styles.analyzeButtonText}>
                      {language === 'ku' ? 'دەستپێکردنی شیکردنەوە' : 'Start Analysis'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.metricsGrid, { marginBottom: 20 }]}>
                <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor }]}>
                  <DollarSign color="#8b5cf6" size={24} />
                  <Text style={[styles.metricValue, { color: textColor }]}>
                    {metrics.totalDebt.toLocaleString()}
                  </Text>
                  <Text style={[styles.metricLabel, { color: subTextColor }]}>
                    {language === 'ku' ? 'کۆی قەرز' : 'Total Debt'}
                  </Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor }]}>
                  <TrendingUp color="#10b981" size={24} />
                  <Text style={[styles.metricValue, { color: textColor }]}>
                    {metrics.recoveryRate.toFixed(1)}%
                  </Text>
                  <Text style={[styles.metricLabel, { color: subTextColor }]}>
                    {language === 'ku' ? 'ڕێژەی گەڕاندنەوە' : 'Recovery Rate'}
                  </Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor }]}>
                  <AlertTriangle color="#ef4444" size={24} />
                  <Text style={[styles.metricValue, { color: textColor }]}>
                    {metrics.riskScore.toFixed(0)}%
                  </Text>
                  <Text style={[styles.metricLabel, { color: subTextColor }]}>
                    {language === 'ku' ? 'ئاستی مەترسی' : 'Risk Score'}
                  </Text>
                </View>

                <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor }]}>
                  <Sparkles color="#f59e0b" size={24} />
                  <Text style={[styles.metricValue, { color: textColor }]}>
                    {metrics.optimizationPotential.toFixed(0)}%
                  </Text>
                  <Text style={[styles.metricLabel, { color: subTextColor }]}>
                    {language === 'ku' ? 'توانای باشکردن' : 'Optimization'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {language === 'ku' ? 'ستراتیژە پێشنیارکراوەکان' : 'Recommended Strategies'}
              </Text>

              {strategies.map((strategy, index) => (
                <TouchableOpacity
                  key={strategy.id}
                  style={[
                    styles.strategyCard,
                    { backgroundColor: cardBg, borderColor },
                    selectedStrategy === strategy.id && styles.selectedStrategy,
                  ]}
                  onPress={() => setSelectedStrategy(strategy.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.strategyHeader}>
                    <View style={[styles.strategyIconContainer, { backgroundColor: strategy.color + '20' }]}>
                      {getIconComponent(strategy.icon, strategy.color, 24)}
                    </View>
                    <View style={styles.strategyHeaderText}>
                      <Text style={[styles.strategyName, { color: textColor }]}>
                        {language === 'ku' ? strategy.nameKu : strategy.name}
                      </Text>
                      <View style={styles.strategyMeta}>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(strategy.priority) + '20' }]}>
                          <Text style={[styles.priorityText, { color: getPriorityColor(strategy.priority) }]}>
                            {strategy.priority.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.timeframe, { color: subTextColor }]}>
                          ⏱️ {language === 'ku' ? strategy.timeframeKu : strategy.timeframe}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.strategyDescription, { color: subTextColor }]}>
                    {language === 'ku' ? strategy.descriptionKu : strategy.description}
                  </Text>

                  <View style={styles.strategyMetrics}>
                    <View style={styles.strategyMetricItem}>
                      <Text style={[styles.strategyMetricLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'کاریگەری' : 'Impact'}
                      </Text>
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBar, 
                            { width: `${strategy.impact}%`, backgroundColor: strategy.color }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.strategyMetricValue, { color: textColor }]}>
                        {strategy.impact}%
                      </Text>
                    </View>

                    <View style={styles.strategyMetricItem}>
                      <Text style={[styles.strategyMetricLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'گەڕانەوەی چاوەڕوانکراو' : 'Expected Return'}
                      </Text>
                      <Text style={[styles.expectedReturn, { color: '#10b981' }]}>
                        +{strategy.expectedReturn.toLocaleString()} IQD
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={[styles.implementButton, { backgroundColor: strategy.color }]}>
                    <Text style={styles.implementButtonText}>
                      {language === 'ku' ? 'جێبەجێکردن' : 'Implement Strategy'}
                    </Text>
                    <ArrowRight color="#ffffff" size={18} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#e0e7ff',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  analyzeCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  analyzeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  analyzeDescription: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  analyzingButton: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  strategyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  selectedStrategy: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  strategyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  strategyName: {
    fontSize: 17,
    fontWeight: '700',
  },
  strategyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeframe: {
    fontSize: 12,
  },
  strategyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  strategyMetrics: {
    gap: 12,
    marginBottom: 16,
  },
  strategyMetricItem: {
    gap: 6,
  },
  strategyMetricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  strategyMetricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  expectedReturn: {
    fontSize: 18,
    fontWeight: '800',
  },
  implementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  implementButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
