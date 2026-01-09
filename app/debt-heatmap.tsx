import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 80) / 7;

interface DayActivity {
  date: string;
  totalDebt: number;
  totalPayment: number;
  netChange: number;
  transactionCount: number;
}

export default function DebtHeatmapScreen() {
  const { colors } = useTheme();
  const { getAllTransactions } = useDebt();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthNames = [
    'کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
    'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'
  ];

  const dayNames = ['ش', 'ھ', 'چ', 'س', 'پ', 'د', 'ی'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const activityData = useMemo(() => {
    const transactions = getAllTransactions();
    const dataMap = new Map<string, DayActivity>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateStr = date.toISOString().split('T')[0];

      if (!dataMap.has(dateStr)) {
        dataMap.set(dateStr, {
          date: dateStr,
          totalDebt: 0,
          totalPayment: 0,
          netChange: 0,
          transactionCount: 0,
        });
      }

      const activity = dataMap.get(dateStr)!;
      activity.transactionCount++;

      if (transaction.type === 'debt') {
        activity.totalDebt += transaction.amount;
        activity.netChange += transaction.amount;
      } else {
        activity.totalPayment += transaction.amount;
        activity.netChange -= transaction.amount;
      }
    });

    return dataMap;
  }, [getAllTransactions]);

  const getActivityForDate = (date: Date | null): DayActivity | null => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return activityData.get(dateStr) || null;
  };

  const getHeatmapColor = (activity: DayActivity | null) => {
    if (!activity || activity.transactionCount === 0) {
      return 'rgba(100, 100, 100, 0.1)';
    }

    const intensity = Math.min(activity.transactionCount / 10, 1);

    if (activity.netChange > 0) {
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.8})`;
    } else if (activity.netChange < 0) {
      return `rgba(34, 197, 94, ${0.2 + intensity * 0.8})`;
    } else {
      return `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`;
    }
  };

  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);

  const monthStats = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    let totalDebt = 0;
    let totalPayment = 0;
    let totalTransactions = 0;
    let activeDays = 0;

    activityData.forEach((activity, date) => {
      if (date >= firstDay && date <= lastDay) {
        totalDebt += activity.totalDebt;
        totalPayment += activity.totalPayment;
        totalTransactions += activity.transactionCount;
        if (activity.transactionCount > 0) activeDays++;
      }
    });

    return {
      totalDebt,
      totalPayment,
      netChange: totalDebt - totalPayment,
      totalTransactions,
      activeDays,
    };
  }, [selectedMonth, activityData]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedMonth(newDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'ڕۆژژمێری چالاکی',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.monthSelector}>
              <TouchableOpacity
                style={[styles.monthButton, { backgroundColor: colors.primaryGlass }]}
                onPress={() => changeMonth(1)}
              >
                <Text style={[styles.monthButtonText, { color: colors.primary }]}>›</Text>
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.text }]}>
                {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                style={[styles.monthButton, { backgroundColor: colors.primaryGlass }]}
                onPress={() => changeMonth(-1)}
              >
                <Text style={[styles.monthButtonText, { color: colors.primary }]}>‹</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: 'rgba(239, 68, 68, 0.8)' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>قەرز</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: 'rgba(34, 197, 94, 0.8)' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>پارەدان</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: 'rgba(59, 130, 246, 0.8)' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>یەکسان</Text>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.dayHeaders}>
              {dayNames.map((day, index) => (
                <View key={index} style={[styles.dayHeader, { width: CELL_SIZE }]}>
                  <Text style={[styles.dayHeaderText, { color: colors.textSecondary }]}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendar}>
              {getDaysInMonth(selectedMonth).map((date, index) => {
                const activity = getActivityForDate(date);
                const isToday = date && date.toDateString() === new Date().toDateString();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarCell,
                      {
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor: getHeatmapColor(activity),
                        borderColor: isToday ? colors.primary : 'transparent',
                        borderWidth: isToday ? 2 : 0,
                      },
                    ]}
                    onPress={() => activity && setSelectedDay(activity)}
                    disabled={!date || !activity}
                  >
                    {date && (
                      <>
                        <Text style={[styles.dayNumber, { color: colors.text }]}>
                          {date.getDate()}
                        </Text>
                        {activity && activity.transactionCount > 0 && (
                          <Text style={[styles.transactionCount, { color: colors.text }]}>
                            {activity.transactionCount}
                          </Text>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>کورتەی مانگ</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <TrendingUp size={24} color="#EF4444" />
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {monthStats.totalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>قەرزی گشتی</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <TrendingDown size={24} color="#22C55E" />
                <Text style={[styles.statValue, { color: '#22C55E' }]}>
                  {monthStats.totalPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>پارەدانی گشتی</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Minus size={24} color="#3B82F6" />
                <Text style={[
                  styles.statValue,
                  { color: monthStats.netChange >= 0 ? '#EF4444' : '#22C55E' }
                ]}>
                  {Math.abs(monthStats.netChange).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {monthStats.netChange >= 0 ? 'قەرزی خاڵیص' : 'وەرگیراوی خاڵیص'}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.primaryGlass }]}>
                <Calendar size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {monthStats.activeDays}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ڕۆژی چالاک</Text>
              </View>
            </View>
          </View>

          {selectedDay && (
            <View style={[styles.section, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {new Date(selectedDay.date).toLocaleDateString('ar', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>

              <View style={styles.dayDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ژمارەی مامەڵە</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {selectedDay.transactionCount}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>کۆی قەرز</Text>
                  <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                    {selectedDay.totalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>کۆی پارەدان</Text>
                  <Text style={[styles.detailValue, { color: '#22C55E' }]}>
                    {selectedDay.totalPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD
                  </Text>
                </View>

                <View style={[styles.detailRow, styles.detailRowHighlight, { backgroundColor: colors.card }]}>
                  <Text style={[styles.detailLabel, { color: colors.text, fontWeight: '700' as const }]}>
                    گۆڕانکاری خاڵیص
                  </Text>
                  <Text style={[
                    styles.detailValue,
                    { 
                      color: selectedDay.netChange >= 0 ? '#EF4444' : '#22C55E',
                      fontWeight: '700' as const,
                    }
                  ]}>
                    {selectedDay.netChange >= 0 ? '+' : '-'}
                    {Math.abs(selectedDay.netChange).toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.card }]}
                onPress={() => setSelectedDay(null)}
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>داخستن</Text>
              </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  legend: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dayHeaders: {
    flexDirection: 'row-reverse',
    marginBottom: 12,
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  calendar: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
  },
  calendarCell: {
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  transactionCount: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  dayDetails: {
    gap: 12,
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailRowHighlight: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  closeButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
