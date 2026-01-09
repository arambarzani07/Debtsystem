import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  ArrowRight,
  Calendar,
  MessageCircle,
  Send,
  History,
  CheckCircle2,
  XCircle,
  Settings,
  AlertTriangle,
} from 'lucide-react-native';
import {
  getAutomaticReminderSettings,
  saveAutomaticReminderSettings,
  scheduleAutomaticReminders,
  cancelAutomaticReminders,
  sendAutomaticReminders,
  getReminderHistory,
  clearReminderHistory,
  getNextReminderDate,
  type AutomaticReminderSettings,
  type ReminderFrequency,
  type NotificationMethod,
  type ReminderHistory,
} from '@/utils/automaticReminder';

export default function AutomaticRemindersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const { sendNotification } = useNotifications();

  const [settings, setSettings] = useState<AutomaticReminderSettings>({
    enabled: false,
    frequency: 'weekly',
    timeOfDay: '09:00',
    dayOfWeek: 1,
    notificationMethod: 'both',
    onlyWithDebt: true,
  });
  const [history, setHistory] = useState<ReminderHistory[]>([]);
  const [nextReminderDate, setNextReminderDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    loadHistory();
    loadNextReminderDate();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await getAutomaticReminderSettings();
    setSettings(loadedSettings);
  };

  const loadHistory = async () => {
    const loadedHistory = await getReminderHistory(50);
    setHistory(loadedHistory);
  };

  const loadNextReminderDate = async () => {
    const nextDate = await getNextReminderDate();
    setNextReminderDate(nextDate);
  };

  const handleToggleEnabled = async (value: boolean) => {
    const newSettings = { ...settings, enabled: value };
    setSettings(newSettings);
    await saveAutomaticReminderSettings(newSettings);

    if (value) {
      try {
        await scheduleAutomaticReminders(debtors, newSettings, sendNotification);
        Alert.alert('سەرکەوتوو', 'ئاگاداری خۆکار چالاک کرا');
        loadNextReminderDate();
      } catch (error) {
        console.error('Error scheduling reminders:', error);
        Alert.alert('هەڵە', 'هەڵە لە چالاککردنی ئاگاداری خۆکار');
      }
    } else {
      try {
        await cancelAutomaticReminders();
        Alert.alert('سەرکەوتوو', 'ئاگاداری خۆکار ناچالاک کرا');
        setNextReminderDate(null);
      } catch (error) {
        console.error('Error canceling reminders:', error);
      }
    }
  };

  const handleSaveSettings = async () => {
    await saveAutomaticReminderSettings(settings);

    if (settings.enabled) {
      try {
        await cancelAutomaticReminders();
        await scheduleAutomaticReminders(debtors, settings, sendNotification);
        Alert.alert('سەرکەوتوو', 'ڕێکخستنەکان پاشەکەوت کران');
        loadNextReminderDate();
      } catch (error) {
        console.error('Error updating reminders:', error);
        Alert.alert('هەڵە', 'هەڵە لە نوێکردنەوەی ڕێکخستنەکان');
      }
    } else {
      Alert.alert('سەرکەوتوو', 'ڕێکخستنەکان پاشەکەوت کران');
    }
    loadHistory();
  };

  const handleSendNow = async () => {
    if (!settings.enabled) {
      Alert.alert('ئاگادارکردنەوە', 'تکایە یەکەم ئاگاداری خۆکار چالاک بکە');
      return;
    }

    Alert.alert(
      'ناردنی ئێستا',
      'ئایا دڵنیایت لە ناردنی ئاگاداریەکان ئێستا بۆ هەموو قەرزدارەکان؟',
      [
        { text: 'پاشگەزبوونەوە', style: 'cancel' },
        {
          text: 'ناردن',
          onPress: async () => {
            setIsLoading(true);
            try {
              await sendAutomaticReminders(debtors, settings, sendNotification);
              Alert.alert('سەرکەوتوو', 'ئاگاداریەکان بە سەرکەوتوویی نێردران');
              loadHistory();
            } catch (error) {
              console.error('Error sending reminders:', error);
              Alert.alert('هەڵە', 'هەڵە لە ناردنی ئاگاداریەکان');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'سڕینەوەی مێژوو',
      'ئایا دڵنیایت لە سڕینەوەی هەموو مێژووی ناردنەکان؟',
      [
        { text: 'پاشگەزبوونەوە', style: 'cancel' },
        {
          text: 'سڕینەوە',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearReminderHistory();
              setHistory([]);
              Alert.alert('سەرکەوتوو', 'مێژوو سڕایەوە');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('هەڵە', 'هەڵە لە سڕینەوەی مێژوو');
            }
          },
        },
      ]
    );
  };

  const getFrequencyText = (freq: ReminderFrequency): string => {
    switch (freq) {
      case 'daily':
        return 'ڕۆژانە';
      case 'weekly':
        return 'هەفتانە';
      case 'biweekly':
        return 'هەر دوو هەفتە جارێک';
      case 'monthly':
        return 'مانگانە';
      default:
        return 'هەفتانە';
    }
  };

  const getMethodText = (method: NotificationMethod): string => {
    switch (method) {
      case 'app':
        return 'ئەپ';
      case 'whatsapp':
        return 'وەتسئەپ';
      case 'telegram':
        return 'تێلێگرام';
      case 'both':
        return 'هەموو ڕێگاکان';
      default:
        return 'هەموو ڕێگاکان';
    }
  };

  const getDayName = (day: number): string => {
    const days = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
    return days[day] || days[1];
  };

  const filteredDebtors = debtors.filter((d) => {
    if (settings.onlyWithDebt && d.totalDebt <= 0) return false;
    if (settings.minimumDebtAmount && d.totalDebt < settings.minimumDebtAmount) return false;
    
    if (settings.overdueOnly && settings.overdueDays) {
      const now = new Date();
      const lastDebtTransaction = d.transactions
        .filter(t => t.type === 'debt')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (!lastDebtTransaction) return false;
      
      const lastDebtDate = new Date(lastDebtTransaction.date);
      const daysSinceLastDebt = Math.floor((now.getTime() - lastDebtDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysSinceLastDebt < settings.overdueDays) return false;
    }
    
    return true;
  });

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
          <Text style={[styles.title, { color: colors.text }]}>ئاگاداری خۆکار</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Settings size={24} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>ڕێکخستنەکان</Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {settings.enabled && (
              <>
                <View style={styles.settingGroup}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>دووبارەبوونەوە</Text>
                  <View style={styles.frequencyButtons}>
                    {(['daily', 'weekly', 'biweekly', 'monthly'] as ReminderFrequency[]).map(
                      (freq) => (
                        <TouchableOpacity
                          key={freq}
                          style={[
                            styles.frequencyButton,
                            { borderColor: colors.cardBorder },
                            settings.frequency === freq && {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ]}
                          onPress={() => setSettings({ ...settings, frequency: freq })}
                        >
                          <Text
                            style={[
                              styles.frequencyButtonText,
                              {
                                color:
                                  settings.frequency === freq ? '#FFFFFF' : colors.textSecondary,
                              },
                            ]}
                          >
                            {getFrequencyText(freq)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {(settings.frequency === 'weekly' || settings.frequency === 'biweekly') && (
                  <View style={styles.settingGroup}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>ڕۆژی هەفتە</Text>
                    <View style={styles.dayButtons}>
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayButton,
                            { borderColor: colors.cardBorder },
                            settings.dayOfWeek === day && {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ]}
                          onPress={() => setSettings({ ...settings, dayOfWeek: day })}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              {
                                color: settings.dayOfWeek === day ? '#FFFFFF' : colors.textSecondary,
                              },
                            ]}
                          >
                            {getDayName(day)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {settings.frequency === 'monthly' && (
                  <View style={styles.settingGroup}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>ڕۆژی مانگ</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                        },
                      ]}
                      value={settings.dayOfMonth?.toString() || '1'}
                      onChangeText={(text) =>
                        setSettings({ ...settings, dayOfMonth: parseInt(text) || 1 })
                      }
                      keyboardType="number-pad"
                      placeholder="1-31"
                      placeholderTextColor={colors.textTertiary}
                      textAlign="right"
                    />
                  </View>
                )}

                <View style={styles.settingGroup}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>کاتژمێر</Text>
                  <View style={styles.timeButtons}>
                    {[
                      '08:00',
                      '09:00',
                      '10:00',
                      '11:00',
                      '12:00',
                      '13:00',
                      '14:00',
                      '15:00',
                      '16:00',
                      '17:00',
                      '18:00',
                      '19:00',
                    ].map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeButton,
                          { borderColor: colors.cardBorder },
                          settings.timeOfDay === time && {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => setSettings({ ...settings, timeOfDay: time })}
                      >
                        <Text
                          style={[
                            styles.timeButtonText,
                            {
                              color:
                                settings.timeOfDay === time ? '#FFFFFF' : colors.textSecondary,
                            },
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.settingGroup}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>ڕێگای ناردن</Text>
                  <View style={styles.methodButtons}>
                    {(['app', 'whatsapp', 'telegram', 'both'] as NotificationMethod[]).map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.methodButton,
                          { borderColor: colors.cardBorder },
                          settings.notificationMethod === method && {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => setSettings({ ...settings, notificationMethod: method })}
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            {
                              color:
                                settings.notificationMethod === method
                                  ? '#FFFFFF'
                                  : colors.textSecondary,
                            },
                          ]}
                        >
                          {getMethodText(method)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.settingGroup}>
                  <View style={styles.settingRow}>
                    <Switch
                      value={settings.onlyWithDebt}
                      onValueChange={(value) => setSettings({ ...settings, onlyWithDebt: value })}
                      trackColor={{ false: colors.cardBorder, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      تەنها قەرزدارەکان
                    </Text>
                  </View>
                </View>

                <View style={styles.settingGroup}>
                  <View style={styles.settingRow}>
                    <Switch
                      value={settings.overdueOnly || false}
                      onValueChange={(value) => setSettings({ ...settings, overdueOnly: value })}
                      trackColor={{ false: colors.cardBorder, true: colors.warning }}
                      thumbColor="#FFFFFF"
                    />
                    <View style={styles.settingLabelContainer}>
                      <AlertTriangle size={18} color={colors.warning} />
                      <Text style={[styles.settingLabel, { color: colors.text, marginBottom: 0 }]}>
                        تەنها قەرزە کۆنەکان
                      </Text>
                    </View>
                  </View>
                  {settings.overdueOnly && (
                    <View style={styles.overdueDaysContainer}>
                      <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>
                        ماوەی دواکەوتن (بە ڕۆژ)
                      </Text>
                      <TextInput
                        style={[
                          styles.smallInput,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.cardBorder,
                            color: colors.text,
                          },
                        ]}
                        value={settings.overdueDays?.toString() || '30'}
                        onChangeText={(text) =>
                          setSettings({ ...settings, overdueDays: parseInt(text) || 30 })
                        }
                        keyboardType="number-pad"
                        placeholder="30"
                        placeholderTextColor={colors.textTertiary}
                        textAlign="center"
                      />
                      <Text style={[styles.settingHint, { color: colors.textTertiary }]}>
                        تەنها ئاگادارکردنەوە بنێرە بۆ قەرزەکان کە زیاتر لە {settings.overdueDays || 30} ڕۆژ بەسەرچووە
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.settingGroup}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    کەمترین بڕی قەرز (ئارەزوومەندانە)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                    value={settings.minimumDebtAmount?.toString() || ''}
                    onChangeText={(text) =>
                      setSettings({ ...settings, minimumDebtAmount: parseInt(text) || undefined })
                    }
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    textAlign="right"
                  />
                </View>

                <View style={styles.settingGroup}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    پەیامی تایبەت (ئارەزوومەندانە)
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.cardBorder,
                        color: colors.text,
                      },
                    ]}
                    value={settings.customMessage || ''}
                    onChangeText={(text) => setSettings({ ...settings, customMessage: text })}
                    placeholder="{name}, {amount}, {phone} بەکاربهێنە بۆ تایبەتمەندی کردن"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    numberOfLines={4}
                    textAlign="right"
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveSettings}
                >
                  <Settings size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>پاشەکەوتکردنی ڕێکخستنەکان</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {settings.enabled && (
            <>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
                ]}
              >
                <View style={styles.infoSection}>
                  <View style={styles.infoItem}>
                    <Calendar size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        ناردنی دواتر
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {nextReminderDate
                          ? new Date(nextReminderDate).toLocaleString('ku', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'نەدیاریکراوە'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <MessageCircle size={20} color={colors.success} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        ژمارەی قەرزدارەکان
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {filteredDebtors.length} قەرزدار
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <Send size={20} color={colors.warning} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        ڕێگای ناردن
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.text }]}>
                        {getMethodText(settings.notificationMethod)}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.sendNowButton,
                    { backgroundColor: colors.success },
                    isLoading && { opacity: 0.5 },
                  ]}
                  onPress={handleSendNow}
                  disabled={isLoading}
                >
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.sendNowButtonText}>
                    {isLoading ? 'دەنێردرێت...' : 'ناردن ئێستا'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <History size={24} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      مێژووی ناردنەکان
                    </Text>
                  </View>
                  {history.length > 0 && (
                    <TouchableOpacity onPress={handleClearHistory}>
                      <Text style={[styles.clearText, { color: colors.error }]}>سڕینەوە</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {history.length === 0 ? (
                  <View style={styles.emptyState}>
                    <History size={48} color={colors.textTertiary} style={{ opacity: 0.5 }} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      هیچ مێژوویەک نییە
                    </Text>
                  </View>
                ) : (
                  <View style={styles.historyList}>
                    {history.map((item) => (
                      <View
                        key={item.id}
                        style={[
                          styles.historyItem,
                          { backgroundColor: colors.background, borderColor: colors.cardBorder },
                        ]}
                      >
                        <View style={styles.historyLeft}>
                          {item.status === 'sent' ? (
                            <CheckCircle2 size={20} color={colors.success} />
                          ) : (
                            <XCircle size={20} color={colors.error} />
                          )}
                          <View style={styles.historyContent}>
                            <Text style={[styles.historyName, { color: colors.text }]}>
                              {item.debtorName}
                            </Text>
                            <Text style={[styles.historyDetails, { color: colors.textSecondary }]}>
                              {item.amount.toLocaleString('en-US')} - {getMethodText(item.method)}
                            </Text>
                            {item.errorMessage && (
                              <Text style={[styles.historyError, { color: colors.error }]}>
                                {item.errorMessage}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Text style={[styles.historyTime, { color: colors.textTertiary }]}>
                          {new Date(item.sentAt).toLocaleString('ku', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  frequencyButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  dayButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  methodButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingSubLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  overdueDaysContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  smallInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    borderWidth: 1,
    textAlign: 'center',
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  settingHint: {
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'right',
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlign: 'right',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  infoSection: {
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  sendNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  sendNowButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  historyLeft: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  historyContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  historyDetails: {
    fontSize: 13,
  },
  historyError: {
    fontSize: 12,
    marginTop: 4,
  },
  historyTime: {
    fontSize: 12,
  },
});
