import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Clock, User, FileEdit } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function HistoryLogScreen() {
  const { debtors } = useDebt();
  const { colors } = useTheme();

  const historyEntries = useMemo(() => {
    const entries: {
      id: string;
      transactionId: string;
      debtorName: string;
      action: 'created' | 'edited' | 'deleted';
      date: string;
      changes?: string;
      previousData?: any;
    }[] = [];

    debtors.forEach(debtor => {
      debtor.transactions.forEach(transaction => {
        if (transaction.history) {
          transaction.history.forEach(historyItem => {
            entries.push({
              id: historyItem.id,
              transactionId: transaction.id,
              debtorName: debtor.name,
              action: historyItem.action,
              date: historyItem.date,
              changes: historyItem.changes,
              previousData: historyItem.previousData,
            });
          });
        }
      });
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debtors]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: 'created' | 'edited' | 'deleted') => {
    switch (action) {
      case 'created':
        return colors.success;
      case 'edited':
        return colors.warning;
      case 'deleted':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getActionLabel = (action: 'created' | 'edited' | 'deleted') => {
    switch (action) {
      case 'created':
        return 'دروستکرا';
      case 'edited':
        return 'دەستکاری کرا';
      case 'deleted':
        return 'سڕایەوە';
      default:
        return action;
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
            <Text style={[styles.title, { color: colors.text }]}>شێوازی رێژەنامە</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {historyEntries.length} گۆڕانکاری
            </Text>
          </View>

          {historyEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ مێژوویەکی گۆڕانکاری نییە
              </Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {historyEntries.map((entry, index) => (
                <View key={entry.id} style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: getActionColor(entry.action) },
                    ]}
                  />
                  {index < historyEntries.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: colors.cardBorder }]} />
                  )}
                  
                  <View style={[
                    styles.historyCard,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}>
                    <View style={styles.historyHeader}>
                      <View
                        style={[
                          styles.actionBadge,
                          { backgroundColor: getActionColor(entry.action) + '22' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionBadgeText,
                            { color: getActionColor(entry.action) },
                          ]}
                        >
                          {getActionLabel(entry.action)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyContent}>
                      <View style={styles.historyRow}>
                        <Text style={[styles.historyValue, { color: colors.text }]}>
                          {entry.debtorName}
                        </Text>
                        <View style={styles.historyIcon}>
                          <User size={16} color={colors.textSecondary} />
                          <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>
                            کڕیار:
                          </Text>
                        </View>
                      </View>

                      <View style={styles.historyRow}>
                        <Text style={[styles.historyValue, { color: colors.textTertiary }]}>
                          {formatDate(entry.date)}
                        </Text>
                        <View style={styles.historyIcon}>
                          <Clock size={16} color={colors.textSecondary} />
                          <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>
                            کات:
                          </Text>
                        </View>
                      </View>

                      {entry.changes && (
                        <View style={styles.historyRow}>
                          <Text
                            style={[
                              styles.historyChanges,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {entry.changes}
                          </Text>
                          <View style={styles.historyIcon}>
                            <FileEdit size={16} color={colors.textSecondary} />
                            <Text style={[styles.historyLabel, { color: colors.textSecondary }]}>
                              گۆڕانکاری:
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'right',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  timeline: {
    paddingHorizontal: 20,
  },
  timelineItem: {
    position: 'relative' as const,
    paddingRight: 40,
    marginBottom: 24,
  },
  timelineDot: {
    position: 'absolute' as const,
    right: 0,
    top: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    position: 'absolute' as const,
    right: 5.5,
    top: 20,
    width: 1,
    bottom: -24,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  historyHeader: {
    marginBottom: 12,
  },
  actionBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  historyContent: {
    gap: 12,
  },
  historyRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyIcon: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  historyLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  historyValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  historyChanges: {
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
  },
});
