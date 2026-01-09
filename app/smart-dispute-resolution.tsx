import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Scale,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  Send,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react-native';

interface Dispute {
  id: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  reason: string;
  reasonKu: string;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  createdAt: string;
  messages: DisputeMessage[];
  aiSuggestion?: string;
  aiSuggestionKu?: string;
  resolution?: string;
}

interface DisputeMessage {
  id: string;
  sender: 'customer' | 'business' | 'ai';
  message: string;
  timestamp: string;
}

export default function SmartDisputeResolution() {
  const { debtors } = useDebt();
  const { language } = useLanguage();
  const { settings } = useTheme();

  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: '1',
      debtorId: debtors[0]?.id || '1',
      debtorName: debtors[0]?.name || 'أحمد محمد',
      amount: 500000,
      reason: 'Already paid in cash but not recorded',
      reasonKu: 'پێشتر بە کاش پارەم داوە بەڵام تۆمار نەکراوە',
      status: 'pending',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'm1',
          sender: 'customer',
          message: 'I paid 500,000 IQD in cash last week',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  ]);

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [messageText, setMessageText] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_review': return '#06b6d4';
      case 'resolved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    const size = 20;
    switch (status) {
      case 'pending': return <Clock color={getStatusColor(status)} size={size} />;
      case 'in_review': return <MessageSquare color={getStatusColor(status)} size={size} />;
      case 'resolved': return <CheckCircle color={getStatusColor(status)} size={size} />;
      case 'rejected': return <XCircle color={getStatusColor(status)} size={size} />;
      default: return <AlertTriangle color={getStatusColor(status)} size={size} />;
    }
  };

  const generateAISuggestion = (dispute: Dispute) => {
    const updatedDispute = { ...dispute };
    
    if (dispute.reason.toLowerCase().includes('paid') || dispute.reason.toLowerCase().includes('cash')) {
      updatedDispute.aiSuggestion = 'Request proof of payment. If verified, adjust records accordingly. Offer to schedule a meeting to review transaction history.';
      updatedDispute.aiSuggestionKu = 'داوای بەڵگەی پارەدان بکە. ئەگەر دڵنیا بوویتەوە، تۆمارەکان دروست بکە. پێشنیاری کۆبوونەوە بکە بۆ پێداچوونەوەی مێژووی مامەڵەکان.';
    } else {
      updatedDispute.aiSuggestion = 'Review the transaction history and communicate with the customer. Consider offering a payment plan.';
      updatedDispute.aiSuggestionKu = 'مێژووی مامەڵەکان پێداچووەوە و لەگەڵ کڕیار قسە بکە. بیر لە پلانی پارەدان بکەرەوە.';
    }

    updatedDispute.status = 'in_review';
    
    setDisputes(disputes.map(d => d.id === dispute.id ? updatedDispute : d));
    setSelectedDispute(updatedDispute);
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedDispute) return;

    const newMessage: DisputeMessage = {
      id: Date.now().toString(),
      sender: 'business',
      message: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedDispute = {
      ...selectedDispute,
      messages: [...selectedDispute.messages, newMessage],
    };

    setDisputes(disputes.map(d => d.id === selectedDispute.id ? updatedDispute : d));
    setSelectedDispute(updatedDispute);
    setMessageText('');
  };

  const resolveDispute = (disputeId: string, resolution: 'resolved' | 'rejected') => {
    Alert.alert(
      language === 'ku' ? 'دڵنیایی' : 'Confirm',
      language === 'ku'
        ? `دڵنیای لە ${resolution === 'resolved' ? 'چارەسەرکردن' : 'ڕەتکردنەوە'}ی ناکۆکی؟`
        : `Are you sure you want to ${resolution === 'resolved' ? 'resolve' : 'reject'} this dispute?`,
      [
        { text: language === 'ku' ? 'هەڵوەشاندنەوە' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ku' ? 'دڵنیام' : 'Confirm',
          onPress: () => {
            setDisputes(disputes.map(d =>
              d.id === disputeId
                ? { ...d, status: resolution, resolution: resolution === 'resolved' ? 'Dispute resolved successfully' : 'Dispute rejected' }
                : d
            ));
            setSelectedDispute(null);
          },
        },
      ]
    );
  };

  const isDark = settings.theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: language === 'ku' ? 'چارەسەرکردنی ناکۆکی' : 'Dispute Resolution',
          headerStyle: { backgroundColor: cardBg },
          headerTintColor: textColor,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: '#8b5cf6' }]}>
          <View style={styles.heroContent}>
            <Scale color="#ffffff" size={48} />
            <Text style={styles.heroTitle}>
              {language === 'ku' ? 'چارەسەری زیرەک' : 'Smart Resolution'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {language === 'ku'
                ? 'چارەسەرکردنی ناکۆکیەکان بە یارمەتی AI'
                : 'Resolve disputes with AI assistance'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.statsRow, { marginBottom: 20 }]}>
            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
              <Clock color="#f59e0b" size={24} />
              <Text style={[styles.statValue, { color: textColor }]}>
                {disputes.filter(d => d.status === 'pending').length}
              </Text>
              <Text style={[styles.statLabel, { color: subTextColor }]}>
                {language === 'ku' ? 'چاوەڕوان' : 'Pending'}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
              <MessageSquare color="#06b6d4" size={24} />
              <Text style={[styles.statValue, { color: textColor }]}>
                {disputes.filter(d => d.status === 'in_review').length}
              </Text>
              <Text style={[styles.statLabel, { color: subTextColor }]}>
                {language === 'ku' ? 'لە پێداچوونەوەدا' : 'In Review'}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
              <CheckCircle color="#10b981" size={24} />
              <Text style={[styles.statValue, { color: textColor }]}>
                {disputes.filter(d => d.status === 'resolved').length}
              </Text>
              <Text style={[styles.statLabel, { color: subTextColor }]}>
                {language === 'ku' ? 'چارەسەرکراو' : 'Resolved'}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {language === 'ku' ? 'ناکۆکیەکان' : 'Disputes'}
          </Text>

          {disputes.map((dispute) => (
            <TouchableOpacity
              key={dispute.id}
              style={[styles.disputeCard, { backgroundColor: cardBg, borderColor }]}
              onPress={() => setSelectedDispute(dispute)}
              activeOpacity={0.7}
            >
              <View style={styles.disputeHeader}>
                <View style={styles.disputeInfo}>
                  <View style={styles.disputeRow}>
                    <User color={subTextColor} size={18} />
                    <Text style={[styles.debtorName, { color: textColor }]}>
                      {dispute.debtorName}
                    </Text>
                  </View>
                  <View style={styles.disputeRow}>
                    <DollarSign color={subTextColor} size={18} />
                    <Text style={[styles.amount, { color: textColor }]}>
                      {dispute.amount.toLocaleString()} IQD
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispute.status) + '20' }]}>
                  {getStatusIcon(dispute.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(dispute.status) }]}>
                    {dispute.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={[styles.reason, { color: subTextColor }]}>
                {language === 'ku' ? dispute.reasonKu : dispute.reason}
              </Text>

              <Text style={[styles.timestamp, { color: subTextColor }]}>
                {new Date(dispute.createdAt).toLocaleString()}
              </Text>

              {dispute.aiSuggestion && (
                <View style={[styles.aiSuggestion, { backgroundColor: '#8b5cf6' + '15' }]}>
                  <ShieldCheck color="#8b5cf6" size={16} />
                  <Text style={[styles.aiSuggestionText, { color: '#8b5cf6' }]}>
                    {language === 'ku' ? dispute.aiSuggestionKu : dispute.aiSuggestion}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={selectedDispute !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDispute(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {selectedDispute?.debtorName}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDispute(null)}>
                <XCircle color={subTextColor} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
              {selectedDispute?.messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBox,
                    msg.sender === 'customer'
                      ? [styles.customerMessage, { backgroundColor: '#06b6d4' + '20' }]
                      : msg.sender === 'ai'
                      ? [styles.aiMessage, { backgroundColor: '#8b5cf6' + '20' }]
                      : [styles.businessMessage, { backgroundColor: '#10b981' + '20' }],
                  ]}
                >
                  <Text style={[styles.messageText, { color: textColor }]}>
                    {msg.message}
                  </Text>
                  <Text style={[styles.messageTime, { color: subTextColor }]}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {selectedDispute && selectedDispute.status !== 'resolved' && selectedDispute.status !== 'rejected' && (
              <>
                {!selectedDispute.aiSuggestion && (
                  <TouchableOpacity
                    style={[styles.aiButton, { backgroundColor: '#8b5cf6' }]}
                    onPress={() => generateAISuggestion(selectedDispute)}
                  >
                    <ShieldCheck color="#ffffff" size={20} />
                    <Text style={styles.aiButtonText}>
                      {language === 'ku' ? 'داوای یارمەتی AI' : 'Get AI Suggestion'}
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', color: textColor }]}
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder={language === 'ku' ? 'نامەکەت بنووسە...' : 'Type your message...'}
                    placeholderTextColor={subTextColor}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.sendButton, { backgroundColor: '#06b6d4' }]}
                    onPress={sendMessage}
                  >
                    <Send color="#ffffff" size={20} />
                  </TouchableOpacity>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                    onPress={() => resolveDispute(selectedDispute.id, 'resolved')}
                  >
                    <CheckCircle color="#ffffff" size={20} />
                    <Text style={styles.actionButtonText}>
                      {language === 'ku' ? 'چارەسەرکردن' : 'Resolve'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                    onPress={() => resolveDispute(selectedDispute.id, 'rejected')}
                  >
                    <XCircle color="#ffffff" size={20} />
                    <Text style={styles.actionButtonText}>
                      {language === 'ku' ? 'ڕەتکردنەوە' : 'Reject'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#ede9fe',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  disputeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  disputeInfo: {
    flex: 1,
    gap: 6,
  },
  disputeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '700',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reason: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
  },
  aiSuggestion: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
  },
  aiSuggestionText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  messagesContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  messageBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  customerMessage: {
    marginRight: 40,
  },
  businessMessage: {
    marginLeft: 40,
  },
  aiMessage: {
    marginHorizontal: 20,
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
