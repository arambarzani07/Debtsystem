import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  ArrowRight,
  Target,
  Users,
  Send,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Filter,
  Calendar,
} from 'lucide-react-native';
import type { Debtor } from '@/types';
import { sendWhatsAppMessage } from '@/utils/whatsapp';

interface Campaign {
  id: string;
  name: string;
  targetDebtors: Debtor[];
  message: string;
  sentCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  status: 'draft' | 'sending' | 'completed';
  filters: {
    minDebt?: number;
    maxDebt?: number;
    category?: string;
    hasPhone: boolean;
  };
}

export default function CollectionCampaignScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const { sendNotification } = useNotifications();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [minDebt, setMinDebt] = useState('');
  const [maxDebt, setMaxDebt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [onlyWithPhone, setOnlyWithPhone] = useState(true);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(true);
  const [sendViaApp, setSendViaApp] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const getFilteredDebtors = useCallback((): Debtor[] => {
    return debtors.filter((debtor) => {
      if (debtor.totalDebt <= 0) return false;
      if (onlyWithPhone && !debtor.phone) return false;
      if (minDebt && debtor.totalDebt < parseFloat(minDebt)) return false;
      if (maxDebt && debtor.totalDebt > parseFloat(maxDebt)) return false;
      if (selectedCategory && debtor.category !== selectedCategory) return false;
      return true;
    });
  }, [debtors, minDebt, maxDebt, selectedCategory, onlyWithPhone]);

  const targetDebtors = getFilteredDebtors();

  const handleCreateCampaign = useCallback(() => {
    if (!campaignName.trim()) {
      Alert.alert('هەڵە', 'ناوی کەمپەین داخڵ بکە');
      return;
    }

    if (targetDebtors.length === 0) {
      Alert.alert('هەڵە', 'هیچ قەرزدارێک نەدۆزرایەوە بەپێی فلتەرەکان');
      return;
    }

    const message = customMessage.trim() || `سڵاو {name}،

یادەوەرییەکی دۆستانەیە دەربارەی قەرزەکەت:
کۆی قەرز: {amount} دینار

زۆر سوپاس بۆ هاوکاریەکەت! 🙏`;

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignName,
      targetDebtors,
      message,
      sentCount: 0,
      successCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      status: 'draft',
      filters: {
        minDebt: minDebt ? parseFloat(minDebt) : undefined,
        maxDebt: maxDebt ? parseFloat(maxDebt) : undefined,
        category: selectedCategory || undefined,
        hasPhone: onlyWithPhone,
      },
    };

    setCampaigns([newCampaign, ...campaigns]);
    setShowCreateModal(false);
    resetForm();

    Alert.alert(
      'کەمپەین دروستکرا',
      `کەمپەین دروستکرا بۆ ${targetDebtors.length} قەرزدار. دەتەوێت ئێستا بینێریت؟`,
      [
        { text: 'دواتر', style: 'cancel' },
        {
          text: 'ناردن ئێستا',
          onPress: () => handleSendCampaign(newCampaign),
        },
      ]
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignName, customMessage, targetDebtors, minDebt, maxDebt, selectedCategory, onlyWithPhone, campaigns]);

  const handleSendCampaign = async (campaign: Campaign) => {
    Alert.alert(
      'دڵنیایت؟',
      `دەتەوێت کەمپەین بنێریت بۆ ${campaign.targetDebtors.length} قەرزدار؟`,
      [
        { text: 'پاشگەزبوونەوە', style: 'cancel' },
        {
          text: 'ناردن',
          onPress: async () => {
            setIsSending(true);
            
            setCampaigns(prev => 
              prev.map(c => 
                c.id === campaign.id 
                  ? { ...c, status: 'sending' as const }
                  : c
              )
            );

            let successCount = 0;
            let failedCount = 0;

            for (const debtor of campaign.targetDebtors) {
              try {
                const personalizedMessage = campaign.message
                  .replace('{name}', debtor.name)
                  .replace('{amount}', debtor.totalDebt.toLocaleString('en-US'));

                if (sendViaApp) {
                  try {
                    await sendNotification(
                      'reminder',
                      'یادەوەری قەرز',
                      personalizedMessage,
                      debtor.userId ? 'customer' : 'manager',
                      'manager',
                      debtor.userId,
                      undefined,
                      undefined
                    );
                  } catch (error) {
                    console.error('Failed to send app notification:', error);
                  }
                }

                if (sendViaWhatsApp && debtor.phone) {
                  const whatsappSuccess = await sendWhatsAppMessage(
                    debtor.phone,
                    personalizedMessage
                  );
                  
                  if (whatsappSuccess) {
                    successCount++;
                  } else {
                    failedCount++;
                  }
                } else {
                  successCount++;
                }

                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                console.error(`Failed to send to ${debtor.name}:`, error);
                failedCount++;
              }
            }

            setCampaigns(prev =>
              prev.map(c =>
                c.id === campaign.id
                  ? {
                      ...c,
                      status: 'completed' as const,
                      sentCount: campaign.targetDebtors.length,
                      successCount,
                      failedCount,
                    }
                  : c
              )
            );

            setIsSending(false);

            Alert.alert(
              'تەواو بوو',
              `کەمپەین تەواو بوو:\n✅ سەرکەوتوو: ${successCount}\n❌ شکستخواردوو: ${failedCount}`,
              [{ text: 'باشە' }]
            );
          },
        },
      ]
    );
  };

  const handleDeleteCampaign = (campaignId: string) => {
    Alert.alert(
      'سڕینەوە',
      'دڵنیایت لە سڕینەوەی ئەم کەمپەینە؟',
      [
        { text: 'پاشگەزبوونەوە', style: 'cancel' },
        {
          text: 'سڕینەوە',
          style: 'destructive',
          onPress: () => setCampaigns(prev => prev.filter(c => c.id !== campaignId)),
        },
      ]
    );
  };

  const resetForm = () => {
    setCampaignName('');
    setCustomMessage('');
    setMinDebt('');
    setMaxDebt('');
    setSelectedCategory('');
    setOnlyWithPhone(true);
    setSendViaWhatsApp(true);
    setSendViaApp(true);
  };

  const totalTargetDebt = targetDebtors.reduce((sum, d) => sum + d.totalDebt, 0);
  const activeCampaigns = campaigns.filter(c => c.status !== 'draft').length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalSuccess = campaigns.reduce((sum, c) => sum + c.successCount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
            ]}
          >
            <ArrowRight size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>کەمپەینی کۆکردنەوە</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.addButtonText}>+ نوێ</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
              ]}
            >
              <Target size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{campaigns.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کەمپەین</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
              ]}
            >
              <Send size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{totalSent}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>نێردراو</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
              ]}
            >
              <CheckCircle2 size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalSent > 0 ? Math.round((totalSuccess / totalSent) * 100) : 0}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>سەرکەوتوو</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
              ]}
            >
              <TrendingUp size={24} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeCampaigns}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>چالاک</Text>
            </View>
          </View>

          {campaigns.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
              ]}
            >
              <Target size={64} color={colors.textTertiary} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                هیچ کەمپەینێک نییە
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                کرتە لەسەر دوگمەی &quot;نوێ&quot; بۆ دروستکردنی یەکەمین کەمپەینت
              </Text>
            </View>
          ) : (
            <View style={styles.campaignsList}>
              {campaigns.map((campaign) => (
                <View
                  key={campaign.id}
                  style={[
                    styles.campaignCard,
                    { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
                  ]}
                >
                  <View style={styles.campaignHeader}>
                    <View style={styles.campaignHeaderLeft}>
                      <Target size={20} color={colors.primary} />
                      <Text style={[styles.campaignName, { color: colors.text }]}>
                        {campaign.name}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            campaign.status === 'completed'
                              ? colors.success + '20'
                              : campaign.status === 'sending'
                              ? colors.warning + '20'
                              : colors.textTertiary + '20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              campaign.status === 'completed'
                                ? colors.success
                                : campaign.status === 'sending'
                                ? colors.warning
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {campaign.status === 'completed'
                          ? 'تەواو بوو'
                          : campaign.status === 'sending'
                          ? 'دەنێردرێت...'
                          : 'ڕەشنووس'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.campaignStats}>
                    <View style={styles.campaignStatItem}>
                      <Users size={16} color={colors.textSecondary} />
                      <Text style={[styles.campaignStatText, { color: colors.textSecondary }]}>
                        {campaign.targetDebtors.length} قەرزدار
                      </Text>
                    </View>

                    {campaign.status !== 'draft' && (
                      <>
                        <View style={styles.campaignStatItem}>
                          <CheckCircle2 size={16} color={colors.success} />
                          <Text style={[styles.campaignStatText, { color: colors.success }]}>
                            {campaign.successCount} سەرکەوتوو
                          </Text>
                        </View>

                        {campaign.failedCount > 0 && (
                          <View style={styles.campaignStatItem}>
                            <XCircle size={16} color={colors.error} />
                            <Text style={[styles.campaignStatText, { color: colors.error }]}>
                              {campaign.failedCount} شکستخواردوو
                            </Text>
                          </View>
                        )}
                      </>
                    )}

                    <View style={styles.campaignStatItem}>
                      <Calendar size={16} color={colors.textSecondary} />
                      <Text style={[styles.campaignStatText, { color: colors.textSecondary }]}>
                        {new Date(campaign.createdAt).toLocaleDateString('ku', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.campaignActions}>
                    {campaign.status === 'draft' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.success }]}
                        onPress={() => handleSendCampaign(campaign)}
                        disabled={isSending}
                      >
                        <Send size={16} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>ناردن</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: colors.error, flex: campaign.status === 'draft' ? 0 : 1 },
                      ]}
                      onPress={() => handleDeleteCampaign(campaign.id)}
                      disabled={campaign.status === 'sending'}
                    >
                      <Text style={styles.actionButtonText}>سڕینەوە</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, borderColor: colors.glassBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>کەمپەینی نوێ</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <XCircle size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>ناوی کەمپەین</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardGlass,
                      borderColor: colors.glassBorder,
                      color: colors.text,
                    },
                  ]}
                  value={campaignName}
                  onChangeText={setCampaignName}
                  placeholder="ناوی کەمپەین داخڵ بکە"
                  placeholderTextColor={colors.textTertiary}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>فلتەرکردن</Text>
                
                <View style={styles.filterRow}>
                  <View style={styles.filterInput}>
                    <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                      کەمترین قەرز
                    </Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        {
                          backgroundColor: colors.cardGlass,
                          borderColor: colors.glassBorder,
                          color: colors.text,
                        },
                      ]}
                      value={minDebt}
                      onChangeText={setMinDebt}
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      textAlign="right"
                    />
                  </View>

                  <View style={styles.filterInput}>
                    <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                      زۆرترین قەرز
                    </Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        {
                          backgroundColor: colors.cardGlass,
                          borderColor: colors.glassBorder,
                          color: colors.text,
                        },
                      ]}
                      value={maxDebt}
                      onChangeText={setMaxDebt}
                      placeholder="∞"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      textAlign="right"
                    />
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <Switch
                    value={onlyWithPhone}
                    onValueChange={setOnlyWithPhone}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={[styles.switchLabel, { color: colors.text }]}>
                    تەنها ئەوانەی ژمارەیان هەیە
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>ڕێگای ناردن</Text>
                <View style={styles.switchRow}>
                  <Switch
                    value={sendViaApp}
                    onValueChange={setSendViaApp}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={[styles.switchLabel, { color: colors.text }]}>ئەپ</Text>
                </View>
                <View style={styles.switchRow}>
                  <Switch
                    value={sendViaWhatsApp}
                    onValueChange={setSendViaWhatsApp}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={[styles.switchLabel, { color: colors.text }]}>وەتسئەپ</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  پەیام (ئارەزوومەندانە)
                </Text>
                <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                  {'{'}&apos;name&apos;{'}'} و {'{'}&apos;amount&apos;{'}'} بەکاربهێنە بۆ تایبەتمەندی کردن
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.cardGlass,
                      borderColor: colors.glassBorder,
                      color: colors.text,
                    },
                  ]}
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  placeholder="پەیامی تایبەت بنووسە یان بەتاڵی بێڵە بۆ پەیامی بنەڕەتی"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={6}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>

              <View
                style={[
                  styles.previewCard,
                  { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
                ]}
              >
                <View style={styles.previewHeader}>
                  <Filter size={20} color={colors.primary} />
                  <Text style={[styles.previewTitle, { color: colors.text }]}>پێشبینین</Text>
                </View>

                <View style={styles.previewStats}>
                  <View style={styles.previewStatItem}>
                    <Text style={[styles.previewStatValue, { color: colors.text }]}>
                      {targetDebtors.length}
                    </Text>
                    <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>
                      قەرزدار
                    </Text>
                  </View>

                  <View style={styles.previewStatItem}>
                    <Text style={[styles.previewStatValue, { color: colors.text }]}>
                      {totalTargetDebt.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>
                      کۆی قەرز
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateCampaign}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>دروستکردن</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  campaignsList: {
    gap: 16,
    paddingBottom: 20,
  },
  campaignCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '700' as const,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  campaignStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  campaignStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  campaignStatText: {
    fontSize: 13,
  },
  campaignActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  inputHint: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    textAlign: 'right',
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterInput: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 13,
    marginBottom: 6,
    textAlign: 'right',
  },
  smallInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlign: 'right',
  },
  switchRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  previewStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  previewStatLabel: {
    fontSize: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
