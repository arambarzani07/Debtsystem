import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Printer,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { exportToExcel } from '@/utils/excelExport';
import { generateSummaryReport, generateFullReport, printReport } from '@/utils/export';

type ReportType = 'summary' | 'full' | 'debtors' | 'transactions';
type ExportFormat = 'pdf' | 'excel';

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  icon: any;
  color: string;
}

export default function QuickReportsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, getAllTransactions } = useDebt();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  const transactions = getAllTransactions();

  const stats = useMemo(() => {
    const totalDebt = debtors.reduce((sum, d) => sum + d.totalDebt, 0);
    const activeDebtors = debtors.filter(d => d.totalDebt > 0).length;
    
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= last30Days);
    
    const monthIncome = recentTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalDebt,
      totalDebtors: debtors.length,
      activeDebtors,
      monthIncome,
      transactionsCount: transactions.length,
    };
  }, [debtors, transactions]);

  const reportOptions: ReportOption[] = [
    {
      id: 'summary',
      title: 'ڕاپۆرتی کورت',
      description: 'کورتەیەکی گشتی و ئاماری سەرەکی',
      icon: FileText,
      color: '#3B82F6',
    },
    {
      id: 'full',
      title: 'ڕاپۆرتی تەواو',
      description: 'هەموو زانیاری و وردەکاری',
      icon: FileText,
      color: '#8B5CF6',
    },
    {
      id: 'debtors',
      title: 'لیستی کڕیاران',
      description: 'تەنها زانیاریەکانی کڕیاران',
      icon: Users,
      color: '#10B981',
    },
    {
      id: 'transactions',
      title: 'مێژووی مامەڵەکان',
      description: 'هەموو مامەڵەکان بە وردی',
      icon: TrendingUp,
      color: '#F59E0B',
    },
  ];

  const handleGenerateReport = async (type: ReportType, format: ExportFormat) => {
    setIsGenerating(true);
    setSelectedReport(type);

    try {
      if (format === 'excel') {
        const success = await exportToExcel(debtors);
        if (success) {
          Alert.alert('سەرکەوتوو', 'فایلی Excel بە سەرکەوتوویی دروستکرا');
        } else {
          Alert.alert('هەڵە', 'نەتوانرا فایلەکە دروست بکرێت');
        }
      } else {
        let result;
        
        switch (type) {
          case 'summary':
            result = await generateSummaryReport(debtors);
            break;
          case 'full':
            result = await generateFullReport(debtors);
            break;
          case 'debtors':
            result = await generateFullReport(debtors);
            break;
          case 'transactions':
            result = await generateFullReport(debtors);
            break;
          default:
            result = await generateSummaryReport(debtors);
        }

        if (result?.success) {
          Alert.alert('سەرکەوتوو', 'ڕاپۆرتەکە بە سەرکەوتوویی دروستکرا');
        } else {
          Alert.alert('هەڵە', result?.error || 'نەتوانرا ڕاپۆرتەکە دروست بکرێت');
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە دروستکردنی ڕاپۆرت');
    } finally {
      setIsGenerating(false);
      setSelectedReport(null);
    }
  };

  const handlePrintReport = async (type: ReportType) => {
    setIsGenerating(true);
    setSelectedReport(type);

    try {
      const result = await printReport(debtors);
      if (result?.success) {
        Alert.alert('سەرکەوتوو', 'ڕاپۆرتەکە ئامادەیە بۆ چاپکردن');
      } else {
        Alert.alert('هەڵە', result?.error || 'نەتوانرا ڕاپۆرتەکە چاپ بکرێت');
      }
    } catch (error) {
      console.error('Error printing report:', error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە چاپکردنی ڕاپۆرت');
    } finally {
      setIsGenerating(false);
      setSelectedReport(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={[colors.primary + '15', colors.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            ڕاپۆرتە خێراکان
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            کورتەی ئاماری
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <DollarSign size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalDebt.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                کۆی قەرز
              </Text>
            </View>
            <View style={styles.statItem}>
              <Users size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalDebtors}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                کڕیار
              </Text>
            </View>
            <View style={styles.statItem}>
              <Calendar size={24} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.transactionsCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                مامەڵە
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          جۆری ڕاپۆرت
        </Text>

        {reportOptions.map((option) => {
          const Icon = option.icon;
          const isGeneratingThis = isGenerating && selectedReport === option.id;
          
          return (
            <View
              key={option.id}
              style={[styles.reportCard, {
                backgroundColor: colors.card,
                borderColor: colors.glassBorder,
              }]}
            >
              <View style={styles.reportHeader}>
                <View style={[styles.reportIcon, { backgroundColor: option.color + '20' }]}>
                  <Icon size={24} color={option.color} />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={[styles.reportTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.reportDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </View>
              </View>

              {isGeneratingThis ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    دروستکردن...
                  </Text>
                </View>
              ) : (
                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleGenerateReport(option.id, 'pdf')}
                  >
                    <Download size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>PDF</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                    onPress={() => handleGenerateReport(option.id, 'excel')}
                  >
                    <Download size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Excel</Text>
                  </TouchableOpacity>
                  
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                      onPress={() => handlePrintReport(option.id)}
                    >
                      <Printer size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>چاپ</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reportCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 13,
  },
});
