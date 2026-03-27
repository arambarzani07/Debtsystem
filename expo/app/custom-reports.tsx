import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FileDown, Calendar } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { generateOverallPDF, exportToCSV } from '@/utils/export';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom' | 'all';

export default function CustomReportsScreen() {
  const { debtors, getAllTransactions } = useDebt();
  const { colors } = useTheme();
  
  const [reportType, setReportType] = useState<ReportType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const allTransactions = getAllTransactions();

  const filteredData = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    
    switch (reportType) {
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (!startDate || !endDate) return { debtors: [], transactions: [] };
        start = new Date(startDate);
        end = new Date(endDate);
        break;
      case 'all':
      default:
        return { debtors, transactions: allTransactions };
    }
    
    const filteredTransactions = allTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
    
    const debtorIds = new Set(filteredTransactions.map(t => t.debtorId));
    const filteredDebtors = debtors.filter(d => debtorIds.has(d.id));
    
    return { debtors: filteredDebtors, transactions: filteredTransactions };
  }, [reportType, startDate, endDate, debtors, allTransactions]);

  const stats = useMemo(() => {
    const { transactions } = filteredData;
    
    const totalDebt = transactions
      .filter(t => t.type === 'debt')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPayment = transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netChange = totalDebt - totalPayment;
    
    return {
      totalDebt,
      totalPayment,
      netChange,
      transactionCount: transactions.length,
      debtorCount: filteredData.debtors.length,
    };
  }, [filteredData]);

  const handleExportPDF = async () => {
    if (filteredData.debtors.length === 0) {
      Alert.alert('هەڵە', 'هیچ زانیارییەک نییە بۆ هاوردەکردن');
      return;
    }
    
    setIsExporting(true);
    const success = await generateOverallPDF(filteredData.debtors);
    setIsExporting(false);
    
    if (success) {
      Alert.alert('سەرکەوتوو', 'ڕاپۆرتەکە هاوردە کرا');
    } else {
      Alert.alert('هەڵە', 'هەڵە لە هاوردەکردنی ڕاپۆرت');
    }
  };

  const handleExportCSV = async () => {
    if (filteredData.debtors.length === 0) {
      Alert.alert('هەڵە', 'هیچ زانیارییەک نییە بۆ هاوردەکردن');
      return;
    }
    
    setIsExporting(true);
    const success = await exportToCSV(filteredData.debtors);
    setIsExporting(false);
    
    if (success) {
      Alert.alert('سەرکەوتوو', 'زانیاریەکان هاوردە کران');
    } else {
      Alert.alert('هەڵە', 'هەڵە لە هاوردەکردنی زانیاریەکان');
    }
  };

  const handleExportJSON = async () => {
    if (filteredData.transactions.length === 0) {
      Alert.alert('هەڵە', 'هیچ زانیارییەک نییە بۆ هاوردەکردن');
      return;
    }
    
    try {
      setIsExporting(true);
      const reportData = {
        reportType,
        startDate: reportType === 'custom' ? startDate : undefined,
        endDate: reportType === 'custom' ? endDate : undefined,
        generatedAt: new Date().toISOString(),
        stats,
        debtors: filteredData.debtors,
        transactions: filteredData.transactions,
      };
      
      const jsonString = JSON.stringify(reportData, null, 2);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportType}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const cacheDirectory = (FileSystem as any).cacheDirectory as string | null;
        if (!cacheDirectory) {
          throw new Error('Cache directory not available');
        }
        const fileName = `report-${reportType}-${Date.now()}.json`;
        const filePath = `${cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, jsonString);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath);
        }
      }
      
      setIsExporting(false);
      Alert.alert('سەرکەوتوو', 'ڕاپۆرتەکە هاوردە کرا');
    } catch (error) {
      console.error('Error exporting JSON:', error);
      setIsExporting(false);
      Alert.alert('هەڵە', 'هەڵە لە هاوردەکردنی ڕاپۆرت');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>ڕاپۆرتی کاستۆم</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>جۆری ڕاپۆرت</Text>
            <View style={styles.reportTypes}>
              {[
                { value: 'all', label: 'هەموو' },
                { value: 'daily', label: 'ئەمڕۆ' },
                { value: 'weekly', label: 'ئەم هەفتەیە' },
                { value: 'monthly', label: 'ئەم مانگە' },
                { value: 'custom', label: 'دیاریکراو' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.reportTypeButton,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    reportType === type.value && {
                      backgroundColor: colors.primary + '33',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setReportType(type.value as ReportType)}
                >
                  <Text
                    style={[
                      styles.reportTypeText,
                      { color: reportType === type.value ? colors.primary : colors.text },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {reportType === 'custom' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>بەرواری دەستپێک و کۆتایی</Text>
              
              <View style={styles.dateInputRow}>
                <Calendar size={18} color={colors.primary} />
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>دەستپێک</Text>
              </View>
              <TextInput
                style={[
                  styles.dateInput,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                value={startDate}
                onChangeText={setStartDate}
              />
              
              <View style={[styles.dateInputRow, { marginTop: 16 }]}>
                <Calendar size={18} color={colors.primary} />
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>کۆتایی</Text>
              </View>
              <TextInput
                style={[
                  styles.dateInput,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ئاماری ڕاپۆرت</Text>
            <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.statRow}>
                <Text style={[styles.statValue, { color: colors.error }]}>
                  {stats.totalDebt.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی پێدانی قەرز</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {stats.totalPayment.toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی وەرگرتنەوە</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={[
                  styles.statValue,
                  { color: stats.netChange > 0 ? colors.error : stats.netChange < 0 ? colors.success : colors.textSecondary },
                ]}>
                  {Math.abs(stats.netChange).toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>گۆڕانی خالیص</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.transactionCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ژمارەی مامەڵەکان</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.debtorCount}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ژمارەی کڕیاران</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>هاوردەکردن</Text>
            
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.primary }]}
              onPress={handleExportPDF}
              disabled={isExporting}
            >
              <FileDown size={20} color="#fff" />
              <Text style={styles.exportButtonText}>هاوردەکردن وەک PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.success }]}
              onPress={handleExportCSV}
              disabled={isExporting}
            >
              <FileDown size={20} color="#fff" />
              <Text style={styles.exportButtonText}>هاوردەکردن وەک CSV</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: colors.warning }]}
              onPress={handleExportJSON}
              disabled={isExporting}
            >
              <FileDown size={20} color="#fff" />
              <Text style={styles.exportButtonText}>هاوردەکردن وەک JSON</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>وردەکارییەکان</Text>
            <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                ئەم ڕاپۆرتە {stats.transactionCount} مامەڵە و {stats.debtorCount} کڕیار لەخۆدەگرێت.
              </Text>
              <Text style={[styles.detailsText, { color: colors.textSecondary, marginTop: 8 }]}>
                دەتوانیت ڕاپۆرتەکە بە فۆرماتی جیاواز هاوردە بکەیت.
              </Text>
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
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
    textAlign: 'right',
  },
  reportTypes: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  reportTypeText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dateInputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dateInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  statRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  exportButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  detailsText: {
    fontSize: 14,
    textAlign: 'right',
    lineHeight: 22,
  },
});
