import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Debtor, Transaction } from '@/types';
import {
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Users,
  Eye,
  Shield,
  Lock,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';

interface FraudAlert {
  id: string;
  debtorId: string;
  debtorName: string;
  type: 'duplicate' | 'unusual_pattern' | 'suspicious_timing' | 'amount_anomaly' | 'rapid_changes';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  descriptionKu: string;
  confidence: number;
  detectedAt: string;
  details: string[];
  detailsKu: string[];
  recommendation: string;
  recommendationKu: string;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
}

interface FraudStats {
  totalAlerts: number;
  highRiskAlerts: number;
  protectedAmount: number;
  detectionRate: number;
}

export default function AdvancedFraudDetection() {
  const { debtors } = useDebt();
  const { language } = useLanguage();
  const { settings } = useTheme();

  const [analyzing, setAnalyzing] = useState(false);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const analyzeForFraud = () => {
    setAnalyzing(true);

    setTimeout(() => {
      const detectedAlerts: FraudAlert[] = [];

      debtors.forEach((debtor: Debtor) => {
        if (debtor.transactions.length === 0) return;

        const amounts = debtor.transactions.map(t => t.amount);
        const dates = debtor.transactions.map(t => new Date(t.date).getTime());
        const avgAmount = amounts.reduce((sum: number, a: number) => sum + a, 0) / amounts.length;

        debtor.transactions.forEach((transaction: Transaction, index: number) => {
          if (transaction.amount > avgAmount * 3) {
            detectedAlerts.push({
              id: `${debtor.id}-${transaction.id}-amount`,
              debtorId: debtor.id,
              debtorName: debtor.name,
              type: 'amount_anomaly',
              severity: transaction.amount > avgAmount * 5 ? 'high' : 'medium',
              description: `Unusual transaction amount: ${transaction.amount.toLocaleString()} IQD (${Math.round((transaction.amount / avgAmount) * 100)}% of average)`,
              descriptionKu: `بڕی نائاسایی مامەڵە: ${transaction.amount.toLocaleString()} IQD (${Math.round((transaction.amount / avgAmount) * 100)}% لە ناوەندی)`,
              confidence: Math.min(95, 60 + (transaction.amount / avgAmount) * 10),
              detectedAt: new Date().toISOString(),
              details: [
                `Transaction amount: ${transaction.amount.toLocaleString()} IQD`,
                `Average amount: ${avgAmount.toLocaleString()} IQD`,
                `Deviation: ${Math.round(((transaction.amount - avgAmount) / avgAmount) * 100)}%`,
                `Transaction type: ${transaction.type}`,
              ],
              detailsKu: [
                `بڕی مامەڵە: ${transaction.amount.toLocaleString()} IQD`,
                `بڕی ناوەندی: ${avgAmount.toLocaleString()} IQD`,
                `لادان: ${Math.round(((transaction.amount - avgAmount) / avgAmount) * 100)}%`,
                `جۆری مامەڵە: ${transaction.type === 'debt' ? 'قەرز' : 'پارەدان'}`,
              ],
              recommendation: 'Verify this transaction with the customer directly. Request supporting documentation.',
              recommendationKu: 'ئەم مامەڵەیە لەگەڵ کڕیار دڵنیا بکەرەوە. داوای بەڵگە بکە.',
              status: 'new',
            });
          }

          if (index > 0) {
            const timeDiff = dates[index] - dates[index - 1];
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff < 1 && transaction.type === debtor.transactions[index - 1].type) {
              detectedAlerts.push({
                id: `${debtor.id}-${transaction.id}-timing`,
                debtorId: debtor.id,
                debtorName: debtor.name,
                type: 'suspicious_timing',
                severity: hoursDiff < 0.1 ? 'high' : 'medium',
                description: `Two ${transaction.type} transactions within ${Math.round(hoursDiff * 60)} minutes`,
                descriptionKu: `دوو مامەڵەی ${transaction.type === 'debt' ? 'قەرز' : 'پارەدان'} لە ماوەی ${Math.round(hoursDiff * 60)} خولەکدا`,
                confidence: 75,
                detectedAt: new Date().toISOString(),
                details: [
                  `First transaction: ${debtor.transactions[index - 1].amount.toLocaleString()} IQD`,
                  `Second transaction: ${transaction.amount.toLocaleString()} IQD`,
                  `Time gap: ${Math.round(hoursDiff * 60)} minutes`,
                  `Same type: ${transaction.type}`,
                ],
                detailsKu: [
                  `مامەڵەی یەکەم: ${debtor.transactions[index - 1].amount.toLocaleString()} IQD`,
                  `مامەڵەی دووەم: ${transaction.amount.toLocaleString()} IQD`,
                  `بۆشایی کات: ${Math.round(hoursDiff * 60)} خولەک`,
                  `هەمان جۆر: ${transaction.type === 'debt' ? 'قەرز' : 'پارەدان'}`,
                ],
                recommendation: 'Check if this is a duplicate entry or correction. May need to merge or remove.',
                recommendationKu: 'سەیری ئەوە بکە ئایا دووبارەیە یان چاککردنەوە. لەوانەیە پێویستی بە یەکخستن یان لابردن بێت.',
                status: 'new',
              });
            }
          }
        });

        const recentTransactions = debtor.transactions.filter((t: Transaction) => {
          const daysSince = Math.floor((Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24));
          return daysSince <= 7;
        });

        if (recentTransactions.length > 10) {
          detectedAlerts.push({
            id: `${debtor.id}-rapid`,
            debtorId: debtor.id,
            debtorName: debtor.name,
            type: 'rapid_changes',
            severity: recentTransactions.length > 20 ? 'critical' : 'high',
            description: `${recentTransactions.length} transactions in the last 7 days`,
            descriptionKu: `${recentTransactions.length} مامەڵە لە ماوەی 7 ڕۆژی ڕابردوودا`,
            confidence: 85,
            detectedAt: new Date().toISOString(),
            details: [
              `Total recent transactions: ${recentTransactions.length}`,
              `Average per day: ${(recentTransactions.length / 7).toFixed(1)}`,
              `Normal rate: 1-2 per week`,
              `Account age: ${Math.floor((Date.now() - new Date(debtor.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`,
            ],
            detailsKu: [
              `کۆی مامەڵە نوێیەکان: ${recentTransactions.length}`,
              `ناوەندی بۆ هەر ڕۆژێک: ${(recentTransactions.length / 7).toFixed(1)}`,
              `ڕێژەی ئاسایی: 1-2 بۆ هەفتەیەک`,
              `تەمەنی هەژمار: ${Math.floor((Date.now() - new Date(debtor.createdAt).getTime()) / (1000 * 60 * 60 * 24))} ڕۆژ`,
            ],
            recommendation: 'Unusual activity pattern. Review all recent transactions carefully. May indicate manipulation.',
            recommendationKu: 'شێوازی چالاکی نائاسایی. هەموو مامەڵە نوێیەکان بە وردی پێداچووەوە. لەوانەیە نیشانەی دەستکاری بێت.',
            status: 'new',
          });
        }

        const duplicateCheck = new Map<string, Transaction[]>();
        debtor.transactions.forEach((t: Transaction) => {
          const key = `${t.amount}-${t.type}-${new Date(t.date).toDateString()}`;
          if (!duplicateCheck.has(key)) {
            duplicateCheck.set(key, []);
          }
          duplicateCheck.get(key)!.push(t);
        });

        duplicateCheck.forEach((transactions, key) => {
          if (transactions.length > 1) {
            detectedAlerts.push({
              id: `${debtor.id}-dup-${key}`,
              debtorId: debtor.id,
              debtorName: debtor.name,
              type: 'duplicate',
              severity: transactions.length > 2 ? 'high' : 'medium',
              description: `${transactions.length} identical transactions detected`,
              descriptionKu: `${transactions.length} مامەڵەی وەک یەک دۆزرایەوە`,
              confidence: 90,
              detectedAt: new Date().toISOString(),
              details: [
                `Amount: ${transactions[0].amount.toLocaleString()} IQD`,
                `Type: ${transactions[0].type}`,
                `Date: ${new Date(transactions[0].date).toLocaleDateString()}`,
                `Count: ${transactions.length} duplicates`,
              ],
              detailsKu: [
                `بڕ: ${transactions[0].amount.toLocaleString()} IQD`,
                `جۆر: ${transactions[0].type === 'debt' ? 'قەرز' : 'پارەدان'}`,
                `بەروار: ${new Date(transactions[0].date).toLocaleDateString()}`,
                `ژمارە: ${transactions.length} دووبارە`,
              ],
              recommendation: 'Likely duplicate entries. Remove duplicates to maintain data accuracy.',
              recommendationKu: 'بەگومان تۆمارکردنی دووبارە. دووبارەکان لاببە بۆ پاراستنی وردی داتا.',
              status: 'new',
            });
          }
        });
      });

      const sortedAlerts = detectedAlerts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      setAlerts(sortedAlerts);

      const highRisk = sortedAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length;
      const protectedAmount = sortedAlerts.reduce((sum, alert) => {
        const debtor = debtors.find((d: Debtor) => d.id === alert.debtorId);
        return sum + (debtor?.totalDebt || 0);
      }, 0);

      setStats({
        totalAlerts: sortedAlerts.length,
        highRiskAlerts: highRisk,
        protectedAmount,
        detectionRate: sortedAlerts.length > 0 ? 92 : 100,
      });

      setAnalyzing(false);
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const updateAlertStatus = (alertId: string, status: 'investigating' | 'resolved' | 'false_positive') => {
    Alert.alert(
      language === 'ku' ? 'دڵنیایی' : 'Confirm',
      language === 'ku' ? 'دڵنیایی لە گۆڕینی دۆخی ئاگاداری؟' : 'Confirm alert status change?',
      [
        { text: language === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ku' ? 'دڵنیام' : 'Confirm',
          onPress: () => {
            setAlerts(alerts.map(a => a.id === alertId ? { ...a, status } : a));
            if (status === 'resolved' || status === 'false_positive') {
              setSelectedAlert(null);
            }
          },
        },
      ]
    );
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
          title: language === 'ku' ? 'دۆزینەوەی ساختەکاری' : 'Fraud Detection',
          headerStyle: { backgroundColor: cardBg },
          headerTintColor: textColor,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: '#dc2626' }]}>
          <View style={styles.heroContent}>
            <ShieldAlert color="#ffffff" size={48} />
            <Text style={styles.heroTitle}>
              {language === 'ku' ? 'پاراستنی پێشکەوتوو' : 'Advanced Protection'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {language === 'ku'
                ? 'دۆزینەوەی ساختەکاری بە شیکردنەوەی شێواز'
                : 'Detect fraud with pattern analysis'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {!stats ? (
            <View style={[styles.scanCard, { backgroundColor: cardBg, borderColor }]}>
              <ShieldAlert color="#dc2626" size={64} />
              <Text style={[styles.scanTitle, { color: textColor }]}>
                {language === 'ku' ? 'پشکنینی سیستەم' : 'Scan System'}
              </Text>
              <Text style={[styles.scanDescription, { color: subTextColor }]}>
                {language === 'ku'
                  ? `شیکردنەوەی ${debtors.length} هەژمار بۆ دۆزینەوەی چالاکی گومانلێکراو`
                  : `Analyze ${debtors.length} accounts for suspicious activity`}
              </Text>
              <TouchableOpacity
                style={[styles.scanButton, analyzing && styles.analyzingButton]}
                onPress={analyzeForFraud}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <ActivityIndicator color="#ffffff" />
                    <Text style={styles.scanButtonText}>
                      {language === 'ku' ? 'شیکردنەوە...' : 'Analyzing...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Eye color="#ffffff" size={20} />
                    <Text style={styles.scanButtonText}>
                      {language === 'ku' ? 'دەستپێکردنی پشکنین' : 'Start Scan'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.statsGrid, { marginBottom: 24 }]}>
                <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                  <AlertTriangle color="#f59e0b" size={24} />
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {stats.totalAlerts}
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>
                    {language === 'ku' ? 'ئاگاداری' : 'Alerts'}
                  </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                  <ShieldAlert color="#ef4444" size={24} />
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {stats.highRiskAlerts}
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>
                    {language === 'ku' ? 'مەترسی بەرز' : 'High Risk'}
                  </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                  <Shield color="#10b981" size={24} />
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {stats.protectedAmount.toLocaleString()}
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>
                    {language === 'ku' ? 'IQD پارێزراو' : 'Protected'}
                  </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
                  <TrendingUp color="#06b6d4" size={24} />
                  <Text style={[styles.statValue, { color: textColor }]}>
                    {stats.detectionRate}%
                  </Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>
                    {language === 'ku' ? 'وردی' : 'Accuracy'}
                  </Text>
                </View>
              </View>

              {alerts.length === 0 ? (
                <View style={[styles.noAlertsCard, { backgroundColor: cardBg, borderColor }]}>
                  <CheckCircle2 color="#10b981" size={64} />
                  <Text style={[styles.noAlertsTitle, { color: textColor }]}>
                    {language === 'ku' ? 'هیچ ئاگاداریەک نییە' : 'No Alerts Found'}
                  </Text>
                  <Text style={[styles.noAlertsText, { color: subTextColor }]}>
                    {language === 'ku'
                      ? 'سیستەمەکەت سەلامەتە! هیچ چالاکیەکی گومانلێکراو نەدۆزرایەوە.'
                      : 'Your system is clean! No suspicious activity detected.'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>
                    {language === 'ku' ? 'ئاگاداری ساختەکاری' : 'Fraud Alerts'}
                  </Text>

                  {alerts.map((alert) => (
                    <TouchableOpacity
                      key={alert.id}
                      style={[
                        styles.alertCard,
                        { backgroundColor: cardBg, borderColor },
                        selectedAlert === alert.id && styles.selectedAlert,
                        { borderLeftWidth: 4, borderLeftColor: getSeverityColor(alert.severity) },
                      ]}
                      onPress={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.alertHeader}>
                        <View style={styles.alertInfo}>
                          <View style={styles.alertTitleRow}>
                            <Users color={subTextColor} size={16} />
                            <Text style={[styles.alertDebtorName, { color: textColor }]}>
                              {alert.debtorName}
                            </Text>
                          </View>
                          <Text style={[styles.alertDescription, { color: subTextColor }]}>
                            {language === 'ku' ? alert.descriptionKu : alert.description}
                          </Text>
                        </View>
                        <View style={styles.alertMeta}>
                          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) + '20' }]}>
                            <Text style={[styles.severityText, { color: getSeverityColor(alert.severity) }]}>
                              {alert.severity.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={[styles.confidence, { color: '#06b6d4' }]}>
                            {alert.confidence.toFixed(0)}% {language === 'ku' ? 'دڵنیایی' : 'confidence'}
                          </Text>
                        </View>
                      </View>

                      {selectedAlert === alert.id && (
                        <>
                          <View style={[styles.detailsContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                            <Text style={[styles.detailsTitle, { color: textColor }]}>
                              {language === 'ku' ? 'وردەکاری:' : 'Details:'}
                            </Text>
                            {(language === 'ku' ? alert.detailsKu : alert.details).map((detail, index) => (
                              <View key={index} style={styles.detailItem}>
                                <Zap color="#f59e0b" size={14} />
                                <Text style={[styles.detailText, { color: subTextColor }]}>{detail}</Text>
                              </View>
                            ))}
                          </View>

                          <View style={[styles.recommendationBox, { backgroundColor: '#06b6d4' + '15' }]}>
                            <Lock color="#06b6d4" size={16} />
                            <Text style={[styles.recommendationText, { color: '#06b6d4' }]}>
                              {language === 'ku' ? alert.recommendationKu : alert.recommendation}
                            </Text>
                          </View>

                          {alert.status === 'new' && (
                            <View style={styles.actionButtons}>
                              <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
                                onPress={() => updateAlertStatus(alert.id, 'investigating')}
                              >
                                <Eye color="#ffffff" size={18} />
                                <Text style={styles.actionButtonText}>
                                  {language === 'ku' ? 'لێکۆڵینەوە' : 'Investigate'}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                                onPress={() => updateAlertStatus(alert.id, 'resolved')}
                              >
                                <CheckCircle2 color="#ffffff" size={18} />
                                <Text style={styles.actionButtonText}>
                                  {language === 'ku' ? 'چارەسەرکراو' : 'Resolve'}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                                onPress={() => updateAlertStatus(alert.id, 'false_positive')}
                              >
                                <XCircle color="#ffffff" size={18} />
                                <Text style={styles.actionButtonText}>
                                  {language === 'ku' ? 'هەڵە' : 'False'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {alert.status !== 'new' && (
                            <View style={[styles.statusBox, { backgroundColor: getSeverityColor(alert.severity) + '15' }]}>
                              <Text style={[styles.statusText, { color: getSeverityColor(alert.severity) }]}>
                                {language === 'ku' 
                                  ? alert.status === 'investigating' ? 'لە لێکۆڵینەوەدا' : alert.status === 'resolved' ? 'چارەسەرکراو' : 'هەڵەی ئەرێنی'
                                  : alert.status.replace('_', ' ').toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
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
    color: '#fee2e2',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  scanCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  scanDescription: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  analyzingButton: {
    opacity: 0.7,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  noAlertsCard: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
  },
  noAlertsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  noAlertsText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  selectedAlert: {
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  alertDebtorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  alertMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  confidence: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  recommendationBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
  },
  recommendationText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
