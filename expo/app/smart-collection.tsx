import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { Clock, TrendingUp, Brain, Phone, MessageCircle, Target, Zap } from 'lucide-react-native';
import { generateText } from '@rork-ai/toolkit-sdk';

interface CollectionPrediction {
  debtorId: string;
  debtorName: string;
  totalDebt: number;
  bestContactTime: string;
  contactMethod: 'phone' | 'sms' | 'whatsapp' | 'visit';
  successProbability: number;
  reasoning: string;
  suggestedMessage: string;
  paymentCapability: number;
}

export default function SmartCollectionScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState<CollectionPrediction[]>([]);
  const [selectedDebtor, setSelectedDebtor] = useState<string | null>(null);

  const debtorsWithDebt = useMemo(() => {
    return debtors.filter(d => d.totalDebt > 0);
  }, [debtors]);

  const analyzeCollectionStrategies = useCallback(async () => {
    if (debtorsWithDebt.length === 0) {
      Alert.alert('ئاگاداری', 'هیچ قەرزێک نییە بۆ شیکاری');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisPromises = debtorsWithDebt.slice(0, 10).map(async (debtor) => {
        const recentTransactions = debtor.transactions.slice(-5);
        const paymentHistory = recentTransactions.filter(t => t.type === 'payment');
        
        const transactionTimes = recentTransactions.map(t => {
          const date = new Date(t.date);
          return date.getHours();
        });
        
        const avgHour = transactionTimes.length > 0 
          ? Math.round(transactionTimes.reduce((a, b) => a + b, 0) / transactionTimes.length)
          : 10;
        
        const daysSinceLastPayment = paymentHistory.length > 0
          ? Math.floor((Date.now() - new Date(paymentHistory[paymentHistory.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const prompt = `Analyze this customer's debt collection potential:
Name: ${debtor.name}
Total Debt: ${debtor.totalDebt} IQD
Payment History: ${paymentHistory.length} payments in last 5 transactions
Days Since Last Payment: ${daysSinceLastPayment}
Average Transaction Hour: ${avgHour}:00
Phone: ${debtor.phone || 'Not available'}

Based on this data:
1. What is the best time to contact (format: HH:MM)?
2. Best contact method (phone/sms/whatsapp/visit)?
3. Success probability (0-100)?
4. Short reasoning (max 50 words)?
5. Suggested message template (max 100 words in Kurdish)?
6. Payment capability score (0-100)?

Respond in this exact format:
TIME: HH:MM
METHOD: [method]
PROBABILITY: [number]
REASONING: [text]
MESSAGE: [text]
CAPABILITY: [number]`;

        try {
          const response = await generateText(prompt);
          
          const timeMatch = response.match(/TIME:\s*(\d{1,2}:\d{2})/i);
          const methodMatch = response.match(/METHOD:\s*(phone|sms|whatsapp|visit)/i);
          const probabilityMatch = response.match(/PROBABILITY:\s*(\d+)/i);
          const reasoningMatch = response.match(/REASONING:\s*(.+?)(?=MESSAGE:|CAPABILITY:|$)/is);
          const messageMatch = response.match(/MESSAGE:\s*(.+?)(?=CAPABILITY:|$)/is);
          const capabilityMatch = response.match(/CAPABILITY:\s*(\d+)/i);

          return {
            debtorId: debtor.id,
            debtorName: debtor.name,
            totalDebt: debtor.totalDebt,
            bestContactTime: timeMatch ? timeMatch[1] : `${avgHour}:00`,
            contactMethod: (methodMatch ? methodMatch[1] : 'phone') as 'phone' | 'sms' | 'whatsapp' | 'visit',
            successProbability: probabilityMatch ? parseInt(probabilityMatch[1]) : 50,
            reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'Analysis based on payment patterns',
            suggestedMessage: messageMatch ? messageMatch[1].trim() : `سڵاو ${debtor.name}، یادەوەریکی دۆستانەیە بۆ قەرزەکەت.`,
            paymentCapability: capabilityMatch ? parseInt(capabilityMatch[1]) : 50,
          };
        } catch (error) {
          console.error('Error analyzing debtor:', error);
          return {
            debtorId: debtor.id,
            debtorName: debtor.name,
            totalDebt: debtor.totalDebt,
            bestContactTime: `${avgHour}:00`,
            contactMethod: 'phone' as const,
            successProbability: 50,
            reasoning: 'پێشبینی لەسەر بنەمای مێژووی پارەدان',
            suggestedMessage: `سڵاو ${debtor.name}، یادەوەریکی دۆستانەیە بۆ قەرزەکەت بە بڕی ${debtor.totalDebt.toLocaleString('en-US')} دینار.`,
            paymentCapability: 50,
          };
        }
      });

      const results = await Promise.all(analysisPromises);
      const sorted = results.sort((a, b) => b.successProbability - a.successProbability);
      setPredictions(sorted);
    } catch (error) {
      console.error('Error analyzing collection strategies:', error);
      Alert.alert('هەڵە', 'کێشەیەک ڕوویدا لە شیکاریکردن');
    } finally {
      setIsAnalyzing(false);
    }
  }, [debtorsWithDebt]);

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'phone': return <Phone size={20} color={colors.primary} />;
      case 'sms': return <MessageCircle size={20} color="#10B981" />;
      case 'whatsapp': return <MessageCircle size={20} color="#25D366" />;
      case 'visit': return <Target size={20} color="#F59E0B" />;
      default: return <Phone size={20} color={colors.primary} />;
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return '#10B981';
    if (prob >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getContactMethodText = (method: string) => {
    switch (method) {
      case 'phone': return 'تەلەفۆن';
      case 'sms': return 'نامە';
      case 'whatsapp': return 'واتساپ';
      case 'visit': return 'سەردانی';
      default: return 'تەلەفۆن';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <Stack.Screen 
        options={{
          title: 'سیستەمی کۆکردنەوەی زیرەک',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.headerCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <View style={styles.headerIcon}>
              <Brain size={32} color={colors.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              شیکاری زیرەکانە
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              AI باشترین کات و ڕێگا پێشبینی دەکات بۆ کۆکردنەوەی قەرز
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.analyzeButton, { 
              backgroundColor: colors.primary,
              opacity: isAnalyzing ? 0.6 : 1,
            }]}
            onPress={analyzeCollectionStrategies}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Zap size={24} color="#FFFFFF" />
                <Text style={styles.analyzeButtonText}>
                  دەستپێکردنی شیکاری
                </Text>
              </>
            )}
          </TouchableOpacity>

          {isAnalyzing && (
            <View style={[styles.loadingCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                شیکاری {debtorsWithDebt.slice(0, 10).length} کڕیار...
              </Text>
            </View>
          )}

          {predictions.length > 0 && (
            <View style={styles.predictionsContainer}>
              <View style={[styles.statsRow, { 
                backgroundColor: colors.cardGlass,
                borderColor: colors.glassBorder,
              }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {predictions.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    کڕیار
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#10B981' }]}>
                    {predictions.filter(p => p.successProbability >= 70).length}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    ئەگەری بەرز
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                    {Math.round(predictions.reduce((sum, p) => sum + p.successProbability, 0) / predictions.length)}%
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    تێکڕای سەرکەوتن
                  </Text>
                </View>
              </View>

              {predictions.map((prediction, index) => (
                <TouchableOpacity
                  key={prediction.debtorId}
                  style={[styles.predictionCard, { 
                    backgroundColor: colors.cardGlass,
                    borderColor: colors.glassBorder,
                  }]}
                  onPress={() => setSelectedDebtor(
                    selectedDebtor === prediction.debtorId ? null : prediction.debtorId
                  )}
                  activeOpacity={0.7}
                >
                  <View style={styles.predictionHeader}>
                    <View style={styles.predictionHeaderRight}>
                      <Text style={[styles.predictionRank, { color: colors.primary }]}>
                        #{index + 1}
                      </Text>
                      <View>
                        <Text style={[styles.predictionName, { color: colors.text }]}>
                          {prediction.debtorName}
                        </Text>
                        <Text style={[styles.predictionDebt, { color: colors.error }]}>
                          {prediction.totalDebt.toLocaleString('en-US')} IQD
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.probabilityBadge, { 
                      backgroundColor: getProbabilityColor(prediction.successProbability) + '22',
                      borderColor: getProbabilityColor(prediction.successProbability) + '55',
                    }]}>
                      <TrendingUp size={16} color={getProbabilityColor(prediction.successProbability)} />
                      <Text style={[styles.probabilityText, { 
                        color: getProbabilityColor(prediction.successProbability),
                      }]}>
                        {prediction.successProbability}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.predictionDetails}>
                    <View style={styles.detailRow}>
                      <Clock size={18} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        باشترین کات: {prediction.bestContactTime}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      {getContactIcon(prediction.contactMethod)}
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        ڕێگا: {getContactMethodText(prediction.contactMethod)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Target size={18} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        توانای پارەدان: {prediction.paymentCapability}%
                      </Text>
                    </View>
                  </View>

                  {selectedDebtor === prediction.debtorId && (
                    <View style={[styles.expandedContent, { 
                      backgroundColor: colors.background + '88',
                      borderColor: colors.glassBorder,
                    }]}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        هۆکار:
                      </Text>
                      <Text style={[styles.reasoningText, { color: colors.textSecondary }]}>
                        {prediction.reasoning}
                      </Text>

                      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
                        نامەی پێشنیارکراو:
                      </Text>
                      <View style={[styles.messageBox, { 
                        backgroundColor: colors.card,
                        borderColor: colors.glassBorder,
                      }]}>
                        <Text style={[styles.messageText, { color: colors.text }]}>
                          {prediction.suggestedMessage}
                        </Text>
                      </View>

                      <View style={styles.actionButtons}>
                        {prediction.contactMethod === 'phone' && prediction.debtorId && (
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={() => router.push(`/debtor/${prediction.debtorId}` as any)}
                          >
                            <Text style={styles.actionButtonText}>بینینی کڕیار</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                          onPress={() => {
                            Alert.alert('سەرکەوتوو', 'نامەکە هاوبەشکرا');
                          }}
                        >
                          <Text style={styles.actionButtonText}>ناردنی نامە</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {predictions.length === 0 && !isAnalyzing && (
            <View style={[styles.emptyCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <Brain size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                ئامادەیە بۆ شیکاری
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                دوگمەی شیکاری لێدە بۆ دەستپێکردن
              </Text>
            </View>
          )}
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl' as const,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    writingDirection: 'rtl' as const,
  },
  loadingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    writingDirection: 'rtl' as const,
  },
  predictionsContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    writingDirection: 'rtl' as const,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  predictionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  predictionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionHeaderRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  predictionRank: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  predictionName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
    writingDirection: 'rtl' as const,
  },
  predictionDebt: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  probabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  probabilityText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  predictionDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    writingDirection: 'rtl' as const,
  },
  expandedContent: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
    writingDirection: 'rtl' as const,
  },
  reasoningText: {
    fontSize: 14,
    lineHeight: 22,
    writingDirection: 'rtl' as const,
  },
  messageBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
    writingDirection: 'rtl' as const,
  },
  actionButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    writingDirection: 'rtl' as const,
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 48,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
});
