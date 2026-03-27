import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Mic, MicOff, Check, X, ArrowLeft, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';

type ParsedCommand = {
  debtorName: string;
  amount: number;
  action: 'add' | 'reduce' | 'check';
  confidence: number;
  currentDebt?: number;
};

export default function QuickVoiceCommandScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, addTransaction, addDebtor } = useDebt();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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
      console.log('Recording started (web)');
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
      console.log('Recording stopped (web)');
    }
  };

  const startRecordingNative = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('هەڵە', 'مۆڵەت پێنەدراوە بۆ تۆمارکردنی دەنگ');
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
      console.log('Recording started (native)');
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
      console.log('Recording stopped (native)');
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
      console.log('Processing audio (web)...');
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('Sending to STT API...');
      const sttResponse = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!sttResponse.ok) {
        const errorText = await sttResponse.text();
        console.error('STT failed:', sttResponse.status, errorText);
        Alert.alert('هەڵە', 'گوێگرتن لە دەنگ سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە');
        setAudioChunks([]);
        return;
      }

      const sttData = await sttResponse.json();
      console.log('Transcription result:', sttData);
      
      if (!sttData.text || sttData.text.trim() === '') {
        Alert.alert('هەڵە', 'هیچ دەنگێک نەبیستراوە. تکایە بە دەنگێکی بەرز قسە بکە و دووبارە هەوڵ بدەرەوە');
        setAudioChunks([]);
        return;
      }
      
      setTranscribedText(sttData.text);

      console.log('Parsing command with AI...');
      const parseResponse = await fetch('https://toolkit.rork.com/agent/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Parse this voice command in Kurdish/Arabic/English: "${sttData.text}"

Extract:
1. Name of person (debtor name)
2. Amount (number)
3. Action: "add" (adding debt/loan), "reduce" (payment/reducing debt), or "check" (asking about debt)

Examples:
"١٠٠٠ دینار لە قەرزی سامان کەم بکەوە" -> add is false, reduce is true
"سامان ١٠٠٠ دینار پارەی دایەوە" -> reduce is true (payment)
"١٠٠٠ دینار بخە سەر قەرزی سامان" -> add is true (new debt)
"سامان ١٠٠٠ قەرز کرد" -> add is true (new debt)
"قەرزی سامان چەندە؟" -> check is true (asking)
"سامان" -> check is true (asking about this person)

Return ONLY JSON:
{
  "debtorName": "name",
  "amount": number,
  "action": "add" or "reduce" or "check",
  "confidence": 0-1
}`,
            },
          ],
        }),
      });

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        console.error('Parsing failed:', parseResponse.status, errorText);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو. تکایە بە ڕوونی قسە بکە و دووبارە هەوڵ بدەرەوە');
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
        setTranscribedText('');
        setAudioChunks([]);
        return;
      }

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed command:', parsed);
        
        if (parsed.action === 'check') {
          const debtor = debtors.find(d => 
            d.name.toLowerCase().includes(parsed.debtorName.toLowerCase()) ||
            parsed.debtorName.toLowerCase().includes(d.name.toLowerCase())
          );
          
          if (debtor) {
            parsed.currentDebt = debtor.totalDebt;
          } else {
            Alert.alert('زانیاری', `هیچ کڕیارێک بە ناوی "${parsed.debtorName}" نەدۆزرایەوە`);
            setTranscribedText('');
            setAudioChunks([]);
            return;
          }
        }
        
        setParsedCommand(parsed);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو. تکایە بە ڕوونی قسە بکە');
        setTranscribedText('');
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
      console.log('Processing audio (native)...');
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

      console.log('Sending to STT API...');
      const sttResponse = await fetch('https://toolkit.rork.com/stt/transcribe/', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!sttResponse.ok) {
        const errorText = await sttResponse.text();
        console.error('STT failed:', sttResponse.status, errorText);
        Alert.alert('هەڵە', 'گوێگرتن لە دەنگ سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە');
        setRecording(null);
        return;
      }

      const sttData = await sttResponse.json();
      console.log('Transcription result:', sttData);
      
      if (!sttData.text || sttData.text.trim() === '') {
        Alert.alert('هەڵە', 'هیچ دەنگێک نەبیستراوە. تکایە بە دەنگێکی بەرز قسە بکە و دووبارە هەوڵ بدەرەوە');
        setRecording(null);
        return;
      }
      
      setTranscribedText(sttData.text);

      console.log('Parsing command with AI...');
      const parseResponse = await fetch('https://toolkit.rork.com/agent/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Parse this voice command in Kurdish/Arabic/English: "${sttData.text}"

Extract:
1. Name of person (debtor name)
2. Amount (number)
3. Action: "add" (adding debt/loan), "reduce" (payment/reducing debt), or "check" (asking about debt)

Examples:
"١٠٠٠ دینار لە قەرزی سامان کەم بکەوە" -> add is false, reduce is true
"سامان ١٠٠٠ دینار پارەی دایەوە" -> reduce is true (payment)
"١٠٠٠ دینار بخە سەر قەرزی سامان" -> add is true (new debt)
"سامان ١٠٠٠ قەرز کرد" -> add is true (new debt)
"قەرزی سامان چەندە؟" -> check is true (asking)
"سامان" -> check is true (asking about this person)

Return ONLY JSON:
{
  "debtorName": "name",
  "amount": number,
  "action": "add" or "reduce" or "check",
  "confidence": 0-1
}`,
            },
          ],
        }),
      });

      if (!parseResponse.ok) {
        const errorText = await parseResponse.text();
        console.error('Parsing failed:', parseResponse.status, errorText);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو. تکایە بە ڕوونی قسە بکە و دووبارە هەوڵ بدەرەوە');
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
          setRecording(null);
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
        setTranscribedText('');
        setRecording(null);
        return;
      }

      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('Parsed command:', parsed);
        
        if (parsed.action === 'check') {
          const debtor = debtors.find(d => 
            d.name.toLowerCase().includes(parsed.debtorName.toLowerCase()) ||
            parsed.debtorName.toLowerCase().includes(d.name.toLowerCase())
          );
          
          if (debtor) {
            parsed.currentDebt = debtor.totalDebt;
          } else {
            Alert.alert('زانیاری', `هیچ کڕیارێک بە ناوی "${parsed.debtorName}" نەدۆزرایەوە`);
            setTranscribedText('');
            setRecording(null);
            return;
          }
        }
        
        setParsedCommand(parsed);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        Alert.alert('هەڵە', 'شیکردنەوەی فەرمانەکە سەرکەوتوو نەبوو. تکایە بە ڕوونی قسە بکە');
        setTranscribedText('');
        setRecording(null);
        return;
      }

      setRecording(null);
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
      setParsedCommand(null);
      await startRecording();
    }
  };

  const handleConfirm = async () => {
    if (!parsedCommand) return;

    if (parsedCommand.action === 'check') {
      Alert.alert(
        'زانیاری قەرز',
        `${parsedCommand.debtorName}\nقەرزی ئێستا: ${parsedCommand.currentDebt?.toLocaleString('en-US')} IQD`,
        [{ text: 'باشە' }]
      );
      setParsedCommand(null);
      setTranscribedText('');
      return;
    }

    let debtor = debtors.find(d => 
      d.name.toLowerCase().includes(parsedCommand.debtorName.toLowerCase()) ||
      parsedCommand.debtorName.toLowerCase().includes(d.name.toLowerCase())
    );

    if (!debtor) {
      const debtorId = await addDebtor(parsedCommand.debtorName);
      debtor = debtors.find(d => d.id === debtorId);
      
      if (!debtor) {
        Alert.alert('هەڵە', 'دروستکردنی کڕیار سەرکەوتوو نەبوو');
        return;
      }
    }

    const transactionType = parsedCommand.action === 'add' ? 'debt' : 'payment';
    const description = parsedCommand.action === 'add' 
      ? `قەرزی ${parsedCommand.amount.toLocaleString('en-US')} دینار` 
      : `پارەدانی ${parsedCommand.amount.toLocaleString('en-US')} دینار`;

    await addTransaction(
      debtor.id,
      parsedCommand.amount,
      description,
      transactionType
    );

    Alert.alert(
      'سەرکەوتوو بوو',
      'فەرمانەکە بە سەرکەوتوویی جێبەجێ کرا',
      [
        {
          text: 'باشە',
          onPress: () => {
            setParsedCommand(null);
            setTranscribedText('');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'فەرماندانی دەنگی خێرا',
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
              <Zap size={32} color="#F59E0B" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>فەرماندانی دەنگی خێرا</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              بە دەنگەوە مامەڵە ئەنجام بدە
            </Text>
          </View>

          <View style={styles.recordingContainer}>
            <TouchableOpacity
              onPress={handleRecord}
              disabled={isProcessing}
              activeOpacity={0.8}
              style={[
                styles.micButton,
                {
                  backgroundColor: isRecording ? colors.error : colors.primary,
                },
              ]}
            >
              {isRecording ? (
                <MicOff size={48} color="#FFFFFF" />
              ) : (
                <Mic size={48} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <Text style={[styles.recordingStatus, { color: colors.textSecondary }]}>
              {isRecording ? 'تۆمارکردن... دوگمە بگرە بۆ وەستان' : 'دوگمە بگرە بۆ دەستپێکردن'}
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

          {parsedCommand && !isProcessing && (
            <View style={[styles.commandCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
              <View style={styles.commandHeader}>
                <Text style={[styles.commandTitle, { color: colors.text }]}>زانیاری فەرمان</Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: parsedCommand.confidence > 0.7 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)' }
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    { color: parsedCommand.confidence > 0.7 ? '#22C55E' : '#FCD34D' }
                  ]}>
                    دڵنیایی: {(parsedCommand.confidence * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>

              <View style={styles.commandDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>کڕیار:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{parsedCommand.debtorName}</Text>
                </View>
                
                {parsedCommand.action !== 'check' && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>بڕ:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {parsedCommand.amount.toLocaleString('en-US')} IQD
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>فەرمان:</Text>
                  <Text style={[
                    styles.detailValue,
                    { 
                      color: parsedCommand.action === 'add' 
                        ? colors.error 
                        : parsedCommand.action === 'reduce' 
                        ? colors.success 
                        : colors.primary 
                    }
                  ]}>
                    {parsedCommand.action === 'add' && 'زیادکردنی قەرز'}
                    {parsedCommand.action === 'reduce' && 'کەمکردنەوەی قەرز (پارەدان)'}
                    {parsedCommand.action === 'check' && 'پشکنینی قەرز'}
                  </Text>
                </View>

                {parsedCommand.action === 'check' && parsedCommand.currentDebt !== undefined && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>قەرزی ئێستا:</Text>
                    <Text style={[styles.detailValue, { color: colors.error }]}>
                      {parsedCommand.currentDebt.toLocaleString('en-US')} IQD
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.errorGlass }]}
                  onPress={() => {
                    setParsedCommand(null);
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
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                    {parsedCommand.action === 'check' ? 'بینین' : 'پەسەندکردن'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.tipsCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>نموونەی فەرمانەکان:</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • ١٠٠٠ دینار بخە سەر قەرزی سامان
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • ١٠٠٠ دینار لە قەرزی سامان کەم بکەوە
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • سامان ١٠٠٠ دینار پارەی دایەوە
            </Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              • قەرزی سامان چەندە؟
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
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
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
    marginBottom: 20,
  },
  recordingStatus: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
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
    textAlign: 'right',
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  commandCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  commandHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  commandTitle: {
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
  commandDetails: {
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
