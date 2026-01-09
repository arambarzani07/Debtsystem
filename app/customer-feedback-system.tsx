import { useTheme } from '@/contexts/ThemeContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Star, MessageCircle, ThumbsUp, Send } from 'lucide-react-native';
import { useFeedbacks } from '@/contexts/FeedbackContext';
import { useDebt } from '@/contexts/DebtContext';

export default function CustomerFeedbackSystemScreen() {
  const { colors } = useTheme();
  const { feedbacks, addFeedback, respondToFeedback, markAsResolved, getPendingFeedbacks, getAverageRating } = useFeedbacks();
  const { debtors } = useDebt();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<'service' | 'product' | 'payment' | 'general'>('general');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const pendingFeedbacks = getPendingFeedbacks();
  const averageRating = getAverageRating();

  const handleAddFeedback = () => {
    if (!selectedDebtorId) {
      if (Platform.OS === 'web') {
        alert('تکایە کڕیارێک هەڵبژێرە');
      } else {
        Alert.alert('هەڵە', 'تکایە کڕیارێک هەڵبژێرە');
      }
      return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtorId);
    if (!debtor) return;

    addFeedback({
      debtorId: selectedDebtorId,
      debtorName: debtor.name,
      rating,
      comment,
      category,
    });

    setShowAddForm(false);
    setSelectedDebtorId('');
    setRating(5);
    setComment('');
    setCategory('general');

    if (Platform.OS === 'web') {
      alert('فیدباک زیادکرا');
    } else {
      Alert.alert('سەرکەوتوو', 'فیدباک زیادکرا');
    }
  };

  const handleRespond = (feedbackId: string) => {
    if (!responseText.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە وەڵام بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە وەڵام بنووسە');
      }
      return;
    }

    respondToFeedback(feedbackId, responseText);
    setRespondingTo(null);
    setResponseText('');

    if (Platform.OS === 'web') {
      alert('وەڵام نێردرا');
    } else {
      Alert.alert('سەرکەوتوو', 'وەڵام نێردرا');
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'service': return 'خزمەتگوزاری';
      case 'product': return 'بەرهەم';
      case 'payment': return 'پارەدان';
      case 'general': return 'گشتی';
      default: return cat;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'service': return colors.primary;
      case 'product': return colors.success;
      case 'payment': return colors.warning;
      case 'general': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.warningGlass, borderColor: colors.warning }]}>
              <Star size={24} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {averageRating.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>نمرەی ناوەند</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
              <MessageCircle size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{pendingFeedbacks.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>چاوەڕوان</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>فیدباکی نوێ زیاد بکە</Text>
          </TouchableOpacity>

          {showAddForm && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>فیدباکی نوێ</Text>
              
              <Text style={[styles.label, { color: colors.text }]}>کڕیار هەڵبژێرە</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.debtorScroll}>
                {debtors.map(debtor => (
                  <TouchableOpacity
                    key={debtor.id}
                    style={[
                      styles.chip,
                      { 
                        backgroundColor: selectedDebtorId === debtor.id ? colors.primary : colors.cardGlass,
                        borderColor: selectedDebtorId === debtor.id ? colors.primary : colors.glassBorder,
                      }
                    ]}
                    onPress={() => setSelectedDebtorId(debtor.id)}
                  >
                    <Text style={[styles.chipText, { color: selectedDebtorId === debtor.id ? '#FFFFFF' : colors.text }]}>
                      {debtor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.text }]}>جۆر</Text>
              <View style={styles.categoryRow}>
                {(['service', 'product', 'payment', 'general'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { 
                        backgroundColor: category === cat ? getCategoryColor(cat) + '33' : colors.cardGlass,
                        borderColor: category === cat ? getCategoryColor(cat) : colors.glassBorder,
                      }
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryText, { color: category === cat ? getCategoryColor(cat) : colors.text }]}>
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>نمرە: {rating}</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                  >
                    <Star
                      size={32}
                      color={star <= rating ? colors.warning : colors.textTertiary}
                      fill={star <= rating ? colors.warning : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>کۆمێنت</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={comment}
                onChangeText={setComment}
                placeholder="کۆمێنتەکەت بنووسە..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddFeedback}
                >
                  <Text style={styles.formButtonText}>زیادکردن</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, borderWidth: 1 }]}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={[styles.formButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {feedbacks.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ فیدباکێک تۆمار نەکراوە
              </Text>
            </View>
          ) : (
            feedbacks.map(feedback => {
              const categoryColor = getCategoryColor(feedback.category);
              
              return (
                <View key={feedback.id} style={[styles.feedbackCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.feedbackHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22' }]}>
                      <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                        {getCategoryLabel(feedback.category)}
                      </Text>
                    </View>
                    <Text style={[styles.feedbackName, { color: colors.text }]}>{feedback.debtorName}</Text>
                  </View>

                  <View style={styles.ratingDisplay}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={18}
                        color={star <= feedback.rating ? colors.warning : colors.textTertiary}
                        fill={star <= feedback.rating ? colors.warning : 'transparent'}
                      />
                    ))}
                  </View>

                  {feedback.comment && (
                    <Text style={[styles.feedbackComment, { color: colors.textSecondary }]}>
                      {feedback.comment}
                    </Text>
                  )}

                  {feedback.response && (
                    <View style={[styles.responseBox, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
                      <Text style={[styles.responseLabel, { color: colors.primary }]}>وەڵام:</Text>
                      <Text style={[styles.responseText, { color: colors.text }]}>
                        {feedback.response}
                      </Text>
                    </View>
                  )}

                  {feedback.status === 'pending' && respondingTo !== feedback.id && (
                    <TouchableOpacity
                      style={[styles.respondButton, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}
                      onPress={() => setRespondingTo(feedback.id)}
                    >
                      <ThumbsUp size={18} color={colors.primary} />
                      <Text style={[styles.respondButtonText, { color: colors.primary }]}>وەڵام بدەرەوە</Text>
                    </TouchableOpacity>
                  )}

                  {respondingTo === feedback.id && (
                    <View style={styles.responseForm}>
                      <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                        value={responseText}
                        onChangeText={setResponseText}
                        placeholder="وەڵامەکەت بنووسە..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={2}
                      />
                      <View style={styles.responseActions}>
                        <TouchableOpacity
                          style={[styles.sendButton, { backgroundColor: colors.primary }]}
                          onPress={() => handleRespond(feedback.id)}
                        >
                          <Send size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.cancelButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                          onPress={() => {
                            setRespondingTo(null);
                            setResponseText('');
                          }}
                        >
                          <Text style={[styles.cancelButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {feedback.status === 'responded' && (
                    <TouchableOpacity
                      style={[styles.resolveButton, { backgroundColor: colors.successGlass, borderColor: colors.success }]}
                      onPress={() => markAsResolved(feedback.id)}
                    >
                      <Text style={[styles.resolveButtonText, { color: colors.success }]}>نیشانی بدە وەک چارەسەرکراو</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 30, paddingTop: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 2, padding: 16, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 24, fontWeight: '700' as const },
  statLabel: { fontSize: 14 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, marginBottom: 20 },
  addButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 16, textAlign: 'right' },
  label: { fontSize: 14, fontWeight: '600' as const, marginBottom: 8, marginTop: 12, textAlign: 'right' },
  debtorScroll: { marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginLeft: 8 },
  chipText: { fontSize: 14, fontWeight: '600' as const },
  categoryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 14, fontWeight: '600' as const },
  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, textAlign: 'right' },
  textArea: { height: 80, textAlignVertical: 'top' },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  formButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  formButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  feedbackCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  feedbackHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feedbackName: { fontSize: 18, fontWeight: '700' as const, flex: 1, textAlign: 'right', marginRight: 12 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  categoryBadgeText: { fontSize: 12, fontWeight: '700' as const },
  ratingDisplay: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  feedbackComment: { fontSize: 14, lineHeight: 20, textAlign: 'right', marginBottom: 12 },
  responseBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  responseLabel: { fontSize: 13, fontWeight: '700' as const, marginBottom: 6, textAlign: 'right' },
  responseText: { fontSize: 14, lineHeight: 20, textAlign: 'right' },
  respondButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  respondButtonText: { fontSize: 14, fontWeight: '700' as const },
  responseForm: { gap: 12 },
  responseActions: { flexDirection: 'row', gap: 12 },
  sendButton: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelButtonText: { fontSize: 14, fontWeight: '700' as const },
  resolveButton: { paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  resolveButtonText: { fontSize: 14, fontWeight: '700' as const },
});
