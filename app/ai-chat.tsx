import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Bot, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { createRorkTool, useRorkAgent } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

export default function AIChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, addDebtor, addTransaction, getDebtor } = useDebt();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { messages, sendMessage } = useRorkAgent({
    tools: {
      getDebtSummary: createRorkTool({
        description: 'Get summary of all debts and debtors',
        zodSchema: z.object({}) as any,
        execute() {
          const totalDebt = debtors.reduce((sum, d) => sum + (d.totalDebt > 0 ? d.totalDebt : 0), 0);
          const totalCredit = debtors.reduce((sum, d) => sum + (d.totalDebt < 0 ? Math.abs(d.totalDebt) : 0), 0);
          const debtorsCount = debtors.length;
          
          return JSON.stringify({
            totalDebt,
            totalCredit,
            debtorsCount,
            debtorsWithDebt: debtors.filter(d => d.totalDebt > 0).length,
          });
        },
      }),
      searchDebtor: createRorkTool({
        description: 'Search for a debtor by name or phone',
        zodSchema: z.object({
          query: z.string().describe('Name or phone number to search'),
        }) as any,
        execute(input: { query: string }) {
          const results = debtors.filter(d => 
            d.name.toLowerCase().includes(input.query.toLowerCase()) ||
            (d.phone && d.phone.includes(input.query))
          );
          return JSON.stringify(results.map(d => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
            totalDebt: d.totalDebt,
            transactionsCount: d.transactions.length,
          })));
        },
      }),
      getDebtorDetails: createRorkTool({
        description: 'Get detailed information about a specific debtor',
        zodSchema: z.object({
          debtorId: z.string().describe('The ID of the debtor'),
        }) as any,
        execute(input: { debtorId: string }) {
          const debtor = getDebtor(input.debtorId);
          if (!debtor) {
            return JSON.stringify({ error: 'کڕیارەکە نەدۆزرایەوە' });
          }
          return JSON.stringify({
            name: debtor.name,
            phone: debtor.phone,
            totalDebt: debtor.totalDebt,
            category: debtor.category,
            transactions: debtor.transactions.map(t => ({
              amount: t.amount,
              type: t.type,
              date: t.date,
              description: t.description,
            })),
          });
        },
      }),
      addNewDebtor: createRorkTool({
        description: 'Add a new debtor to the system',
        zodSchema: z.object({
          name: z.string().describe('Name of the debtor'),
          phone: z.string().optional().describe('Phone number'),
        }) as any,
        execute(input: { name: string; phone?: string }) {
          const id = addDebtor(input.name, input.phone);
          return JSON.stringify({ success: true, debtorId: id, message: `کڕیاری ${input.name} زیادکرا` });
        },
      }),
      addNewTransaction: createRorkTool({
        description: 'Add a transaction (debt or payment) for a debtor',
        zodSchema: z.object({
          debtorId: z.string().describe('The ID of the debtor'),
          amount: z.number().describe('Amount of transaction'),
          description: z.string().describe('Description of transaction'),
          type: z.enum(['debt', 'payment']).describe('Type: debt or payment'),
        }) as any,
        async execute(input: { debtorId: string; amount: number; description: string; type: 'debt' | 'payment' }) {
          await addTransaction(
            input.debtorId,
            input.amount,
            input.description,
            input.type
          );
          return JSON.stringify({
            success: true,
            message: `مامەڵەکە تۆمارکرا: ${input.amount.toLocaleString('en-US')}`,
          });
        },
      }),
      getTopDebtors: createRorkTool({
        description: 'Get list of top debtors by amount',
        zodSchema: z.object({
          limit: z.number().optional().describe('Number of debtors to return (default 5)'),
        }) as any,
        execute(input: { limit?: number }) {
          const limit = input.limit || 5;
          const sorted = [...debtors]
            .filter(d => d.totalDebt > 0)
            .sort((a, b) => b.totalDebt - a.totalDebt)
            .slice(0, limit);
          
          return JSON.stringify(sorted.map((d, i) => ({
            rank: i + 1,
            name: d.name,
            phone: d.phone,
            totalDebt: d.totalDebt,
          })));
        },
      }),
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Bot size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>یاریدەدەری AI</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.welcomeContainer}>
                <View style={[styles.welcomeIcon, { backgroundColor: colors.primaryGlass }]}>
                  <Bot size={48} color={colors.primary} />
                </View>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                  سڵاو! چۆن دەتوانم یارمەتیت بدەم؟
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                  پرسیار لەبارەی قەرزەکانت بکە، کڕیار زیاد بکە، یان ئامارەکان ببینە
                </Text>
              </View>
            )}

            {messages.map((m) => (
              <View key={m.id} style={styles.messageGroup}>
                {m.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <View
                        key={`${m.id}-${i}`}
                        style={[
                          styles.messageBubble,
                          m.role === 'user'
                            ? [styles.userBubble, { backgroundColor: colors.primary }]
                            : [styles.aiBubble, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }],
                        ]}
                      >
                        <View style={styles.messageHeader}>
                          {m.role === 'user' ? (
                            <User size={16} color="#FFF" />
                          ) : (
                            <Bot size={16} color={colors.primary} />
                          )}
                          <Text
                            style={[
                              styles.messageSender,
                              { color: m.role === 'user' ? '#FFF' : colors.textSecondary },
                            ]}
                          >
                            {m.role === 'user' ? 'تۆ' : 'یاریدەدەر'}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.messageText,
                            { color: m.role === 'user' ? '#FFF' : colors.text },
                          ]}
                        >
                          {part.text}
                        </Text>
                      </View>
                    );
                  }

                  if (part.type === 'tool') {
                    const toolName = part.toolName;
                    
                    if (part.state === 'input-streaming' || part.state === 'input-available') {
                      return (
                        <View
                          key={`${m.id}-${i}`}
                          style={[
                            styles.toolBubble,
                            { backgroundColor: colors.warningGlass, borderColor: colors.warning + '40' },
                          ]}
                        >
                          <ActivityIndicator size="small" color={colors.warning} />
                          <Text style={[styles.toolText, { color: colors.warning }]}>
                            {toolName === 'getDebtSummary' && 'پوختەی قەرزەکان دەهێنرێتەوە...'}
                            {toolName === 'searchDebtor' && 'گەڕان بۆ کڕیار...'}
                            {toolName === 'getDebtorDetails' && 'زانیاری کڕیار دەهێنرێتەوە...'}
                            {toolName === 'addNewDebtor' && 'کڕیاری نوێ زیاد دەکرێت...'}
                            {toolName === 'addNewTransaction' && 'مامەڵە تۆمار دەکرێت...'}
                            {toolName === 'getTopDebtors' && 'کڕیارە سەرەکییەکان دەهێنرێنەوە...'}
                          </Text>
                        </View>
                      );
                    }

                    if (part.state === 'output-available') {
                      return (
                        <View
                          key={`${m.id}-${i}`}
                          style={[
                            styles.toolBubble,
                            { backgroundColor: colors.successGlass, borderColor: colors.success + '40' },
                          ]}
                        >
                          <Text style={[styles.toolText, { color: colors.success }]}>
                            ✓ {JSON.stringify(part.output, null, 2)}
                          </Text>
                        </View>
                      );
                    }

                    if (part.state === 'output-error') {
                      return (
                        <View
                          key={`${m.id}-${i}`}
                          style={[
                            styles.toolBubble,
                            { backgroundColor: colors.errorGlass, borderColor: colors.error + '40' },
                          ]}
                        >
                          <Text style={[styles.toolText, { color: colors.error }]}>
                            ✗ هەڵە: {part.errorText}
                          </Text>
                        </View>
                      );
                    }
                  }

                  return null;
                })}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: input.trim() ? colors.primary : colors.cardGlass,
                },
              ]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Send size={20} color={input.trim() ? '#FFF' : colors.textTertiary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="پرسیارێک بنووسە..."
              placeholderTextColor={colors.textTertiary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              multiline
              maxLength={500}
            />
          </View>
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
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 100,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  welcomeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  messageGroup: {
    marginBottom: 16,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 16,
    maxWidth: '85%',
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-start',
    marginLeft: 'auto',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  toolBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '85%',
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolText: {
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
  inputContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    textAlign: 'right',
    paddingVertical: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
