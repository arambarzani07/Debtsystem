import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  Modal,
  Clipboard,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { 
  ArrowRight, 
  MessageCircle,
  CheckCircle2,
  XCircle,
  Save,
  Trash2,
  Search,
  User,
  AlertCircle,
  RefreshCw,
  Zap,
  Link as LinkIcon,
  Copy,
  Share2,
  Globe,
  Download,
  UserPlus,
} from 'lucide-react-native';
import * as telegram from '@/utils/telegram';

export default function ManageChatIDsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<telegram.TelegramConfig | null>(null);
  const [chatIds, setChatIds] = useState<{ [debtorId: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [verifying, setVerifying] = useState<{ [debtorId: string]: boolean }>({});
  const [connectionStatus, setConnectionStatus] = useState<{ [debtorId: string]: boolean }>({});
  const [showAutoDetectModal, setShowAutoDetectModal] = useState(false);
  const [detectedChats, setDetectedChats] = useState<{ chatId: string; name: string; username?: string }[]>([]);
  const [botUsername, setBotUsername] = useState('');
  const [selectedDebtor, setSelectedDebtor] = useState<string | null>(null);
  const [showLinksModal, setShowLinksModal] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await telegram.getTelegramConfig();
      setConfig(savedConfig);
      setChatIds(savedConfig.chatIds || {});
      
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

  const handleSaveChatId = async (debtorId: string, chatId: string) => {
    if (!chatId.trim()) {
      setChatIds(prev => {
        const updated = { ...prev };
        delete updated[debtorId];
        return updated;
      });
      await telegram.removeDebtorChatId(debtorId);
      return;
    }

    setChatIds(prev => ({
      ...prev,
      [debtorId]: chatId,
    }));

    await telegram.setDebtorChatId(debtorId, chatId);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const newConfig = {
        ...config!,
        chatIds,
      };
      await telegram.saveTelegramConfig(newConfig);
      
      if (Platform.OS === 'web') {
        alert('هەموو Chat IDەکان پاشەکەوت کران! ✅');
      } else {
        Alert.alert('سەرکەوتوو', 'هەموو Chat IDەکان پاشەکەوت کران! ✅');
      }
    } catch (error) {
      console.error('Error saving all:', error);
      if (Platform.OS === 'web') {
        alert('هەڵە لە پاشەکەوتکردن');
      } else {
        Alert.alert('هەڵە', 'هەڵە لە پاشەکەوتکردن');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAutoDetect = async () => {
    if (!config?.botToken) {
      if (Platform.OS === 'web') {
        alert('تکایە سەرەتا Bot Token دابنێ');
      } else {
        Alert.alert('هەڵە', 'تکایە سەرەتا Bot Token دابنێ');
      }
      return;
    }

    setDetecting(true);
    try {
      const result = await telegram.detectChatIdsFromUpdates(config.botToken);
      
      if (result.success && result.chatIds && result.chatIds.length > 0) {
        setDetectedChats(result.chatIds);
        setShowAutoDetectModal(true);
      } else {
        if (Platform.OS === 'web') {
          alert('هیچ پەیوەندییەک نەدۆزرایەوە!\n\nتکایە:\n1️⃣ بەکارهێنەران لە Telegram بۆتەکەت بدۆزنەوە\n2️⃣ کلیک لە Start بکەن\n3️⃣ دووبارە هەوڵ بدەرەوە');
        } else {
          Alert.alert('هیچ پەیوەندییەک نەدۆزرایەوە', 'تکایە:\n1️⃣ بەکارهێنەران لە Telegram بۆتەکەت بدۆزنەوە\n2️⃣ کلیک لە Start بکەن\n3️⃣ دووبارە هەوڵ بدەرەوە');
        }
      }
    } catch (error) {
      console.error('Error detecting chat IDs:', error);
      if (Platform.OS === 'web') {
        alert('هەڵە لە دۆزینەوەی Chat IDەکان');
      } else {
        Alert.alert('هەڵە', 'هەڵە لە دۆزینەوەی Chat IDەکان');
      }
    } finally {
      setDetecting(false);
    }
  };

  const handleAssignDetectedChat = (debtorId: string, chatId: string) => {
    setChatIds(prev => ({
      ...prev,
      [debtorId]: chatId,
    }));
    setDetectedChats(prev => prev.filter(c => c.chatId !== chatId));
  };

  const handleVerifyConnection = async (debtorId: string) => {
    if (!config?.botToken || !chatIds[debtorId]) return;

    setVerifying(prev => ({ ...prev, [debtorId]: true }));
    try {
      const result = await telegram.verifyChatConnection(config.botToken, chatIds[debtorId]);
      setConnectionStatus(prev => ({ ...prev, [debtorId]: result.isActive }));
      
      if (result.isActive) {
        if (Platform.OS === 'web') {
          alert('✅ پەیوەندی چالاکە!');
        } else {
          Alert.alert('سەرکەوتوو', '✅ پەیوەندی چالاکە!');
        }
      } else {
        if (Platform.OS === 'web') {
          alert('❌ پەیوەندی ناچالاکە');
        } else {
          Alert.alert('هەڵە', '❌ پەیوەندی ناچالاکە');
        }
      }
    } catch (error) {
      console.error('Error verifying connection:', error);
    } finally {
      setVerifying(prev => ({ ...prev, [debtorId]: false }));
    }
  };

  const handleOpenBot = async () => {
    if (!botUsername) {
      if (Platform.OS === 'web') {
        alert('بۆت دەستنیشان نەکراوە');
      } else {
        Alert.alert('هەڵە', 'بۆت دەستنیشان نەکراوە');
      }
      return;
    }

    const deepLink = telegram.generateBotDeepLink(botUsername);
    try {
      const canOpen = await Linking.canOpenURL(deepLink);
      if (canOpen) {
        await Linking.openURL(deepLink);
      } else {
        if (Platform.OS === 'web') {
          window.open(deepLink, '_blank');
        }
      }
    } catch (error) {
      console.error('Error opening bot:', error);
    }
  };

  const handleDeleteChatId = async (debtorId: string) => {
    if (Platform.OS === 'web') {
      if (confirm('دڵنیایت لە سڕینەوەی Chat ID؟')) {
        setChatIds(prev => {
          const updated = { ...prev };
          delete updated[debtorId];
          return updated;
        });
        await telegram.removeDebtorChatId(debtorId);
      }
    } else {
      Alert.alert(
        'سڕینەوە',
        'دڵنیایت لە سڕینەوەی Chat ID؟',
        [
          { text: 'هەڵوەشاندنەوە', style: 'cancel' },
          {
            text: 'سڕینەوە',
            style: 'destructive',
            onPress: async () => {
              setChatIds(prev => {
                const updated = { ...prev };
                delete updated[debtorId];
                return updated;
              });
              await telegram.removeDebtorChatId(debtorId);
            },
          },
        ]
      );
    }
  };

  const filteredDebtors = debtors.filter(debtor => 
    debtor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debtor.phone?.includes(searchQuery)
  );

  const debtorsWithChatId = filteredDebtors.filter(d => chatIds[d.id]);
  const debtorsWithoutChatId = filteredDebtors.filter(d => !chatIds[d.id]);

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
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>بەڕێوەبردنی Chat IDs</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {Object.keys(chatIds).length} لە {debtors.length} کڕیار
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { 
            backgroundColor: colors.successGlass,
            borderColor: colors.success,
          }]}>
            <CheckCircle2 size={20} color={colors.success} />
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {debtorsWithChatId.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.success }]}>
                پەیوەستکراو
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.errorGlass,
            borderColor: colors.error,
          }]}>
            <XCircle size={20} color={colors.error} />
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {debtorsWithoutChatId.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.error }]}>
                پەیوەست نەکراو
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { 
              backgroundColor: colors.primaryGlass,
              borderColor: colors.primary,
            }]}
            onPress={handleAutoDetect}
            disabled={detecting || !config?.botToken}
          >
            {detecting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Zap size={18} color={colors.primary} />
            )}
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              دۆزینەوەی خۆکار
            </Text>
          </TouchableOpacity>

          {botUsername && (
            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: colors.successGlass,
                borderColor: colors.success,
              }]}
              onPress={handleOpenBot}
            >
              <LinkIcon size={18} color={colors.success} />
              <Text style={[styles.actionButtonText, { color: colors.success }]}>
                کردنەوەی بۆت
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.searchContainer, {
          backgroundColor: colors.cardGlass,
          borderColor: colors.glassBorder,
        }]}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="گەڕان بە ناو یان ژمارە..."
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {!config?.botToken && (
          <View style={[styles.warningCard, { 
            backgroundColor: colors.warningGlass,
            borderColor: colors.warning,
          }]}>
            <AlertCircle size={24} color={colors.warning} />
            <View style={styles.warningContent}>
              <Text style={[styles.warningTitle, { color: colors.text }]}>
                Bot Token دانەنراوە!
              </Text>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                تکایە سەرەتا بگەڕێوە بۆ ڕێکخستنەکان و Bot Token دابنێ
              </Text>
            </View>
          </View>
        )}

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {debtorsWithoutChatId.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <XCircle size={20} color={colors.error} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  پەیوەست نەکراوەکان ({debtorsWithoutChatId.length})
                </Text>
              </View>

              {debtorsWithoutChatId.map(debtor => (
                <View
                  key={debtor.id}
                  style={[styles.debtorCard, { 
                    backgroundColor: colors.cardGlass,
                    borderColor: colors.glassBorder,
                  }]}
                >
                  <View style={styles.debtorHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                      <User size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.debtorInfo}>
                      <Text style={[styles.debtorName, { color: colors.text }]}>
                        {debtor.name}
                      </Text>
                      {debtor.phone && (
                        <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>
                          {debtor.phone}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.chatIdInput, { 
                        backgroundColor: colors.background,
                        borderColor: colors.glassBorder,
                        color: colors.text,
                      }]}
                      value={chatIds[debtor.id] || ''}
                      onChangeText={(text) => handleSaveChatId(debtor.id, text)}
                      placeholder="Chat ID بنووسە..."
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                  </View>

                  {botUsername && (
                    <TouchableOpacity
                      style={[styles.linksButton, {
                        backgroundColor: colors.primaryGlass,
                        borderColor: colors.primary,
                      }]}
                      onPress={() => {
                        setSelectedDebtor(debtor.id);
                        setShowLinksModal(true);
                      }}
                    >
                      <Share2 size={16} color={colors.primary} />
                      <Text style={[styles.linksButtonText, { color: colors.primary }]}>
                        لینکەکانی کڕیار
                      </Text>
                    </TouchableOpacity>
                  )}

                  {detectedChats.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
                        پەیوەندییە دۆزراوەکان:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsList}>
                        {detectedChats.map((chat) => (
                          <TouchableOpacity
                            key={chat.chatId}
                            style={[styles.suggestionChip, {
                              backgroundColor: colors.primaryGlass,
                              borderColor: colors.primary,
                            }]}
                            onPress={() => handleAssignDetectedChat(debtor.id, chat.chatId)}
                          >
                            <User size={14} color={colors.primary} />
                            <Text style={[styles.suggestionName, { color: colors.primary }]}>
                              {chat.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {debtorsWithChatId.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CheckCircle2 size={20} color={colors.success} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  پەیوەستکراوەکان ({debtorsWithChatId.length})
                </Text>
              </View>

              {debtorsWithChatId.map(debtor => (
                <View
                  key={debtor.id}
                  style={[styles.debtorCard, { 
                    backgroundColor: colors.cardGlass,
                    borderColor: colors.glassBorder,
                  }]}
                >
                  <View style={styles.debtorHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.success }]}>
                      <MessageCircle size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.debtorInfo}>
                      <Text style={[styles.debtorName, { color: colors.text }]}>
                        {debtor.name}
                      </Text>
                      {debtor.phone && (
                        <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>
                          {debtor.phone}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: colors.errorGlass }]}
                      onPress={() => handleDeleteChatId(debtor.id)}
                    >
                      <Trash2 size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.chatIdInput, { 
                        backgroundColor: colors.background,
                        borderColor: colors.glassBorder,
                        color: colors.text,
                      }]}
                      value={chatIds[debtor.id] || ''}
                      onChangeText={(text) => handleSaveChatId(debtor.id, text)}
                      placeholder="Chat ID بنووسە..."
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={[styles.verifyButton, {
                        backgroundColor: connectionStatus[debtor.id] ? colors.successGlass : colors.primaryGlass,
                      }]}
                      onPress={() => handleVerifyConnection(debtor.id)}
                      disabled={verifying[debtor.id] || !chatIds[debtor.id]}
                    >
                      {verifying[debtor.id] ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <RefreshCw size={16} color={connectionStatus[debtor.id] ? colors.success : colors.primary} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {botUsername && (
                    <TouchableOpacity
                      style={[styles.linksButton, {
                        backgroundColor: colors.successGlass,
                        borderColor: colors.success,
                      }]}
                      onPress={() => {
                        setSelectedDebtor(debtor.id);
                        setShowLinksModal(true);
                      }}
                    >
                      <Share2 size={16} color={colors.success} />
                      <Text style={[styles.linksButtonText, { color: colors.success }]}>
                        لینکەکانی کڕیار
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {filteredDebtors.length === 0 && (
            <View style={styles.emptyContainer}>
              <Search size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ کڕیارێک نەدۆزرایەوە
              </Text>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={showAutoDetectModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAutoDetectModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {
              backgroundColor: colors.card,
              borderColor: colors.glassBorder,
            }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  پەیوەندییە دۆزراوەکان
                </Text>
                <TouchableOpacity onPress={() => setShowAutoDetectModal(false)}>
                  <XCircle size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {detectedChats.length} پەیوەندی دۆزرایەوە. کلیک لەسەر یەکێک بکە بۆ دیاریکردنی بۆ کڕیارێک.
                </Text>

                {detectedChats.map((chat) => (
                  <View
                    key={chat.chatId}
                    style={[styles.detectedChatCard, {
                      backgroundColor: colors.cardGlass,
                      borderColor: colors.glassBorder,
                    }]}
                  >
                    <View style={styles.detectedChatInfo}>
                      <View style={[styles.chatAvatar, { backgroundColor: colors.primaryGlass }]}>
                        <User size={20} color={colors.primary} />
                      </View>
                      <View style={styles.chatDetails}>
                        <Text style={[styles.chatName, { color: colors.text }]}>
                          {chat.name}
                        </Text>
                        {chat.username && (
                          <Text style={[styles.chatUsername, { color: colors.textSecondary }]}>
                            @{chat.username}
                          </Text>
                        )}
                        <Text style={[styles.chatId, { color: colors.textTertiary }]}>
                          ID: {chat.chatId}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.assignButtons}>
                      {debtorsWithoutChatId.slice(0, 3).map((debtor) => (
                        <TouchableOpacity
                          key={debtor.id}
                          style={[styles.assignButton, {
                            backgroundColor: colors.successGlass,
                            borderColor: colors.success,
                          }]}
                          onPress={() => {
                            handleAssignDetectedChat(debtor.id, chat.chatId);
                            if (detectedChats.length === 1) {
                              setShowAutoDetectModal(false);
                            }
                          }}
                        >
                          <Text style={[styles.assignButtonText, { color: colors.success }]}>
                            {debtor.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showLinksModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLinksModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, {
              backgroundColor: colors.card,
              borderColor: colors.glassBorder,
            }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  لینکەکانی کڕیار
                </Text>
                <TouchableOpacity onPress={() => setShowLinksModal(false)}>
                  <XCircle size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {selectedDebtor && (() => {
                  const debtor = debtors.find(d => d.id === selectedDebtor);
                  if (!debtor) return null;

                  const botLink = telegram.generateCustomerBotLink(botUsername, debtor.id);
                  const webLink = telegram.generateCustomerWebLink(debtor.id);
                  const downloadLink = telegram.generateAppDownloadLink();
                  const inviteLink = telegram.generateInvitationLink('market-id', debtor.id);

                  const handleCopy = async (text: string, label: string) => {
                    await Clipboard.setString(text);
                    if (Platform.OS === 'web') {
                      alert(`${label} کۆپی کرا! 📋`);
                    } else {
                      Alert.alert('سەرکەوتوو', `${label} کۆپی کرا! 📋`);
                    }
                  };

                  const handleShare = async (text: string) => {
                    if (Platform.OS === 'web') {
                      await Clipboard.setString(text);
                      alert('لینک کۆپی کرا! 📋');
                    } else {
                      try {
                        await Share.share({ message: text });
                      } catch (error) {
                        console.error('Error sharing:', error);
                      }
                    }
                  };

                  return (
                    <>
                      <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                        لینکە جیاوازەکان بۆ {debtor.name}
                      </Text>

                      <View style={[styles.linkCard, {
                        backgroundColor: colors.cardGlass,
                        borderColor: colors.primary,
                      }]}>
                        <View style={styles.linkHeader}>
                          <MessageCircle size={20} color={colors.primary} />
                          <Text style={[styles.linkTitle, { color: colors.text }]}>
                            لینکی بۆت
                          </Text>
                        </View>
                        <Text style={[styles.linkDescription, { color: colors.textSecondary }]}>
                          کڕیار کلیک لەسەر دەکات و خۆکار Chat ID تۆمار دەبێت
                        </Text>
                        <View style={[styles.linkBox, {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                        }]}>
                          <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                            {botLink}
                          </Text>
                        </View>
                        <View style={styles.linkActions}>
                          <TouchableOpacity
                            style={[styles.linkActionButton, {
                              backgroundColor: colors.primaryGlass,
                              borderColor: colors.primary,
                            }]}
                            onPress={() => handleCopy(botLink, 'لینکی بۆت')}
                          >
                            <Copy size={16} color={colors.primary} />
                            <Text style={[styles.linkActionText, { color: colors.primary }]}>
                              کۆپی
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.linkActionButton, {
                              backgroundColor: colors.successGlass,
                              borderColor: colors.success,
                            }]}
                            onPress={() => handleShare(botLink)}
                          >
                            <Share2 size={16} color={colors.success} />
                            <Text style={[styles.linkActionText, { color: colors.success }]}>
                              شەیرکردن
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={[styles.linkCard, {
                        backgroundColor: colors.cardGlass,
                        borderColor: colors.success,
                      }]}>
                        <View style={styles.linkHeader}>
                          <Globe size={20} color={colors.success} />
                          <Text style={[styles.linkTitle, { color: colors.text }]}>
                            لینکی وێب
                          </Text>
                        </View>
                        <Text style={[styles.linkDescription, { color: colors.textSecondary }]}>
                          کڕیار قەرزەکانی خۆی دەبینێت لە وێبسایت
                        </Text>
                        <View style={[styles.linkBox, {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                        }]}>
                          <Text style={[styles.linkText, { color: colors.success }]} numberOfLines={1}>
                            {webLink}
                          </Text>
                        </View>
                        <View style={styles.linkActions}>
                          <TouchableOpacity
                            style={[styles.linkActionButton, {
                              backgroundColor: colors.successGlass,
                              borderColor: colors.success,
                            }]}
                            onPress={() => handleCopy(webLink, 'لینکی وێب')}
                          >
                            <Copy size={16} color={colors.success} />
                            <Text style={[styles.linkActionText, { color: colors.success }]}>
                              کۆپی
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.linkActionButton, {
                              backgroundColor: colors.primaryGlass,
                              borderColor: colors.primary,
                            }]}
                            onPress={() => handleShare(webLink)}
                          >
                            <Share2 size={16} color={colors.primary} />
                            <Text style={[styles.linkActionText, { color: colors.primary }]}>
                              شەیرکردن
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={[styles.linkCard, {
                        backgroundColor: colors.cardGlass,
                        borderColor: colors.warning,
                      }]}>
                        <View style={styles.linkHeader}>
                          <Download size={20} color={colors.warning} />
                          <Text style={[styles.linkTitle, { color: colors.text }]}>
                            لینکی داونلۆد
                          </Text>
                        </View>
                        <Text style={[styles.linkDescription, { color: colors.textSecondary }]}>
                          کڕیار ئەپەکە دادەگرێت
                        </Text>
                        <View style={[styles.linkBox, {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                        }]}>
                          <Text style={[styles.linkText, { color: colors.warning }]} numberOfLines={1}>
                            {downloadLink}
                          </Text>
                        </View>
                        <View style={styles.linkActions}>
                          <TouchableOpacity
                            style={[styles.linkActionButton, {
                              backgroundColor: colors.warningGlass,
                              borderColor: colors.warning,
                            }]}
                            onPress={() => handleCopy(downloadLink, 'لینکی داونلۆد')}
                          >
                            <Copy size={16} color={colors.warning} />
                            <Text style={[styles.linkActionText, { color: colors.warning }]}>
                              کۆپی
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.linkActionButton, {
                              backgroundColor: colors.successGlass,
                              borderColor: colors.success,
                            }]}
                            onPress={() => handleShare(downloadLink)}
                          >
                            <Share2 size={16} color={colors.success} />
                            <Text style={[styles.linkActionText, { color: colors.success }]}>
                              شەیرکردن
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={[styles.linkCard, {
                        backgroundColor: colors.cardGlass,
                        borderColor: colors.error,
                      }]}>
                        <View style={styles.linkHeader}>
                          <UserPlus size={20} color={colors.error} />
                          <Text style={[styles.linkTitle, { color: colors.text }]}>
                            لینکی ئینڤایت
                          </Text>
                        </View>
                        <Text style={[styles.linkDescription, { color: colors.textSecondary }]}>
                          کڕیار دەتوانێت پەیوەست بێت بە سیستەمەکە
                        </Text>
                        <View style={[styles.linkBox, {
                          backgroundColor: colors.background,
                          borderColor: colors.glassBorder,
                        }]}>
                          <Text style={[styles.linkText, { color: colors.error }]} numberOfLines={1}>
                            {inviteLink}
                          </Text>
                        </View>
                        <View style={styles.linkActions}>
                          <TouchableOpacity
                            style={[styles.linkActionButton, {
                              backgroundColor: colors.errorGlass,
                              borderColor: colors.error,
                            }]}
                            onPress={() => handleCopy(inviteLink, 'لینکی ئینڤایت')}
                          >
                            <Copy size={16} color={colors.error} />
                            <Text style={[styles.linkActionText, { color: colors.error }]}>
                              کۆپی
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.linkActionButton, {
                              backgroundColor: colors.successGlass,
                              borderColor: colors.success,
                            }]}
                            onPress={() => handleShare(inviteLink)}
                          >
                            <Share2 size={16} color={colors.success} />
                            <Text style={[styles.linkActionText, { color: colors.success }]}>
                              شەیرکردن
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View style={[styles.footer, { 
          backgroundColor: colors.cardGlass,
          borderColor: colors.glassBorder,
        }]}>
          <TouchableOpacity
            style={[styles.saveButton, { 
              backgroundColor: colors.primary,
              opacity: saving ? 0.7 : 1,
            }]}
            onPress={handleSaveAll}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>پاشەکەوتکردنی هەمووان</Text>
              </>
            )}
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
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  warningCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  debtorCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  debtorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debtorInfo: {
    flex: 1,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  debtorPhone: {
    fontSize: 14,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatIdInput: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  verifyButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  detectedChatCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  detectedChatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatDetails: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  chatUsername: {
    fontSize: 13,
    marginBottom: 2,
  },
  chatId: {
    fontSize: 11,
    fontFamily: 'monospace' as const,
  },
  assignButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  assignButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  linksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  linksButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  linkCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  linkDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  linkBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 13,
    fontFamily: 'monospace' as const,
  },
  linkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  linkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
