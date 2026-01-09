import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Mic, MicOff, Check, X, ArrowLeft, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';

type ParsedTransaction = {
  debtorName: string;
  amount: number;
  type: 'debt' | 'payment';
  description: string;
  confidence: number;
};

export default function VoicePaymentScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, addTransaction, addDebtor } = useDebt();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [parsedTransaction, setParsedTransaction] = useState<ParsedTransaction | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      glowAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0.3);
    }
  }, [isRecording, pulseAnim, glowAnim]);

  const startRecordingWeb = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setAudioChunks(chunks);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('هەڵە', 'تۆمارکردنی دەنگ سەرکەوتوو نەبوو');
    }
  };

  const stopRecordingWeb = async () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const startRecordingNative = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('هەڵە', 'مۆڵەت پێدراوە بۆ تۆمارکردنی دەنگ');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        }
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('هەڵە', 'تۆمارکردنی دەنگ سەرکەوتوو نەبوو');
    }
  };

  const stopRecordingNative = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      setIsRecording(false);
      setRecording(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      await startRecordingWeb();
    } else {
      await startRecordingNative();
    }
  };

  const stopRecording = async () => {
    if (Platform.OS === 'web') {
      await stopRecordingWeb();
    } else {
      await stopRecordingNative();
    }
  };

  const processAudioWeb = async () => {
    if (audioChunks.length === 0) {
      console.error('No audio chunks to process');
      Alert.alert('هەڵە', 'هیچ دەنگێک تۆمار نەکراوە. تکایە دووبارە هەوڵ بدەرەوە');
      return;
    }

    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const sttResponse = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!sttResponse.ok) {
        const errorData = await sttResponse.text();
        console.error('STT Error:', errorData);
        Alert.alert('هەڵە', 'گوێگرتن لە دەنگ سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە');
        setAudioChunks([]);
        return;
      }

      const sttData = await sttResponse.json();
      console.log('Transcription:', sttData);
      
      if (!sttData.text || sttData.text.trim() === '') {
        Alert.alert('هەڵە', 'هیچ دەنگێک نەبیستراوە. تکایە دووبارە هەوڵ بدەرەوە');
        setIsProcessing(false);
        return;
      }
      
      setTranscribedText(sttData.text);

      const toolkitUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';
      const parseResponse = await fetch(`${toolkitUrl}/agent/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Parse this transaction from Kurdish/Arabic/English voice command: "${sttData.text}"
              
Extract:
1. Debtor name (name of person)
2. Amount (number only)
3. Type (is it debt/loan or payment?)
4. Description (brief description)

Return JSON format:
{
  "debtorName": "string",
  "amount": number,
  "type": "debt" or "payment",
  "description": "string",
  "confidence": number (0-1)
}

Examples:
"ئەحمەد ٥٠ هەزار قەرز کرد" -> {"debtorName":"ئەحمەد","amount":50000,"type":"debt","description":"قەرزی کرد","confidence":0.95}
"سەرهەنگ ٢٠ هەزار پارەی دایەوە" -> {"debtorName":"سەرهەنگ","amount":20000,"type":"payment","description":"پارەی دایەوە","confidence":0.95}`,
            },
          ],
        }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.text();
        console.error('Parse Error:', errorData);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو');
        return;
      }

      let fullText = '';
      
      if (parseResponse.body) {
        const reader = parseResponse.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
          }
        } catch (readError) {
          console.error('Error reading stream:', readError);
          Alert.alert('هەڵە', 'خوێندنەوەی وەڵام سەرکەوتوو نەبوو');
          setAudioChunks([]);
          return;
        }
      } else {
        fullText = await parseResponse.text();
      }

      console.log('AI Response:', fullText);

      const jsonMatch = fullText.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', fullText);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو. تکایە بە ڕوونی قسە بکە');
        setAudioChunks([]);
        return;
      }

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        setParsedTransaction(parsed);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو. تکایە بە ڕوونی قسە بکە');
        setAudioChunks([]);
        return;
      }

      setAudioChunks([]);
    } catch (error) {
      console.error('Error processing audio:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      Alert.alert('هەڵە', 'پرۆسەکردنی دەنگ سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudioNative = async () => {
    if (!recording) {
      console.error('No recording to process');
      Alert.alert('هەڵە', 'هیچ دەنگێک تۆمار نەکراوە. تکایە دووبارە هەوڵ بدەرەوە');
      return;
    }

    setIsProcessing(true);
    try {
      const uri = recording.getURI();
      if (!uri) {
        console.error('No recording URI');
        throw new Error('No recording URI');
      }

      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: `recording.${fileType}`,
        type: `audio/${fileType}`,
      } as any);

      const sttResponse = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!sttResponse.ok) {
        const errorData = await sttResponse.text();
        console.error('STT Error:', errorData);
        Alert.alert('هەڵە', 'گوێگرتن لە دەنگ سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە');
        return;
      }

      const sttData = await sttResponse.json();
      console.log('Transcription:', sttData);
      
      if (!sttData.text || sttData.text.trim() === '') {
        Alert.alert('هەڵە', 'هیچ دەنگێک نەبیستراوە. تکایە دووبارە هەوڵ بدەرەوە');
        setIsProcessing(false);
        return;
      }
      
      setTranscribedText(sttData.text);

      const toolkitUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';
      const parseResponse = await fetch(`${toolkitUrl}/agent/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Parse this transaction from Kurdish/Arabic/English voice command: "${sttData.text}"
              
Extract:
1. Debtor name (name of person)
2. Amount (number only)
3. Type (is it debt/loan or payment?)
4. Description (brief description)

Return JSON format:
{
  "debtorName": "string",
  "amount": number,
  "type": "debt" or "payment",
  "description": "string",
  "confidence": number (0-1)
}

Examples:
"ئەحمەد ٥٠ هەزار قەرز کرد" -> {"debtorName":"ئەحمەد","amount":50000,"type":"debt","description":"قەرزی کرد","confidence":0.95}
"سەرهەنگ ٢٠ هەزار پارەی دایەوە" -> {"debtorName":"سەرهەنگ","amount":20000,"type":"payment","description":"پارەی دایەوە","confidence":0.95}`,
            },
          ],
        }),
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.text();
        console.error('Parse Error:', errorData);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو');
        return;
      }

      let fullText = '';
      
      if (parseResponse.body) {
        const reader = parseResponse.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullText += decoder.decode(value, { stream: true });
          }
        } catch (readError) {
          console.error('Error reading stream:', readError);
          Alert.alert('هەڵە', 'خوێندنەوەی وەڵام سەرکەوتوو نەبوو');
          return;
        }
      } else {
        fullText = await parseResponse.text();
      }

      console.log('AI Response:', fullText);

      const jsonMatch = fullText.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', fullText);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو. تکایە بە ڕوونی قسە بکە');
        return;
      }

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        setParsedTransaction(parsed);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو. تکایە بە ڕوونی قسە بکە');
        return;
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      Alert.alert('هەڵە', 'پرۆسەکردنی دەنگ سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      await stopRecording();
      if (Platform.OS === 'web') {
        setTimeout(() => processAudioWeb(), 100);
      } else {
        await processAudioNative();
      }
    } else {
      setTranscribedText('');
      setParsedTransaction(null);
      await startRecording();
    }
  };

  const handleConfirm = async () => {
    if (!parsedTransaction) return;

    let debtor = debtors.find(d => 
      d.name.toLowerCase().includes(parsedTransaction.debtorName.toLowerCase()) ||
      parsedTransaction.debtorName.toLowerCase().includes(d.name.toLowerCase())
    );

    if (!debtor) {
      const debtorId = await addDebtor(parsedTransaction.debtorName);
      debtor = debtors.find(d => d.id === debtorId);
      
      if (!debtor) {
        Alert.alert('هەڵە', 'دروستکردنی کڕیار سەرکەوتوو نەبوو');
        return;
      }
    }

    await addTransaction(
      debtor.id,
      parsedTransaction.amount,
      parsedTransaction.description,
      parsedTransaction.type
    );

    Alert.alert(
      'سەرکەوتوو بوو',
      'مامەڵەکە بە سەرکەوتوویی تۆمار کرا',
      [
        {
          text: 'باشە',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const glowColor = isRecording 
    ? (colors.error || 'rgba(239, 68, 68, 0.6)') 
    : 'rgba(239, 68, 68, 0.3)';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'پارەدانی دەنگی',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Sparkles size={32} color="#FCD34D" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>پارەدانی دەنگی</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              بە دەنگەوە مامەڵە تۆمار بکە
            </Text>
          </View>

          <View style={styles.recordingContainer}>
            <TouchableOpacity
              onPress={handleRecord}
              disabled={isProcessing}
              activeOpacity={0.8}
              style={styles.micButtonWrapper}
            >
              <Animated.View
                style={[
                  styles.micButtonGlow,
                  {
                    backgroundColor: glowColor,
                    opacity: glowAnim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.micButton,
                  {
                    backgroundColor: isRecording ? colors.error : colors.primary,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                {isRecording ? (
                  <MicOff size={48} color="#FFFFFF" />
                ) : (
                  <Mic size={48} color="#FFFFFF" />
                )}
              </Animated.View>
            </TouchableOpacity>

            <Text style={[styles.recordingStatus, { color: colors.textSecondary }]}>
              {isRecording ? 'تۆمارکردن...' : 'دوگمە بگرە بۆ دەستپێکردن'}
            </Text>
          </View>

          {isProcessing && (
            <View style={[styles.processingCard, { backgroundColor: colors.cardGlass }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.processingText, { color: colors.text }]}>
                پرۆسەکردن...
              </Text>
            </View>
          )}

          {transcribedText && !isProcessing && (
            <View style={[styles.resultCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>دەقی گوێگیراو:</Text>
              <Text style={[styles.resultText, { color: colors.text }]}>{transcribedText}</Text>
            </View>
          )}

          {parsedTransaction && !isProcessing && (
            <View style={[styles.transactionCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
              <View style={styles.transactionHeader}>
                <Text style={[styles.transactionTitle, { color: colors.text }]}>زانیاری مامەڵە</Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: parsedTransaction.confidence > 0.7 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)' }
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    { color: parsedTransaction.confidence > 0.7 ? '#22C55E' : '#FCD34D' }
                  ]}>
                    دڵنیایی: {(parsedTransaction.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ناوی کڕیار:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{parsedTransaction.debtorName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>بڕ:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {parsedTransaction.amount.toLocaleString('en-US')} IQD
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>جۆر:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: parsedTransaction.type === 'debt' ? colors.error : colors.success }
                  ]}>
                    {parsedTransaction.type === 'debt' ? 'قەرز' : 'پارەدان'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>وەسف:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{parsedTransaction.description}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.errorGlass }]}
                  onPress={() => {
                    setParsedTransaction(null);
                    setTranscribedText('');
                  }}
                >
                  <X size={20} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>هەڵوەشاندنەوە</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton, { backgroundColor: colors.primary }]}
                  onPress={handleConfirm}
                >
                  <Check size={20} color="#FFFFFF" />
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>پەسەندکردن</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.tipsCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>ڕێنمایی:</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • ناوی کڕیار، بڕی پارە و جۆری مامەڵە (قەرز/پارەدان) بڵێ
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • نموونە: ئەحمەد ٥٠ هەزار قەرز کرد
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • نموونە: سەرهەنگ ٢٠ هەزار پارەی دایەوە
            </Text>
          </View>
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
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  recordingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  micButtonWrapper: {
    position: 'relative' as const,
    marginBottom: 20,
  },
  micButtonGlow: {
    position: 'absolute' as const,
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -20,
    left: -20,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  recordingStatus: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  processingCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  processingText: {
    fontSize: 16,
    marginTop: 16,
  },
  resultCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
  },
  transactionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  transactionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  transactionDetails: {
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  actionButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  cancelButton: {
  },
  confirmButton: {
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  tipsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: 4,
  },
});
