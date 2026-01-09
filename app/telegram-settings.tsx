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
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  ArrowRight, 
  Send, 
  MessageCircle, 
  CheckCircle2, 
  XCircle,
  Settings,
  Bell,
  Clock,
  Info,
  Link as LinkIcon,
  Copy,
  Shield,
  Users,
  Zap,
  AlertCircle,
  User,
} from 'lucide-react-native';
import * as telegram from '@/utils/telegram';
import * as hourlyBackup from '@/utils/hourlyBackup';

export default function TelegramSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<telegram.TelegramConfig | null>(null);
  
  const [botToken, setBotToken] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [botUsername, setBotUsername] = useState('');
  
  const [managerChatId, setManagerChatId] = useState('');
  const [managerBackupEnabled, setManagerBackupEnabled] = useState(false);
  const [backupIntervalMinutes, setBackupIntervalMinutes] = useState('60');
  
  const [autoReminders, setAutoReminders] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState('7');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await telegram.getTelegramConfig();
      setConfig(savedConfig);
      setBotToken(savedConfig.botToken);
      setManagerChatId(savedConfig.defaultChatId || '');
      setIsEnabled(savedConfig.isEnabled);
      setAutoReminders(savedConfig.autoSendReminders);
      setReminderFrequency(savedConfig.reminderFrequencyDays.toString());
      
      const backupSettings = await hourlyBackup.getHourlyBackupSettings();
      setManagerBackupEnabled(backupSettings.enabled);
      setBackupIntervalMinutes(backupSettings.intervalMinutes.toString());
      
      if (savedConfig.botToken) {
        const botInfo = await telegram.getBotInfo(savedConfig.botToken);
        if (botInfo.success && botInfo.botUsername) {
          setBotUsername(botInfo.botUsername);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!botToken.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە Bot Token بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە Bot Token بنووسە');
      }
      return;
    }

    if (!managerChatId.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە Chat ID ی بەڕێوەبەر بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە Chat ID ی بەڕێوەبەر بنووسە');
      }
      return;
    }

    try {
      await telegram.setBotTokenAndDefaultChat(botToken, managerChatId);
      await telegram.setAutoReminders(
        autoReminders, 
        parseInt(reminderFrequency) || 7
      );
      
      await hourlyBackup.saveHourlyBackupSettings({
        enabled: managerBackupEnabled,
        intervalMinutes: parseInt(backupIntervalMinutes) || 60,
      });
      
      if (Platform.OS === 'web') {
        alert('ڕێکخستنەکان پاشەکەوت کرا! ✅');
      } else {
        Alert.alert('سەرکەوتوو', 'ڕێکخستنەکان پاشەکەوت کرا! ✅');
      }
      
      await loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      if (Platform.OS === 'web') {
        alert('هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان');
      } else {
        Alert.alert('هەڵە', 'هەڵە لە پاشەکەوتکردنی ڕێکخستنەکان');
      }
    }
  };

  const handleTestConnection = async () => {
    if (!botToken.trim() || !managerChatId.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە Bot Token و Chat ID پڕ بکەرەوە');
      } else {
        Alert.alert('هەڵە', 'تکایە Bot Token و Chat ID پڕ بکەرەوە');
      }
      return;
    }

    setTesting(true);
    try {
      const result = await telegram.testTelegramConnection(botToken, managerChatId);
      
      if (result.success) {
        const botInfo = await telegram.getBotInfo(botToken);
        if (botInfo.success && botInfo.botUsername) {
          setBotUsername(botInfo.botUsername);
        }
        
        if (Platform.OS === 'web') {
          alert(`✅ ${result.message}`);
        } else {
          Alert.alert('سەرکەوتوو', result.message);
        }
      } else {
        if (Platform.OS === 'web') {
          alert(`❌ ${result.message}`);
        } else {
          Alert.alert('شکستی هێنا', result.message);
        }
      }
    } catch {
      if (Platform.OS === 'web') {
        alert('هەڵە لە تاقیکردنەوەی پەیوەندی');
      } else {
        Alert.alert('هەڵە', 'هەڵە لە تاقیکردنەوەی پەیوەندی');
      }
    } finally {
      setTesting(false);
    }
  };

  const handleCopyBotLink = async () => {
    if (!botUsername) return;
    const link = telegram.generateBotDeepLink(botUsername);
    await Clipboard.setString(link);
    if (Platform.OS === 'web') {
      alert('لینکی بۆت کۆپی کرا! 📋');
    } else {
      Alert.alert('سەرکەوتوو', 'لینکی بۆت کۆپی کرا! 📋');
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    setIsEnabled(value);
    await telegram.toggleTelegram(value);
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
          <Text style={[styles.title, { color: colors.text }]}>ڕێکخستنی Telegram</Text>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.setupGuideCard, { 
            backgroundColor: colors.primaryGlass,
            borderColor: colors.primary,
          }]}>
            <View style={[styles.setupIconBox, { backgroundColor: colors.primary }]}>
              <Info size={28} color="#FFFFFF" />
            </View>
            <Text style={[styles.setupTitle, { color: colors.text }]}>
              چۆن Telegram دادەنرێت؟
            </Text>
            <View style={styles.setupSteps}>
              <View style={styles.setupStep}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>١</Text>
                </View>
                <Text style={[styles.setupStepText, { color: colors.text }]}>
                  بۆتێکی Telegram دروست بکە لە ڕێگەی @BotFather
                </Text>
              </View>
              <View style={styles.setupStep}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>٢</Text>
                </View>
                <Text style={[styles.setupStepText, { color: colors.text }]}>
                  Bot Token وەربگرە
                </Text>
              </View>
              <View style={styles.setupStep}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>٣</Text>
                </View>
                <Text style={[styles.setupStepText, { color: colors.text }]}>
                  Chat ID وەربگرە لە ڕێگەی @userinfobot
                </Text>
              </View>
              <View style={styles.setupStep}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>٤</Text>
                </View>
                <Text style={[styles.setupStepText, { color: colors.text }]}>
                  زانیارییەکان لە خوارەوە بنووسە و پاشەکەوت بکە
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.section, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <View style={styles.sectionHeader}>
              <Settings size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ڕێکخستنی گشتی بۆت
              </Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  چالاککردنی Telegram
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  یارمەتیدەر بوون لە ناردنی پەیام بە Telegram
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: colors.textTertiary, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Bot Token
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.glassBorder,
                  color: colors.text,
                }]}
                value={botToken}
                onChangeText={setBotToken}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.testButton, { 
                backgroundColor: colors.primary,
              }]}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.testButtonText}>تاقیکردنەوەی پەیوەندی</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.success,
          }]}>
            <View style={[styles.sectionHeaderLarge, {
              backgroundColor: colors.successGlass || colors.primaryGlass,
            }]}>
              <View style={[styles.sectionIconBox, { backgroundColor: colors.success }]}>
                <Shield size={24} color="#FFFFFF" />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={[styles.sectionTitleLarge, { color: colors.text }]}>
                  ڕێکخستنی بەڕێوەبەر
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  باکئەپی خۆکار بۆ بەڕێوەبەری مارکێت
                </Text>
              </View>
            </View>

            <View style={[styles.featureBox, {
              backgroundColor: colors.background,
              borderColor: colors.glassBorder,
            }]}>
              <View style={styles.featureRow}>
                <Zap size={18} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  هەموو کاتژمێرێک داتای قەرزەکان دەنێردرێت بۆ تێلێگرام
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Zap size={18} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  ڕاپۆرتی تەواو لەگەڵ هەموو وردەکاریەکان
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Zap size={18} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  چاودێری بەردەوام بەسەر داتاکان
                </Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Chat ID ی بەڕێوەبەر
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.glassBorder,
                  color: colors.text,
                }]}
                value={managerChatId}
                onChangeText={setManagerChatId}
                placeholder="123456789"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
                ئەم Chat ID باکئەپی خۆکار بۆ دەنێردرێت
              </Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  باکئەپی خۆکار بۆ بەڕێوەبەر
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  هەموو کاتژمێرێک داتای قەرزەکان بنێرە بۆ بەڕێوەبەر
                </Text>
              </View>
              <Switch
                value={managerBackupEnabled}
                onValueChange={setManagerBackupEnabled}
                trackColor={{ false: colors.textTertiary, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>

            {managerBackupEnabled && (
              <View style={styles.inputContainer}>
                <View style={styles.frequencyRow}>
                  <Clock size={20} color={colors.text} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    هەموو چەند خولەکێک؟
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    borderColor: colors.glassBorder,
                    color: colors.text,
                  }]}
                  value={backupIntervalMinutes}
                  onChangeText={setBackupIntervalMinutes}
                  placeholder="60"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
                  باکئەپی خۆکار هەموو {backupIntervalMinutes || '60'} خولەک دەنێردرێت بۆ بەڕێوەبەر
                </Text>
              </View>
            )}

            <View style={[styles.infoBox, {
              backgroundColor: colors.successGlass || colors.primaryGlass,
              borderColor: colors.success,
            }]}>
              <Info size={16} color={colors.success} />
              <Text style={[styles.infoBoxText, { color: colors.text }]}>
                💡 باکئەپی خۆکار زانیاری هەموو قەرزارەکان و مامەڵەکانیان دەنێرێت بۆ تێلێگرامی بەڕێوەبەر بە شێوەیەکی بەردەوام
              </Text>
            </View>
          </View>

          <View style={[styles.section, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.warning,
          }]}>
            <View style={[styles.sectionHeaderLarge, {
              backgroundColor: colors.primaryGlass,
            }]}>
              <View style={[styles.sectionIconBox, { backgroundColor: colors.warning }]}>
                <Users size={24} color="#FFFFFF" />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={[styles.sectionTitleLarge, { color: colors.text }]}>
                  ڕێکخستنی کڕیاران
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  ئاگادارکردنەوە بۆ قەرزارەکان
                </Text>
              </View>
            </View>

            <View style={[styles.featureBox, {
              backgroundColor: colors.background,
              borderColor: colors.glassBorder,
            }]}>
              <View style={styles.featureRow}>
                <Bell size={18} color={colors.warning} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  یادەوەری خۆکار یان دەستی بۆ قەرزارەکان
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Bell size={18} color={colors.warning} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  ناردنی پەیام بە شێوەیەکی تایبەت
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Bell size={18} color={colors.warning} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  بەڕێوەبەردن لە دەست بەڕێوەبەر
                </Text>
              </View>
            </View>

            <View style={[styles.manualReminderBox, {
              backgroundColor: colors.primaryGlass,
              borderColor: colors.primary,
            }]}>
              <View style={styles.manualReminderHeader}>
                <AlertCircle size={20} color={colors.primary} />
                <Text style={[styles.manualReminderTitle, { color: colors.text }]}>
                  ناردنی یادەوەری دەستی
                </Text>
              </View>
              <Text style={[styles.manualReminderDesc, { color: colors.textSecondary }]}>
                بەڕێوەبەر دەتوانێت بە دەستی یادەوەری بنێرێت بۆ هەر قەرزارێک لە:
              </Text>
              <View style={styles.manualReminderList}>
                <View style={styles.manualReminderItem}>
                  <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.manualReminderItemText, { color: colors.text }]}>
                    پەڕەی قەرزارەکە (دوگمەی تێلێگرام)
                  </Text>
                </View>
                <View style={styles.manualReminderItem}>
                  <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.manualReminderItemText, { color: colors.text }]}>
                    لیستی قەرزارەکان
                  </Text>
                </View>
                <View style={styles.manualReminderItem}>
                  <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.manualReminderItemText, { color: colors.text }]}>
                    بەشی ناردنی کۆمەڵە پەیام
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  یادەوەری خودکار بۆ کڕیاران
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  ناردنی یادەوەری خودکار بۆ قەرزارەکان بە بەردەوامی
                </Text>
              </View>
              <Switch
                value={autoReminders}
                onValueChange={setAutoReminders}
                trackColor={{ false: colors.textTertiary, true: colors.warning }}
                thumbColor="#FFFFFF"
              />
            </View>

            {autoReminders && (
              <View style={styles.inputContainer}>
                <View style={styles.frequencyRow}>
                  <Clock size={20} color={colors.text} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    هەموو چەند ڕۆژێک؟
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background,
                    borderColor: colors.glassBorder,
                    color: colors.text,
                  }]}
                  value={reminderFrequency}
                  onChangeText={setReminderFrequency}
                  placeholder="7"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={[styles.inputHint, { color: colors.textTertiary }]}>
                  یادەوەری خۆکار بۆ کڕیارانی قەرزدار دەنێردرێت هەموو {reminderFrequency || '7'} ڕۆژێک
                </Text>
              </View>
            )}

            <View style={[styles.infoBox, {
              backgroundColor: colors.primaryGlass,
              borderColor: colors.primary,
            }]}>
              <Info size={16} color={colors.primary} />
              <Text style={[styles.infoBoxText, { color: colors.text }]}>
                کڕیارەکان دەبێت Chat ID تایبەت بەخۆیان هەبێت لە بەشی &quot;بەڕێوەبردنی Chat IDs&quot;
              </Text>
            </View>
          </View>

          <View style={[styles.section, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.primary,
          }]}>
            <View style={[styles.sectionHeaderLarge, {
              backgroundColor: colors.primaryGlass,
            }]}>
              <View style={[styles.sectionIconBox, { backgroundColor: colors.primary }]}>
                <LinkIcon size={24} color="#FFFFFF" />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={[styles.sectionTitleLarge, { color: colors.text }]}>
                  لینکەکانی کڕیاران
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  لینکی تایبەت بۆ هەر کڕیارێک
                </Text>
              </View>
            </View>

            <View style={[styles.featureBox, {
              backgroundColor: colors.background,
              borderColor: colors.glassBorder,
            }]}>
              <View style={styles.featureRow}>
                <MessageCircle size={18} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '700' as const }}>١. لینکی بۆت:</Text> کڕیار کلیک لەسەر دەکات و خۆکار Chat ID تۆمار دەبێت
                </Text>
              </View>
              <View style={styles.featureRow}>
                <LinkIcon size={18} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '700' as const }}>٢. لینکی وێب:</Text> کڕیار قەرزەکانی خۆی دەبینێت لە وێبسایت
                </Text>
              </View>
              <View style={styles.featureRow}>
                <LinkIcon size={18} color={colors.warning} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '700' as const }}>٣. لینکی داونلۆد:</Text> کڕیار ئەپەکە دادەگرێت
                </Text>
              </View>
              <View style={styles.featureRow}>
                <User size={18} color={colors.error} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  <Text style={{ fontWeight: '700' as const }}>٤. لینکی ئینڤایت:</Text> کڕیار دەتوانێت پەیوەست بێت بە سیستەمەکە
                </Text>
              </View>
            </View>

            {botUsername ? (
              <View style={[styles.linksPreviewBox, {
                backgroundColor: colors.primaryGlass,
                borderColor: colors.primary,
              }]}>
                <View style={styles.linkPreviewHeader}>
                  <Info size={16} color={colors.primary} />
                  <Text style={[styles.linkPreviewTitle, { color: colors.text }]}>
                    چۆن بەکاری دەهێنرێن؟
                  </Text>
                </View>
                <Text style={[styles.linkPreviewDesc, { color: colors.textSecondary }]}>
                  بڕۆ بۆ بەشی &quot;بەڕێوەبردنی Chat IDs&quot; یان پەڕەی هەر کڕیارێک بۆ بینین و شەیرکردنی لینکەکان
                </Text>
              </View>
            ) : (
              <View style={[styles.infoBox, {
                backgroundColor: colors.warningGlass,
                borderColor: colors.warning,
              }]}>
                <AlertCircle size={16} color={colors.warning} />
                <Text style={[styles.infoBoxText, { color: colors.text }]}>
                  تکایە سەرەتا Bot Token دابنێ بۆ چالاککردنی تایبەتمەندی لینکەکان
                </Text>
              </View>
            )}
          </View>

          {botUsername && (
            <View style={[styles.botLinkCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <View style={styles.botLinkHeader}>
                <LinkIcon size={20} color={colors.primary} />
                <Text style={[styles.botLinkTitle, { color: colors.text }]}>
                  لینکی گشتی بۆت
                </Text>
              </View>
              <View style={[styles.botLinkBox, {
                backgroundColor: colors.background,
                borderColor: colors.glassBorder,
              }]}>
                <Text style={[styles.botLinkText, { color: colors.primary }]} numberOfLines={1}>
                  https://t.me/{botUsername}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.copyButton, {
                  backgroundColor: colors.primaryGlass,
                  borderColor: colors.primary,
                }]}
                onPress={handleCopyBotLink}
              >
                <Copy size={16} color={colors.primary} />
                <Text style={[styles.copyButtonText, { color: colors.primary }]}>
                  کۆپیکردنی لینک
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.statsCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <View style={styles.statRow}>
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  دۆخی پەیوەندی
                </Text>
                <View style={styles.statusRow}>
                  {isEnabled && botToken && managerChatId ? (
                    <>
                      <CheckCircle2 size={20} color={colors.success} />
                      <Text style={[styles.statValue, { color: colors.success }]}>
                        چالاکە
                      </Text>
                    </>
                  ) : (
                    <>
                      <XCircle size={20} color={colors.error} />
                      <Text style={[styles.statValue, { color: colors.error }]}>
                        ناچالاکە
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

            <View style={styles.statRow}>
              <MessageCircle size={20} color={colors.primary} />
              <View style={styles.statInfo}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  کڕیارانی پەیوەستکراو
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {config ? Object.keys(config.chatIds).length : 0}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.manageButton, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}
            onPress={() => router.push('/manage-chat-ids' as any)}
          >
            <View style={styles.manageButtonContent}>
              <MessageCircle size={24} color={colors.text} />
              <View style={styles.manageButtonText}>
                <Text style={[styles.manageButtonTitle, { color: colors.text }]}>
                  بەڕێوەبردنی Chat IDs
                </Text>
                <Text style={[styles.manageButtonDesc, { color: colors.textTertiary }]}>
                  Chat ID تایبەت بۆ هەر کڕیارێک دابنێ
                </Text>
              </View>
            </View>
            <ArrowRight size={20} color={colors.textTertiary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.footer, { 
          backgroundColor: colors.cardGlass,
          borderColor: colors.glassBorder,
        }]}>
          <TouchableOpacity
            style={[styles.saveButton, { 
              backgroundColor: colors.primary,
            }]}
            onPress={handleSaveConfig}
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
  setupGuideCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 20,
    alignItems: 'center',
  },
  setupIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 20,
    textAlign: 'center',
  },
  setupSteps: {
    width: '100%',
    gap: 12,
  },
  setupStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  setupStepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
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
  sectionHeaderLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  sectionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitleLarge: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  featureBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  manualReminderBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  manualReminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  manualReminderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  manualReminderDesc: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  manualReminderList: {
    gap: 8,
  },
  manualReminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  manualReminderItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionDesc: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
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
  infoTextSmall: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statsCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  manageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  manageButtonText: {
    flex: 1,
  },
  manageButtonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  manageButtonDesc: {
    fontSize: 14,
  },
  botLinkCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  botLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  botLinkTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  botLinkBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  botLinkText: {
    fontSize: 14,
    fontFamily: 'monospace' as const,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  linksPreviewBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  linkPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  linkPreviewTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  linkPreviewDesc: {
    fontSize: 13,
    lineHeight: 18,
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
