import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, AlertTriangle, Users, Phone, UserX, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import type { Debtor } from '@/types';

interface DuplicateGroup {
  type: 'name' | 'phone';
  value: string;
  debtors: Debtor[];
}

export default function DuplicateDetectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, deleteDebtor } = useDebt();
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);

  const duplicates = useMemo(() => {
    const groups: DuplicateGroup[] = [];

    const nameMap = new Map<string, Debtor[]>();
    debtors.forEach(debtor => {
      const normalizedName = debtor.name.trim().toLowerCase();
      if (!nameMap.has(normalizedName)) {
        nameMap.set(normalizedName, []);
      }
      nameMap.get(normalizedName)!.push(debtor);
    });

    nameMap.forEach((debtorList, name) => {
      if (debtorList.length > 1) {
        groups.push({
          type: 'name',
          value: name,
          debtors: debtorList,
        });
      }
    });

    const phoneMap = new Map<string, Debtor[]>();
    debtors.forEach(debtor => {
      if (debtor.phone && debtor.phone.trim()) {
        const normalizedPhone = debtor.phone.replace(/\s+/g, '').replace(/^0+/, '');
        if (!phoneMap.has(normalizedPhone)) {
          phoneMap.set(normalizedPhone, []);
        }
        phoneMap.get(normalizedPhone)!.push(debtor);
      }
    });

    phoneMap.forEach((debtorList, phone) => {
      if (debtorList.length > 1) {
        groups.push({
          type: 'phone',
          value: phone,
          debtors: debtorList,
        });
      }
    });

    return groups;
  }, [debtors]);

  const handleToggleSelect = (debtorId: string) => {
    if (selectedForMerge.includes(debtorId)) {
      setSelectedForMerge(selectedForMerge.filter(id => id !== debtorId));
    } else {
      setSelectedForMerge([...selectedForMerge, debtorId]);
    }
  };

  const handleMerge = (group: DuplicateGroup) => {
    const selectedInGroup = group.debtors.filter(d => selectedForMerge.includes(d.id));
    
    if (selectedInGroup.length < 2) {
      Alert.alert('هەڵە', 'تکایە لانیکەم ٢ کڕیار هەڵبژێرە بۆ یەکخستن');
      return;
    }

    Alert.alert(
      'دڵنیابوونەوە',
      `دڵنیایت لە یەکخستنی ${selectedInGroup.length} کڕیار؟\n\nهەموو قەرزەکان و مێژووەکان دەیانخرێتە ناو یەک ژمێریار.`,
      [
        { text: 'پاشگەزبوونەوە', style: 'cancel' },
        {
          text: 'یەکخستن',
          style: 'destructive',
          onPress: () => {
            const primaryDebtor = selectedInGroup[0];
            const othersToMerge = selectedInGroup.slice(1);

            othersToMerge.forEach(debtor => {
              debtor.transactions.forEach(transaction => {
                primaryDebtor.transactions.push(transaction);
              });
              primaryDebtor.totalDebt += debtor.totalDebt;
            });

            othersToMerge.forEach(debtor => {
              deleteDebtor(debtor.id);
            });

            setSelectedForMerge([]);
            Alert.alert('سەرکەوتوو', 'کڕیارەکان بە سەرکەوتوویی یەکخران');
          },
        },
      ]
    );
  };

  const handleDeleteDuplicate = (debtorId: string) => {
    Alert.alert(
      'دڵنیابوونەوە',
      'دڵنیایت لە سڕینەوەی ئەم کڕیارە؟',
      [
        { text: 'پاشگەزبوونەوە', style: 'cancel' },
        {
          text: 'سڕینەوە',
          style: 'destructive',
          onPress: () => {
            deleteDebtor(debtorId);
            setSelectedForMerge(selectedForMerge.filter(id => id !== debtorId));
          },
        },
      ]
    );
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
            دۆزینەوەی دووبارەبوون
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {duplicates.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle2 size={64} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              هیچ دووبارەبوونێک نەدۆزرایەوە
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              هەموو کڕیارەکان بێ دووبارە و پاکن
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
              <AlertTriangle size={32} color={colors.warning} />
              <Text style={[styles.statsTitle, { color: colors.text }]}>
                {duplicates.length} دووبارەبوون دۆزرایەوە
              </Text>
              <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>
                تکایە پێداچوونەوەیان بکە و چارەسەریان بکە
              </Text>
            </View>

            {duplicates.map((group, groupIndex) => {
              const groupSelected = group.debtors.filter(d => selectedForMerge.includes(d.id));
              
              return (
                <View
                  key={groupIndex}
                  style={[styles.duplicateGroup, {
                    backgroundColor: colors.card,
                    borderColor: colors.glassBorder,
                  }]}
                >
                  <View style={styles.groupHeader}>
                    <View style={styles.groupHeaderLeft}>
                      {group.type === 'name' ? (
                        <Users size={20} color={colors.primary} />
                      ) : (
                        <Phone size={20} color={colors.primary} />
                      )}
                      <Text style={[styles.groupTitle, { color: colors.text }]}>
                        {group.type === 'name' ? 'دووبارەی ناو' : 'دووبارەی ژمارەی مۆبایل'}
                      </Text>
                    </View>
                    {groupSelected.length >= 2 && (
                      <TouchableOpacity
                        style={[styles.mergeButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleMerge(group)}
                      >
                        <Text style={styles.mergeButtonText}>
                          یەکخستن ({groupSelected.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={[styles.groupValue, { color: colors.textSecondary }]}>
                    {group.type === 'name' ? group.debtors[0].name : group.value}
                  </Text>

                  {group.debtors.map((debtor, index) => {
                    const isSelected = selectedForMerge.includes(debtor.id);
                    
                    return (
                      <View
                        key={debtor.id}
                        style={[styles.debtorCard, {
                          backgroundColor: isSelected ? colors.primary + '20' : colors.background,
                          borderColor: isSelected ? colors.primary : colors.glassBorder,
                        }]}
                      >
                        <TouchableOpacity
                          style={styles.debtorContent}
                          onPress={() => handleToggleSelect(debtor.id)}
                        >
                          <View style={[styles.checkbox, {
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderColor: isSelected ? colors.primary : colors.glassBorder,
                          }]}>
                            {isSelected && <CheckCircle2 size={16} color="#FFFFFF" />}
                          </View>
                          
                          <View style={styles.debtorInfo}>
                            <Text style={[styles.debtorName, { color: colors.text }]}>
                              {debtor.name}
                            </Text>
                            {debtor.phone && (
                              <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>
                                📞 {debtor.phone}
                              </Text>
                            )}
                            <Text style={[styles.debtorDebt, { color: colors.error }]}>
                              قەرز: {debtor.totalDebt.toLocaleString('en-US')} دینار
                            </Text>
                            <Text style={[styles.debtorTransactions, { color: colors.textSecondary }]}>
                              {debtor.transactions.length} مامەڵە
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
                            onPress={() => handleDeleteDuplicate(debtor.id)}
                          >
                            <UserX size={20} color={colors.error} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
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
    marginTop: 12,
  },
  statsSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  duplicateGroup: {
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupValue: {
    fontSize: 14,
    marginBottom: 16,
  },
  mergeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mergeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  debtorCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  debtorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtorInfo: {
    flex: 1,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debtorPhone: {
    fontSize: 13,
    marginBottom: 4,
  },
  debtorDebt: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  debtorTransactions: {
    fontSize: 12,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
