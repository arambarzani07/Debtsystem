import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { 
  ArrowRight, 
  CheckCircle2, 
  Info,
  Calendar,
  Settings,
  Send,
} from 'lucide-react-native';
import * as hourlyBackup from '@/utils/hourlyBackup';
import * as telegram from '@/utils/telegram';

export default function HourlyBackupSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const [loading, setLoading] = useState(true);
  const [performing, setPerforming] = useState(false);
  
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [marketName, setMarketName] = useState('');
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await hourlyBackup.getHourlyBackupSettings();
      setEnabled(settings.enabled);
      setIntervalMinutes(settings.intervalMinutes.toString());
      setMarketName(settings.marketName || '');

      const lastBackup = await hourlyBackup.getLastBackupTime();
      setLastBackupTime(lastBackup);

      const telegramConfig = await telegram.getTelegramConfig();
      setTelegramEnabled(telegramConfig.isEnabled && !!telegramConfig.botToken);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!telegramEnabled) {
      if (Platform.OS === 'web') {
        alert('تکایە سەرەتا Telegram چالاک بکە لە ڕێکخستنەکان');
      } else {
        Alert.alert('هەڵە', 'تکایە سەرەتا Telegram چالاک بکە لە ڕێکخستنەکان');
      }
      return;
    }

    const minutes = parseInt(intervalMinutes);
    if (isNaN(minutes) || minutes < 1) {
      if (Platform.OS === 'web') {
        alert('تکایە ماوەیەکی دروست بنووسە (لانیکەم ١ خولەک)');
      } else {
        Alert.alert('هەڵە', 'تکایە ماوەیەکی دروست بنووسە (لانیکەم ١ خولەک)');
      }
      return;
    }

    try {
      await hourlyBackup.saveHourlyBackupSettings({
        enabled,
        intervalMinutes: minutes,
        marketName: marketName.trim() || undefined,
      });

      if (Platform.OS === 'web') {
        alert('ڕێکخستنەکان پاشەکەوت کرا! ✅');
      } else {
        Alert.alert('سەرکەوتوو', 'ڕێکخستنەکان پاشەکەوت کرا! ✅');
      }

      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      if (Platform.OS === 'web') {
        alert('هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان');
      } else {
        Alert.alert('هەڵە', 'هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان');
      }
    }
  };

  const handlePerformBackupNow = async () => {
    if (!telegramEnabled) {
      if (Platform.OS === 'web') {
        alert('تکایە سەرەتا Telegram چالاک بکە');
      } else {
        Alert.alert('هەڵە', 'تکایە سەرەتا Telegram چالاک بکە');
      }
      return;
    }

    setPerforming(true);
    try {
      const settings = await hourlyBackup.getHourlyBackupSettings();
      const result = await telegram.sendAutomaticBackupToManager(
        debtors,
        settings.marketName
      );

      if (result.success) {
        if (Platform.OS === 'web') {
          alert('✅ باکئەپ بە سەرکەوتوویی نێردرا بۆ تێلێگرام!');
        } else {
          Alert.alert('سەرکەوتوو', 'باکئەپ بە سەرکەوتوویی نێردرا بۆ تێلێگرام!');
        }
        await loadSettings();
      } else {
        if (Platform.OS === 'web') {
          alert(`❌ هەڵە: ${result.message}`);
        } else {
          Alert.alert('هەڵە', result.message);
        }
      }
    } catch (error) {
      console.error('Error performing backup:', error);
      if (Platform.OS === 'web') {
        alert('هەڵە لە ناردنی باکئەپ');
      } else {
        Alert.alert('هەڵە', 'هەڵە لە ناردنی باکئەپ');
      }
    } finally {
      setPerforming(false);
    }
  };

  const formatLastBackupTime = () => {
    if (!lastBackupTime) return 'هێشتا باکئەپ نەکراوە';
    
    const date = new Date(lastBackupTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (60 * 1000));
    
    if (diffMinutes < 1) return 'ئێستا';
    if (diffMinutes < 60) return `${diffMinutes} خولەک لەمەوبەر`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} کاتژمێر لەمەوبەر`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ڕۆژ لەمەوبەر`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

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
            style={[styles.backButton, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}
          >
            <ArrowRight size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>باکئەپی کاتژمێری</Text>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {!telegramEnabled && (
            <View style={[styles.warningCard, { 
              backgroundColor: colors.errorGlass,
              borderColor: colors.error,
            }]}>
              <Info size={24} color={colors.error} />
              <View style={styles.warningContent}>
                <Text style={[styles.warningTitle, { color: colors.error }]}>
                  Telegram ناچالاکە
                </Text>
                <Text style={[styles.warningText, { color: colors.text }]}>
                  بۆ ئەوەی باکئەپی کاتژمێری کاربکات، تکایە سەرەتا Telegram لە ڕێکخستنەکان چالاک بکە.
                </Text>
                <TouchableOpacity
                  style={[styles.warningButton, { 
                    backgroundColor: colors.error,
                  }]}
                  onPress={() => router.push('/telegram-settings' as any)}
                >
                  <Settings size={16} color="#FFFFFF" />
                  <Text style={styles.warningButtonText}>
                    بڕۆ بۆ ڕێکخستنی Telegram
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.infoCard, { 
            backgroundColor: colors.primaryGlass,
            borderColor: colors.primary,
          }]}>
            <Info size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                باکئەپی کاتژمێری چییە؟
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                بە چالاککردنی باکئەپی کاتژمێری، سیستەم بە خۆکار هەموو کاتێک (یان بەپێی ماوەی دیاریکراو) داتای هەموو قەرزدارەکان و مامەڵەکانت بۆ ئایدی تێلێگرامی بەڕێوەبەری مارکێت دەنێرێت.{'\n\n'}
                ئەمە یارمەتیدەرە بۆ:{'\n'}
                • پاراستنی داتاکان لە هەلەیەکی تەکنیکی{'\n'}
                • هەبوونی کۆپییەکی دوایی لە داتاکان{'\n'}
                • چاودێریکردنی بەردەوامی سیستەم
              </Text>
            </View>
          </View>

          <View style={[styles.section, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <View style={styles.sectionHeader}>
              <Settings size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ڕێکخستنەکان
              </Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  چالاککردنی باکئەپی کاتژمێری
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  ناردنی خۆکاری داتاکان بۆ تێلێگرام
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: colors.textTertiary, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={!telegramEnabled}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                ماوەی نێوان باکئەپەکان (بە خولەک)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.glassBorder,
                  color: colors.text,
                }]}
                value={intervalMinutes}
                onChangeText={setIntervalMinutes}
                placeholder="60"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                editable={telegramEnabled}
              />
              <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
                باکئەپ دەنێردرێت هەموو {intervalMinutes || '60'} خولەک (یەک جار لە هەر {Math.ceil(parseInt(intervalMinutes || '60') / 60)} کاتژمێر)
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                ناوی فرۆشگا (دڵخواز)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.glassBorder,
                  color: colors.text,
                }]}
                value={marketName}
                onChangeText={setMarketName}
                placeholder="ناوی فرۆشگاکەت بنووسە"
                placeholderTextColor={colors.textTertiary}
                editable={telegramEnabled}
              />
              <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
                ئەم ناوە لە پەیامی باکئەپ دەردەکەوێت بۆ ئەوەی بزانیت کام فرۆشگایە
              </Text>
            </View>
          </View>

          <View style={[styles.statusCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <View style={styles.statusHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                دۆخی باکئەپ
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                دوایین باکئەپ:
              </Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {formatLastBackupTime()}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                دۆخ:
              </Text>
              <View style={styles.statusBadge}>
                {enabled && telegramEnabled ? (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.statusBadgeText, { color: colors.success }]}>
                      چالاکە
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: colors.textTertiary }]} />
                    <Text style={[styles.statusBadgeText, { color: colors.textTertiary }]}>
                      ناچالاکە
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                کۆی قەرزدارەکان:
              </Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {debtors.length}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                کۆی قەرزەکان:
              </Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {debtors.reduce((sum, d) => sum + d.totalDebt, 0).toLocaleString('en-US')} دینار
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.performButton, { 
              backgroundColor: telegramEnabled ? colors.primary : colors.textTertiary,
            }]}
            onPress={handlePerformBackupNow}
            disabled={!telegramEnabled || performing}
          >
            {performing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.performButtonText}>
                  باکئەپ ئێستا بنێرە
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.footer, { 
          backgroundColor: colors.cardGlass,
          borderColor: colors.glassBorder,
        }]}>
          <TouchableOpacity
            style={[styles.saveButton, { 
              backgroundColor: telegramEnabled ? colors.primary : colors.textTertiary,
            }]}
            onPress={handleSaveSettings}
            disabled={!telegramEnabled}
          >
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>پاشەکەوتکردن</Text>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  warningCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  warningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  warningButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
  },
  statusCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  performButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  performButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
