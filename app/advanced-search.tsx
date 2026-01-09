import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Search, Calendar, Tag, User, X, Mic, StopCircle, TrendingUp, TrendingDown, Filter, ChevronDown, ChevronUp, DollarSign, Phone } from 'lucide-react-native';
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { DebtorCategory, ColorTag } from '@/types';
import { startRecording, stopRecording, transcribeAudio } from '@/utils/voiceCommands';
import { CATEGORY_COLORS, CATEGORY_LABELS, COLOR_TAG_MAP } from '@/constants/colors';

export default function AdvancedSearchScreen() {
  const { debtors } = useDebt();
  const { colors } = useTheme();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DebtorCategory | 'all'>('all');
  const [selectedColorTag, setSelectedColorTag] = useState<ColorTag | 'all'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'date'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(true);
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  
  const filtersAnimation = useRef(new Animated.Value(1)).current;
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  const filteredResults = useMemo(() => {
    setIsApplyingFilters(true);
    let results = [...debtors];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(debtor => 
        debtor.name.toLowerCase().includes(query) ||
        debtor.nameEn?.toLowerCase().includes(query) ||
        debtor.phone?.includes(query)
      );
    }
    
    if (startDate) {
      const start = new Date(startDate);
      results = results.filter(debtor => 
        debtor.transactions.some(t => new Date(t.date) >= start)
      );
    }
    
    if (endDate) {
      const end = new Date(endDate);
      results = results.filter(debtor => 
        debtor.transactions.some(t => new Date(t.date) <= end)
      );
    }
    
    if (selectedCategory !== 'all') {
      results = results.filter(debtor => debtor.category === selectedCategory);
    }
    
    if (selectedColorTag !== 'all') {
      results = results.filter(debtor => debtor.colorTag === selectedColorTag);
    }
    
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        results = results.filter(debtor => debtor.totalDebt >= min);
      }
    }
    
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        results = results.filter(debtor => debtor.totalDebt <= max);
      }
    }
    
    results.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'amount':
          compareValue = a.totalDebt - b.totalDebt;
          break;
        case 'date':
          const dateA = a.transactions.length > 0 ? new Date(a.transactions[a.transactions.length - 1].date).getTime() : 0;
          const dateB = b.transactions.length > 0 ? new Date(b.transactions[b.transactions.length - 1].date).getTime() : 0;
          compareValue = dateA - dateB;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    setTimeout(() => setIsApplyingFilters(false), 300);
    return results;
  }, [debtors, searchQuery, startDate, endDate, selectedCategory, selectedColorTag, minAmount, maxAmount, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
    setSelectedColorTag('all');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('amount');
    setSortOrder('desc');
  };
  
  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    setShowFilters(!showFilters);
    Animated.spring(filtersAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  };
  
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (startDate) count++;
    if (endDate) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedColorTag !== 'all') count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    return count;
  }, [searchQuery, startDate, endDate, selectedCategory, selectedColorTag, minAmount, maxAmount]);
  
  const totalDebtSum = useMemo(() => {
    return filteredResults.reduce((sum, debtor) => sum + debtor.totalDebt, 0);
  }, [filteredResults]);
  
  const averageDebt = useMemo(() => {
    return filteredResults.length > 0 ? totalDebtSum / filteredResults.length : 0;
  }, [totalDebtSum, filteredResults.length]);

  const handleVoiceSearch = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribing(true);
      
      const recording = await stopRecording();
      if (!recording) {
        Alert.alert('هەڵە', 'هەڵە لە وەستاندنی تۆمارکردن');
        setIsTranscribing(false);
        return;
      }

      const transcription = await transcribeAudio(recording.uri);
      setIsTranscribing(false);
      
      if (transcription) {
        setSearchQuery(transcription);
      } else {
        Alert.alert('هەڵە', 'هەڵە لە گۆڕینی دەنگ بۆ نووسین');
      }
    } else {
      const success = await startRecording();
      if (success) {
        setIsRecording(true);
      } else {
        Alert.alert('هەڵە', 'هەڵە لە دەستپێکردنی تۆمارکردن');
      }
    }
  }, [isRecording]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.scrollView} stickyHeaderIndices={[0]}>
          <View style={[styles.searchSection, { backgroundColor: colors.background }]}>
            <View style={styles.searchHeader}>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>گەڕانی پێشکەوتوو</Text>
                <View style={[styles.filterBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Filter size={14} color={colors.primary} />
                  <Text style={[styles.filterBadgeText, { color: colors.primary }]}>{activeFiltersCount}</Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.toggleButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={toggleFilters}
                >
                  {showFilters ? <ChevronUp size={20} color={colors.primary} /> : <ChevronDown size={20} color={colors.primary} />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: colors.error }]}
                  onPress={clearFilters}
                >
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.searchInputWrapper, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="گەڕان بە ناو، ناوی ئینگلیزی یان ژمارە..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                onPress={handleVoiceSearch}
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : isRecording ? (
                  <StopCircle size={20} color="#EF4444" />
                ) : (
                  <Mic size={20} color="#3B82F6" />
                )}
              </TouchableOpacity>
            </View>
            
            <Animated.View style={{
              maxHeight: filtersAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 2000],
              }),
              opacity: filtersAnimation,
              overflow: 'hidden' as const,
            }}>

            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Calendar size={18} color={colors.primary} />
                <Text style={[styles.filterLabel, { color: colors.text }]}>بەرواری دەستپێک</Text>
              </View>
              <TouchableOpacity
                style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => {
                  if (startDate) {
                    setTempStartDate(new Date(startDate));
                  }
                  setShowStartDatePicker(true);
                }}
              >
                <Text style={[styles.dateInputText, { color: startDate ? colors.text : colors.textTertiary }]}>
                  {startDate || 'YYYY-MM-DD'}
                </Text>
                <Calendar size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {showStartDatePicker && (
              <DateTimePicker
                value={tempStartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowStartDatePicker(false);
                  }
                  if (event.type === 'set' && selectedDate) {
                    const formatted = selectedDate.toISOString().split('T')[0];
                    setStartDate(formatted);
                    setTempStartDate(selectedDate);
                    if (Platform.OS === 'ios') {
                      setShowStartDatePicker(false);
                    }
                  } else if (event.type === 'dismissed') {
                    setShowStartDatePicker(false);
                  }
                }}
              />
            )}

            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Calendar size={18} color={colors.primary} />
                <Text style={[styles.filterLabel, { color: colors.text }]}>بەرواری کۆتایی</Text>
              </View>
              <TouchableOpacity
                style={[styles.dateInput, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => {
                  if (endDate) {
                    setTempEndDate(new Date(endDate));
                  }
                  setShowEndDatePicker(true);
                }}
              >
                <Text style={[styles.dateInputText, { color: endDate ? colors.text : colors.textTertiary }]}>
                  {endDate || 'YYYY-MM-DD'}
                </Text>
                <Calendar size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {showEndDatePicker && (
              <DateTimePicker
                value={tempEndDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowEndDatePicker(false);
                  }
                  if (event.type === 'set' && selectedDate) {
                    const formatted = selectedDate.toISOString().split('T')[0];
                    setEndDate(formatted);
                    setTempEndDate(selectedDate);
                    if (Platform.OS === 'ios') {
                      setShowEndDatePicker(false);
                    }
                  } else if (event.type === 'dismissed') {
                    setShowEndDatePicker(false);
                  }
                }}
              />
            )}

            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <User size={18} color={colors.primary} />
                <Text style={[styles.filterLabel, { color: colors.text }]}>پۆلێن</Text>
              </View>
              <View style={styles.categoryButtons}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    selectedCategory === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={[styles.categoryButtonText, { color: selectedCategory === 'all' ? '#fff' : colors.text }]}>
                    هەموو
                  </Text>
                </TouchableOpacity>
                {(['VIP', 'Regular', 'Wholesale'] as DebtorCategory[]).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: selectedCategory === cat ? CATEGORY_COLORS[cat] + '33' : colors.card,
                        borderColor: selectedCategory === cat ? CATEGORY_COLORS[cat] : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      { color: selectedCategory === cat ? CATEGORY_COLORS[cat] : colors.text },
                    ]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Tag size={18} color={colors.primary} />
                <Text style={[styles.filterLabel, { color: colors.text }]}>تاگی ڕەنگ</Text>
              </View>
              <View style={styles.colorTagButtons}>
                <TouchableOpacity
                  style={[
                    styles.colorTagButton,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    selectedColorTag === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedColorTag('all')}
                >
                  <Text style={[styles.colorTagButtonText, { color: selectedColorTag === 'all' ? '#fff' : colors.text }]}>
                    هەموو
                  </Text>
                </TouchableOpacity>
                {(['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as ColorTag[]).map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.colorTagButton,
                      {
                        backgroundColor: selectedColorTag === tag ? COLOR_TAG_MAP[tag] : colors.card,
                        borderColor: COLOR_TAG_MAP[tag],
                      },
                    ]}
                    onPress={() => setSelectedColorTag(tag)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>بڕی قەرز</Text>
              <View style={styles.amountInputs}>
                <TextInput
                  style={[styles.amountInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                  placeholder="لە"
                  placeholderTextColor={colors.textTertiary}
                  value={minAmount}
                  onChangeText={setMinAmount}
                  keyboardType="numeric"
                />
                <Text style={[styles.amountSeparator, { color: colors.textSecondary }]}>-</Text>
                <TextInput
                  style={[styles.amountInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                  placeholder="بۆ"
                  placeholderTextColor={colors.textTertiary}
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>
            </Animated.View>
            
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                <DollarSign size={20} color={colors.primary} />
                <View style={styles.statContent}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{totalDebtSum.toLocaleString('en-US')}</Text>
                  <Text style={[styles.statLabel, { color: colors.primary }]}>کۆی قەرز</Text>
                </View>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                <TrendingUp size={20} color={colors.success} />
                <View style={styles.statContent}>
                  <Text style={[styles.statValue, { color: colors.success }]}>{averageDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                  <Text style={[styles.statLabel, { color: colors.success }]}>ناوەند</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.sortContainer}>
              <Text style={[styles.sortLabel, { color: colors.text }]}>ڕیزکردن بەپێی:</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[styles.sortButton, { backgroundColor: sortBy === 'name' ? colors.primary : colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => setSortBy('name')}
                >
                  <Text style={[styles.sortButtonText, { color: sortBy === 'name' ? '#fff' : colors.text }]}>ناو</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, { backgroundColor: sortBy === 'amount' ? colors.primary : colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => setSortBy('amount')}
                >
                  <Text style={[styles.sortButtonText, { color: sortBy === 'amount' ? '#fff' : colors.text }]}>بڕ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortButton, { backgroundColor: sortBy === 'date' ? colors.primary : colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => setSortBy('date')}
                >
                  <Text style={[styles.sortButtonText, { color: sortBy === 'date' ? '#fff' : colors.text }]}>بەروار</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortOrderButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'desc' ? <TrendingDown size={18} color={colors.primary} /> : <TrendingUp size={18} color={colors.primary} />}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.resultsSection}>
            <View style={styles.resultsTitleRow}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                ئەنجامەکان ({filteredResults.length})
              </Text>
              {isApplyingFilters && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
            
            {isApplyingFilters ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
                  جێبەجێکردنی فلتەرەکان...
                </Text>
              </View>
            ) : filteredResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Search size={48} color={colors.textTertiary} style={{ opacity: 0.3 }} />
                <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 16 }]}>
                  هیچ ئەنجامێک نەدۆزرایەوە
                </Text>
                <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
                  تکایە فلتەرەکان بگۆڕە یان پاکیان بکەرەوە
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredResults}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                scrollEnabled={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    onPress={() => router.push(`/debtor/${item.id}` as any)}
                  >
                    {item.colorTag && (
                      <View style={[styles.colorIndicator, { backgroundColor: COLOR_TAG_MAP[item.colorTag] }]} />
                    )}
                    <View style={styles.resultContent}>
                      <View style={styles.resultHeader}>
                        <View style={styles.resultNameContainer}>
                          <Text style={[styles.resultName, { color: colors.text }]}>{item.name}</Text>
                          {item.nameEn && (
                            <Text style={[styles.resultNameEn, { color: colors.textTertiary }]}>({item.nameEn})</Text>
                          )}
                        </View>
                        {item.category && (
                          <View style={[
                            styles.resultCategoryBadge,
                            { backgroundColor: CATEGORY_COLORS[item.category] + '33', borderColor: CATEGORY_COLORS[item.category] },
                          ]}>
                            <Text style={[styles.resultCategoryText, { color: CATEGORY_COLORS[item.category] }]}>
                              {CATEGORY_LABELS[item.category]}
                            </Text>
                          </View>
                        )}
                      </View>
                      {item.phone && (
                        <View style={styles.resultInfoRow}>
                          <Phone size={14} color={colors.textTertiary} />
                          <Text style={[styles.resultPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
                        </View>
                      )}
                      <View style={styles.resultFooter}>
                        <View style={styles.amountContainer}>
                          <Text style={[styles.resultAmount, { color: item.totalDebt > 0 ? colors.error : colors.success }]}>
                            {item.totalDebt.toLocaleString('en-US')}
                          </Text>
                          <View style={[styles.trendBadge, { backgroundColor: item.totalDebt > 0 ? colors.error + '15' : colors.success + '15' }]}>
                            {item.totalDebt > 0 ? <TrendingUp size={12} color={colors.error} /> : <TrendingDown size={12} color={colors.success} />}
                          </View>
                        </View>
                        <Text style={[styles.resultTransactions, { color: colors.textTertiary }]}>
                          {item.transactions.length} مامەڵە
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
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
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 16,
    gap: 16,
  },
  searchHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  filterBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  headerActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  filterSection: {
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dateInput: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  dateInputText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  categoryButtons: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  colorTagButtons: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorTagButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  colorTagButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  amountInputs: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  amountSeparator: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  resultsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
    textAlign: 'right',
  },
  listContent: {
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  resultsTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    position: 'relative' as const,
  },
  colorIndicator: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  resultContent: {
    gap: 8,
  },
  resultHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultName: {
    fontSize: 18,
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'right',
  },
  resultCategoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  resultCategoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  resultPhone: {
    fontSize: 14,
    textAlign: 'right',
  },
  resultFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  resultAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  resultTransactions: {
    fontSize: 12,
  },
  voiceButton: {
    padding: 8 as const,
    borderRadius: 8 as const,
  },
  voiceButtonActive: {
    backgroundColor: '#FEE2E2' as const,
  },
  statsContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  sortContainer: {
    marginTop: 16,
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  sortButtons: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  sortOrderButton: {
    width: 44,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultNameContainer: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  resultNameEn: {
    fontSize: 12,
    textAlign: 'right',
  },
  resultInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  amountContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
