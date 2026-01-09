import React, { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { HandshakeIcon, Send, Bot, User, CheckCircle2, XCircle, AlertCircle, TrendingDown, Calendar } from 'lucide-react-native';
import { generateText } from '@rork-ai/toolkit-sdk';

interface NegotiationMessage {
  id: string;
  role: 'ai' | 'user' | 'system';
  content: string;
  timestamp: string;
  offer?: {
    amount: number;
    installments?: number;
    dueDate?: string;
  };
  status?: 'pending' | 'accepted' | 'rejected' | 'counter';
}

interface NegotiationSession {
  debtorId: string;
  debtorName: string;
  totalDebt: number;
  messages: NegotiationMessage[];
  currentOffer?: {
    amount: number;
    installments?: number;
    dueDate?: string;
  };
  status: 'active' | 'completed' | 'failed';
}

export default function DebtNegotiationScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedDebtorId, setSelectedDebtorId] = useState<string | null>(
    typeof params.debtorId === 'string' ? params.debtorId : null
  );
  const [session, setSession] = useState<NegotiationSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const debtorsWithDebt = useMemo(() => {
    return debtors.filter(d => d.totalDebt > 0);
  }, [debtors]);

  useEffect(() => {
    if (selectedDebtorId && !session) {
      const debtor = debtors.find(d => d.id === selectedDebtorId);
      if (debtor) {
        const systemMessage: NegotiationMessage = {
          id: Date.now().toString(),
          role: 'system',
          content: `دەستپێکردنی گفتوگۆی لێدانی قەرز بۆ ${debtor.name}. کۆی قەرز: ${debtor.totalDebt.toLocaleString('en-US')} دینار`,
          timestamp: new Date().toISOString(),
          status: 'pending',
        };

        const welcomeMessage: NegotiationMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: `سڵاو! من یاریدەدەری AI م بۆ لێدانی قەرز. با یەکەوە پلانێکی گونجاو بدۆزینەوە بۆ قەرزەکەت کە ${debtor.totalDebt.toLocaleString('en-US')} دینارە.\n\nچۆنت پێباشە دەست بە لێدان بکەین؟\n\n1️⃣ دابەزاندنی بڕی قەرز\n2️⃣ خولی پارەدان (قیست)\n3️⃣ درێژکردنەوەی کات`,
          timestamp: new Date().toISOString(),
          status: 'pending',
        };

        setSession({
          debtorId: debtor.id,
          debtorName: debtor.name,
          totalDebt: debtor.totalDebt,
          messages: [systemMessage, welcomeMessage],
          status: 'active',
        });
      }
    }
  }, [selectedDebtorId, debtors, session]);

  useLayoutEffect(() => {
    if (session) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [session, fadeAnim]);

  useEffect(() => {
    if (session && session.messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [session?.messages.length, session]);

  const processUserMessage = useCallback(async (message: string) => {
    if (!session || !message.trim()) return;

    const userMessage: NegotiationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, userMessage],
      };
    });

    setInputMessage('');
    setIsProcessing(true);

    try {
      const conversationHistory = session.messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'ai' ? 'AI' : 'Customer'}: ${m.content}`)
        .join('\n');

      const prompt = `You are a debt negotiation AI assistant for a Kurdish business. The customer owes ${session.totalDebt} IQD.

Current conversation:
${conversationHistory}
Customer: ${message}

Analyze the customer's message and respond professionally in Kurdish (Sorani script). You should:
1. If they mention a specific payment amount, evaluate if it's reasonable (at least 30% of total debt for settlement)
2. If they request installments, suggest a plan (max 12 months)
3. If they want more time, negotiate a reasonable extension with conditions
4. Always try to reach a win-win agreement
5. Be empathetic but firm about payment

If the customer makes a concrete offer (amount, installments, or date), respond in this format:
OFFER: [amount in IQD]
INSTALLMENTS: [number or "none"]
DUE_DATE: [date or "immediate"]
RESPONSE: [Your response in Kurdish]
STATUS: [accepted/rejected/counter]

Otherwise just respond naturally in Kurdish.`;

      const aiResponse = await generateText(prompt);

      const offerMatch = aiResponse.match(/OFFER:\s*([\d,]+)/i);
      const installmentsMatch = aiResponse.match(/INSTALLMENTS:\s*(\d+|none)/i);
      const dueDateMatch = aiResponse.match(/DUE_DATE:\s*(.+?)(?=\n|$)/i);
      const responseMatch = aiResponse.match(/RESPONSE:\s*(.+?)(?=STATUS:|$)/is);
      const statusMatch = aiResponse.match(/STATUS:\s*(accepted|rejected|counter)/i);

      let aiMessageContent = responseMatch 
        ? responseMatch[1].trim() 
        : aiResponse.replace(/OFFER:.*/is, '').trim();

      if (!aiMessageContent) {
        aiMessageContent = aiResponse;
      }

      const aiMessage: NegotiationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiMessageContent,
        timestamp: new Date().toISOString(),
        status: statusMatch ? statusMatch[1] as any : 'pending',
      };

      if (offerMatch) {
        const amount = parseInt(offerMatch[1].replace(/,/g, ''));
        aiMessage.offer = {
          amount,
          installments: installmentsMatch && installmentsMatch[1] !== 'none' 
            ? parseInt(installmentsMatch[1]) 
            : undefined,
          dueDate: dueDateMatch && dueDateMatch[1] !== 'immediate' 
            ? dueDateMatch[1].trim() 
            : undefined,
        };
      }

      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, aiMessage],
          currentOffer: aiMessage.offer,
        };
      });

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: NegotiationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'ببورە، کێشەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.',
        timestamp: new Date().toISOString(),
      };

      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, errorMessage],
        };
      });
    } finally {
      setIsProcessing(false);
    }
  }, [session]);

  const acceptOffer = useCallback((offer: NegotiationMessage) => {
    if (!offer.offer) return;

    Alert.alert(
      'پەسەندکردنی پێشنیار',
      `ئایا دڵنیایت لە پەسەندکردنی ئەم پێشنیارە؟\n\nبڕ: ${offer.offer.amount.toLocaleString('en-US')} IQD${offer.offer.installments ? `\nقیست: ${offer.offer.installments} مانگ` : ''}${offer.offer.dueDate ? `\nبەروار: ${offer.offer.dueDate}` : ''}`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ، پەسەند دەکەم',
          onPress: () => {
            const acceptMessage: NegotiationMessage = {
              id: Date.now().toString(),
              role: 'system',
              content: `✅ پێشنیارەکە پەسەندکرا!\n\nبڕی ڕێککەوتن: ${offer.offer!.amount.toLocaleString('en-US')} IQD${offer.offer!.installments ? `\nقیست: ${offer.offer!.installments} مانگ` : ''}${offer.offer!.dueDate ? `\nبەروار: ${offer.offer!.dueDate}` : ''}`,
              timestamp: new Date().toISOString(),
              status: 'accepted',
            };

            setSession(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: [...prev.messages, acceptMessage],
                status: 'completed',
              };
            });

            Alert.alert('سەرکەوتوو', 'لێدانەکە تەواو بوو! دەتوانیت مامەڵەکە تۆمار بکەیت.');
          },
        },
      ]
    );
  }, []);

  const rejectOffer = useCallback(() => {
    const rejectMessage: NegotiationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: 'ببورە، ناتوانم ئەم پێشنیارە قبووڵ بکەم. با پێشنیارێکی تر بدەین.',
      timestamp: new Date().toISOString(),
    };

    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, rejectMessage],
      };
    });

    processUserMessage('پێشنیارێکی باشتر بدە تکایە');
  }, [processUserMessage]);

  const renderMessage = (message: NegotiationMessage) => {
    if (message.role === 'system') {
      return (
        <View key={message.id} style={[styles.systemMessage, { backgroundColor: colors.cardGlass }]}>
          <AlertCircle size={16} color={colors.textSecondary} />
          <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>
            {message.content}
          </Text>
        </View>
      );
    }

    const isAI = message.role === 'ai';
    const Icon = isAI ? Bot : User;

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isAI ? styles.aiMessageContainer : styles.userMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isAI 
              ? { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }
              : { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          <View style={styles.messageHeader}>
            <Icon size={16} color={isAI ? colors.primary : '#FFFFFF'} />
            <Text style={[
              styles.messageRole,
              { color: isAI ? colors.primary : '#FFFFFF' },
            ]}>
              {isAI ? 'یاریدەدەری AI' : 'تۆ'}
            </Text>
          </View>
          <Text style={[
            styles.messageContent,
            { color: isAI ? colors.text : '#FFFFFF' },
          ]}>
            {message.content}
          </Text>

          {message.offer && message.status !== 'accepted' && (
            <View style={[styles.offerCard, { 
              backgroundColor: colors.background + '88',
              borderColor: colors.glassBorder,
            }]}>
              <View style={styles.offerHeader}>
                <HandshakeIcon size={20} color={colors.success} />
                <Text style={[styles.offerTitle, { color: colors.text }]}>
                  پێشنیاری لێدان
                </Text>
              </View>
              
              <View style={styles.offerDetails}>
                <View style={styles.offerRow}>
                  <TrendingDown size={16} color={colors.success} />
                  <Text style={[styles.offerLabel, { color: colors.textSecondary }]}>
                    بڕ:
                  </Text>
                  <Text style={[styles.offerValue, { color: colors.success }]}>
                    {message.offer.amount.toLocaleString('en-US')} IQD
                  </Text>
                </View>

                {message.offer.installments && (
                  <View style={styles.offerRow}>
                    <Calendar size={16} color={colors.primary} />
                    <Text style={[styles.offerLabel, { color: colors.textSecondary }]}>
                      قیست:
                    </Text>
                    <Text style={[styles.offerValue, { color: colors.primary }]}>
                      {message.offer.installments} مانگ
                    </Text>
                  </View>
                )}

                {message.offer.dueDate && (
                  <View style={styles.offerRow}>
                    <Calendar size={16} color={colors.warning} />
                    <Text style={[styles.offerLabel, { color: colors.textSecondary }]}>
                      بەروار:
                    </Text>
                    <Text style={[styles.offerValue, { color: colors.warning }]}>
                      {message.offer.dueDate}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.offerActions}>
                <TouchableOpacity
                  style={[styles.offerButton, { backgroundColor: colors.error }]}
                  onPress={rejectOffer}
                >
                  <XCircle size={16} color="#FFFFFF" />
                  <Text style={styles.offerButtonText}>ڕەتکردنەوە</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.offerButton, { backgroundColor: colors.success }]}
                  onPress={() => acceptOffer(message)}
                >
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text style={styles.offerButtonText}>پەسەندکردن</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={[
            styles.messageTime,
            { color: isAI ? colors.textTertiary : 'rgba(255,255,255,0.7)' },
          ]}>
            {new Date(message.timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (!selectedDebtorId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <Stack.Screen 
          options={{
            title: 'لێدانی قەرز',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.headerCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <HandshakeIcon size={48} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                لێدانی قەرز بە AI
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                هەڵبژاردنی کڕیار بۆ دەستپێکردنی لێدان
              </Text>
            </View>

            {debtorsWithDebt.map(debtor => (
              <TouchableOpacity
                key={debtor.id}
                style={[styles.debtorCard, { 
                  backgroundColor: colors.cardGlass,
                  borderColor: colors.glassBorder,
                }]}
                onPress={() => setSelectedDebtorId(debtor.id)}
              >
                <View style={styles.debtorInfo}>
                  <Text style={[styles.debtorName, { color: colors.text }]}>
                    {debtor.name}
                  </Text>
                  <Text style={[styles.debtorDebt, { color: colors.error }]}>
                    {debtor.totalDebt.toLocaleString('en-US')} IQD
                  </Text>
                </View>
                <HandshakeIcon size={24} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <Stack.Screen 
        options={{
          title: session ? `لێدان لەگەڵ ${session.debtorName}` : 'لێدانی قەرز',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={100}
        >
          {session && (
            <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {session.messages.map(renderMessage)}
                {isProcessing && (
                  <View style={[styles.messageContainer, styles.aiMessageContainer]}>
                    <View style={[styles.messageBubble, { 
                      backgroundColor: colors.cardGlass,
                      borderColor: colors.glassBorder,
                    }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                        لە نووسینە...
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {session.status === 'active' && (
                <View style={[styles.inputContainer, { 
                  backgroundColor: colors.card,
                  borderColor: colors.glassBorder,
                }]}>
                  <TouchableOpacity
                    style={[styles.sendButton, { 
                      backgroundColor: inputMessage.trim() ? colors.primary : colors.cardGlass,
                    }]}
                    onPress={() => processUserMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isProcessing}
                  >
                    <Send size={20} color={inputMessage.trim() ? '#FFFFFF' : colors.textTertiary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="نامەکەت بنووسە..."
                    placeholderTextColor={colors.textTertiary}
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    multiline
                    maxLength={500}
                    editable={!isProcessing}
                  />
                </View>
              )}

              {session.status === 'completed' && (
                <View style={[styles.completedBanner, { backgroundColor: colors.success }]}>
                  <CheckCircle2 size={24} color="#FFFFFF" />
                  <Text style={styles.completedText}>
                    لێدانەکە بە سەرکەوتوویی تەواو بوو! ✨
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
  debtorCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  debtorInfo: {
    gap: 4,
  },
  debtorName: {
    fontSize: 18,
    fontWeight: '600' as const,
    writingDirection: 'rtl' as const,
  },
  debtorDebt: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  aiMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600' as const,
    writingDirection: 'rtl' as const,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 22,
    writingDirection: 'rtl' as const,
  },
  messageTime: {
    fontSize: 11,
    textAlign: 'right',
  },
  systemMessage: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  systemMessageText: {
    fontSize: 13,
    writingDirection: 'rtl' as const,
    flex: 1,
  },
  offerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  offerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    writingDirection: 'rtl' as const,
  },
  offerDetails: {
    gap: 8,
  },
  offerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  offerLabel: {
    fontSize: 14,
    writingDirection: 'rtl' as const,
  },
  offerValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'right',
  },
  offerActions: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 8,
  },
  offerButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    padding: 12,
  },
  offerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    writingDirection: 'rtl' as const,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic' as const,
    writingDirection: 'rtl' as const,
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  completedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    writingDirection: 'rtl' as const,
  },
});
