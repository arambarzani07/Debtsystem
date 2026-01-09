import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Stack } from 'expo-router';
import { Mail, MessageCircle, Phone, Send } from 'lucide-react-native';

export default function ContactSupport() {
  const { colors } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('هەڵە', 'تکایە بابەت و نامەکە پڕبکەرەوە');
      return;
    }

    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSending(false);
    
    Alert.alert(
      'سوپاس!',
      'نامەکەت بە سەرکەوتوویی نێردرا. ئێمە لە کاتێکی نزیکدا وەڵامت دەدەینەوە.',
      [
        {
          text: 'باشە',
          onPress: () => {
            setSubject('');
            setMessage('');
            setEmail('');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: 'پشتگیری' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>پەیوەندیمان پێوە بکە</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          ئێمە ئامادەین بۆ یارمەتیدانت
        </Text>

        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <View style={styles.contactItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Mail size={24} color={colors.primary} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>ئیمەیڵ</Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>support@debtmanager.app</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
              <MessageCircle size={24} color={colors.success} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>واتساپ</Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>+964 750 123 4567</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warning + '20' }]}>
              <Phone size={24} color={colors.warning} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>تەلەفۆن</Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>+964 750 123 4567</Text>
            </View>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>نامەیەک بنێرە</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>ئیمەیڵ (ئارەزوومەندانە)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                borderColor: colors.glassBorder,
                color: colors.text,
              }]}
              placeholder="example@email.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>بابەت *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                borderColor: colors.glassBorder,
                color: colors.text,
              }]}
              placeholder="بابەتی نامەکە بنووسە"
              placeholderTextColor={colors.textSecondary}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>نامە *</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.background, 
                borderColor: colors.glassBorder,
                color: colors.text,
              }]}
              placeholder="وردەکاری پرسیار یان کێشەکەت بنووسە..."
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <Text style={styles.sendButtonText}>ناردن...</Text>
            ) : (
              <>
                <Send size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>ناردنی نامە</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>کاتی وەڵامدانەوە</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            ئێمە هەوڵ دەدەین لە ماوەی 24-48 کاتژمێردا وەڵامی هەموو پرسیارەکان بدەینەوە. بۆ کێشە فریاگوزارەکان، تکایە لە ڕێگەی واتساپەوە پەیوەندیمان پێوە بکە.
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginBottom: 8,
    textAlign: 'right' as const,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'right' as const,
  },
  contactCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 16,
  },
  contactTextContainer: {
    flex: 1,
    alignItems: 'flex-end' as const,
  },
  contactLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 20,
    textAlign: 'right' as const,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'right' as const,
    fontWeight: '600' as const,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlign: 'right' as const,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlign: 'right' as const,
    minHeight: 120,
  },
  sendButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginLeft: 8,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    textAlign: 'right' as const,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right' as const,
  },
  spacer: {
    height: 40,
  },
});
