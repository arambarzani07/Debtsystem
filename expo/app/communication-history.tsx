import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MessageCircle, Phone, Mail, MessageSquare, Send, Search, Filter } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CommunicationLog {
  id: string;
  debtorId: string;
  debtorName: string;
  type: 'call' | 'sms' | 'whatsapp' | 'telegram' | 'email';
  direction: 'outgoing' | 'incoming';
  message?: string;
  timestamp: string;
  success: boolean;
}

export default function CommunicationHistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | CommunicationLog['type']>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

  React.useEffect(() => {
    loadCommunicationLogs();
  }, []);

  const loadCommunicationLogs = async () => {
    try {
      const data = await AsyncStorage.getItem('communication_logs');
      if (data) {
        setLogs(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => {
        const matchesSearch = log.debtorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (log.message && log.message.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = filterType === 'all' || log.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, searchQuery, filterType]);

  const getTypeIcon = (type: CommunicationLog['type']) => {
    switch (type) {
      case 'call': return Phone;
      case 'sms': return MessageSquare;
      case 'whatsapp': return MessageCircle;
      case 'telegram': return Send;
      case 'email': return Mail;
    }
  };

  const getTypeColor = (type: CommunicationLog['type']) => {
    switch (type) {
      case 'call': return colors.success;
      case 'sms': return colors.primary;
      case 'whatsapp': return '#25D366';
      case 'telegram': return '#0088CC';
      case 'email': return colors.warning;
    }
  };

  const getTypeLabel = (type: CommunicationLog['type']) => {
    switch (type) {
      case 'call': return 'پەیوەندی';
      case 'sms': return 'نامە';
      case 'whatsapp': return 'واتساپ';
      case 'telegram': return 'تێلێگرام';
      case 'email': return 'ئیمەیڵ';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'ئێستا';
    if (minutes < 60) return `${minutes} خولەک پێش ئێستا`;
    if (hours < 24) return `${hours} کاتژمێر پێش ئێستا`;
    if (days < 7) return `${days} ڕۆژ پێش ئێستا`;
    return date.toLocaleDateString('ku');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>مێژووی پەیوەندی</Text>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
              <Filter size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="گەڕان بە ناو یان نامە..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {filteredLogs.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <MessageCircle size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ مێژوویەکی پەیوەندی نەدۆزرایەوە
              </Text>
            </View>
          ) : (
            filteredLogs.map(log => {
              const TypeIcon = getTypeIcon(log.type);
              return (
                <View key={log.id} style={[styles.logCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                  <View style={styles.logHeader}>
                    <View style={[styles.typeIcon, { backgroundColor: `${getTypeColor(log.type)}20` }]}>
                      <TypeIcon size={20} color={getTypeColor(log.type)} />
                    </View>
                    <View style={styles.logInfo}>
                      <Text style={[styles.debtorName, { color: colors.text }]}>{log.debtorName}</Text>
                      <View style={styles.logMeta}>
                        <Text style={[styles.typeLabel, { color: getTypeColor(log.type) }]}>
                          {getTypeLabel(log.type)}
                        </Text>
                        <Text style={[styles.dot, { color: colors.textTertiary }]}>•</Text>
                        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                          {formatDate(log.timestamp)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: log.success ? colors.successGlass : colors.errorGlass 
                    }]}>
                      <Text style={[styles.statusText, { 
                        color: log.success ? colors.success : colors.error 
                      }]}>
                        {log.success ? 'سەرکەوتوو' : 'شکستخوارد'}
                      </Text>
                    </View>
                  </View>
                  {log.message && (
                    <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
                      {log.message}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showFilterModal} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)} />
          <View style={[styles.filterModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>فلتەرکردن بەپێی جۆر</Text>
            {['all', 'call', 'sms', 'whatsapp', 'telegram', 'email'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.filterOption, 
                  filterType === type && { backgroundColor: colors.primaryGlass },
                  { borderColor: colors.cardBorder }
                ]}
                onPress={() => {
                  setFilterType(type as any);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.filterText, { 
                  color: filterType === type ? colors.primary : colors.text 
                }]}>
                  {type === 'all' ? 'هەموو' : getTypeLabel(type as any)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 10, paddingBottom: 16 },
  headerCard: { borderRadius: 24, borderWidth: 2, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  filterButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' as const, textAlign: 'center', flex: 1 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 2 },
  searchInput: { flex: 1, fontSize: 16, textAlign: 'right' },
  content: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 30 },
  emptyCard: { borderRadius: 20, borderWidth: 2, padding: 40, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  logCard: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 12 },
  logHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  typeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logInfo: { flex: 1 },
  debtorName: { fontSize: 16, fontWeight: '600' as const, marginBottom: 4, textAlign: 'right' },
  logMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  typeLabel: { fontSize: 13, fontWeight: '600' as const },
  dot: { fontSize: 13 },
  timestamp: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' as const },
  message: { fontSize: 14, textAlign: 'right', marginTop: 8 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  filterModal: { width: '80%', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, textAlign: 'center', marginBottom: 20 },
  filterOption: { padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  filterText: { fontSize: 16, textAlign: 'center', fontWeight: '600' as const },
});
