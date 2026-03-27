import { useTheme } from '@/contexts/ThemeContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, CreditCard, Smartphone, Landmark, ToggleLeft, ToggleRight, Edit, Trash2, CheckCircle } from 'lucide-react-native';
import { usePaymentGateways } from '@/contexts/PaymentGatewayContext';

export default function PaymentGatewayIntegrationScreen() {
  const { colors } = useTheme();
  const { gateways, addGateway, updateGateway, deleteGateway, toggleGateway, getActiveGateways, processPayment } = usePaymentGateways();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [gatewayName, setGatewayName] = useState('');
  const [gatewayType, setGatewayType] = useState<'card' | 'mobile' | 'bank'>('card');
  const [apiKey, setApiKey] = useState('');
  const [commission, setCommission] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [testAmount, setTestAmount] = useState('');
  const [testDebtorId, setTestDebtorId] = useState('');
  const [selectedGatewayForTest, setSelectedGatewayForTest] = useState('');

  const activeGateways = getActiveGateways();

  const handleAddGateway = () => {
    if (!gatewayName || !commission) {
      if (Platform.OS === 'web') {
        alert('تکایە هەموو خانەکان پڕبکەرەوە');
      } else {
        Alert.alert('هەڵە', 'تکایە هەموو خانەکان پڕبکەرەوە');
      }
      return;
    }

    if (editingGateway) {
      updateGateway(editingGateway, {
        name: gatewayName,
        type: gatewayType,
        apiKey,
        commission: parseFloat(commission),
        isActive,
      });
      setEditingGateway(null);
    } else {
      addGateway({
        name: gatewayName,
        type: gatewayType,
        apiKey,
        commission: parseFloat(commission),
        isActive,
      });
    }

    resetForm();

    if (Platform.OS === 'web') {
      alert(editingGateway ? 'دەروازە نوێکرایەوە' : 'دەروازە زیادکرا');
    } else {
      Alert.alert('سەرکەوتوو', editingGateway ? 'دەروازە نوێکرایەوە' : 'دەروازە زیادکرا');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setGatewayName('');
    setGatewayType('card');
    setApiKey('');
    setCommission('');
    setIsActive(true);
  };

  const handleEditGateway = (gatewayId: string) => {
    const gateway = gateways.find(g => g.id === gatewayId);
    if (gateway) {
      setGatewayName(gateway.name);
      setGatewayType(gateway.type);
      setApiKey(gateway.apiKey || '');
      setCommission(gateway.commission.toString());
      setIsActive(gateway.isActive);
      setEditingGateway(gatewayId);
      setShowAddForm(true);
    }
  };

  const handleDeleteGateway = (gatewayId: string) => {
    if (Platform.OS === 'web') {
      if (confirm('دڵنیای لە سڕینەوەی ئەم دەروازەیە؟')) {
        deleteGateway(gatewayId);
        alert('دەروازە سڕایەوە');
      }
    } else {
      Alert.alert(
        'سڕینەوە',
        'دڵنیای لە سڕینەوەی ئەم دەروازەیە؟',
        [
          { text: 'پاشگەزبوونەوە', style: 'cancel' },
          {
            text: 'سڕینەوە',
            style: 'destructive',
            onPress: () => {
              deleteGateway(gatewayId);
              Alert.alert('سەرکەوتوو', 'دەروازە سڕایەوە');
            },
          },
        ]
      );
    }
  };

  const handleTestPayment = async () => {
    if (!selectedGatewayForTest || !testAmount) {
      if (Platform.OS === 'web') {
        alert('تکایە دەروازە و بڕی پارە هەڵبژێرە');
      } else {
        Alert.alert('هەڵە', 'تکایە دەروازە و بڕی پارە هەڵبژێرە');
      }
      return;
    }

    const result = await processPayment(
      selectedGatewayForTest,
      parseFloat(testAmount),
      testDebtorId || 'test-debtor'
    );

    if (Platform.OS === 'web') {
      alert(result.message);
    } else {
      Alert.alert(
        result.success ? 'سەرکەوتوو' : 'هەڵە',
        result.message,
        result.success && result.transactionId
          ? [
              {
                text: 'باشە',
                onPress: () => console.log('Transaction ID:', result.transactionId),
              },
            ]
          : undefined
      );
    }

    if (result.success) {
      setTestAmount('');
      setTestDebtorId('');
      setSelectedGatewayForTest('');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'card': return 'کارتی بانکی';
      case 'mobile': return 'مۆبایل';
      case 'bank': return 'بانک';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'card': return CreditCard;
      case 'mobile': return Smartphone;
      case 'bank': return Landmark;
      default: return CreditCard;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'card': return colors.primary;
      case 'mobile': return colors.success;
      case 'bank': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
              <CreditCard size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{gateways.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی گشتی</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.successGlass, borderColor: colors.success }]}>
              <CheckCircle size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeGateways.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>چالاک</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditingGateway(null);
              resetForm();
              setShowAddForm(!showAddForm);
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>دەروازەی نوێ زیاد بکە</Text>
          </TouchableOpacity>

          {showAddForm && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editingGateway ? 'دەستکاریکردنی دەروازە' : 'دەروازەی نوێ'}
              </Text>
              
              <Text style={[styles.label, { color: colors.text }]}>ناوی دەروازە</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={gatewayName}
                onChangeText={setGatewayName}
                placeholder="ناوی دەروازە"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.label, { color: colors.text }]}>جۆر</Text>
              <View style={styles.typeRow}>
                {(['card', 'mobile', 'bank'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      { 
                        backgroundColor: gatewayType === type ? getTypeColor(type) + '33' : colors.cardGlass,
                        borderColor: gatewayType === type ? getTypeColor(type) : colors.glassBorder,
                      }
                    ]}
                    onPress={() => setGatewayType(type)}
                  >
                    <Text style={[styles.typeText, { color: gatewayType === type ? getTypeColor(type) : colors.text }]}>
                      {getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>API Key (ئیختیاری)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="API Key"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
              />

              <Text style={[styles.label, { color: colors.text }]}>کۆمیسیۆن (%)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={commission}
                onChangeText={setCommission}
                placeholder="2.5"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
              />

              <View style={styles.switchRow}>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
                <Text style={[styles.switchLabel, { color: colors.text }]}>چالاک</Text>
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddGateway}
                >
                  <Text style={styles.formButtonText}>
                    {editingGateway ? 'نوێکردنەوە' : 'زیادکردن'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, borderWidth: 1 }]}
                  onPress={() => {
                    resetForm();
                    setEditingGateway(null);
                  }}
                >
                  <Text style={[styles.formButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {gateways.length > 0 && (
            <View style={[styles.testCard, { backgroundColor: colors.warningGlass, borderColor: colors.warning }]}>
              <Text style={[styles.testTitle, { color: colors.text }]}>تاقیکردنەوەی پارەدان</Text>
              
              <Text style={[styles.label, { color: colors.text }]}>دەروازە هەڵبژێرە</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gatewayScroll}>
                {gateways.map(gateway => (
                  <TouchableOpacity
                    key={gateway.id}
                    style={[
                      styles.gatewayChip,
                      { 
                        backgroundColor: selectedGatewayForTest === gateway.id ? getTypeColor(gateway.type) : colors.cardGlass,
                        borderColor: selectedGatewayForTest === gateway.id ? getTypeColor(gateway.type) : colors.glassBorder,
                      }
                    ]}
                    onPress={() => setSelectedGatewayForTest(gateway.id)}
                  >
                    <Text style={[styles.gatewayChipText, { color: selectedGatewayForTest === gateway.id ? '#FFFFFF' : colors.text }]}>
                      {gateway.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.text }]}>بڕی پارە</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={testAmount}
                onChangeText={setTestAmount}
                placeholder="10000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.testButton, { backgroundColor: colors.success }]}
                onPress={handleTestPayment}
              >
                <Text style={styles.testButtonText}>تاقیکردنەوە</Text>
              </TouchableOpacity>
            </View>
          )}

          {gateways.length === 0 ? (
            <View style={styles.emptyState}>
              <CreditCard size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ دەروازەیەک تۆمار نەکراوە
              </Text>
            </View>
          ) : (
            gateways.map(gateway => {
              const TypeIcon = getTypeIcon(gateway.type);
              const typeColor = getTypeColor(gateway.type);
              
              return (
                <View key={gateway.id} style={[styles.gatewayCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.gatewayHeader}>
                    <View style={styles.gatewayActions}>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.primaryGlass }]}
                        onPress={() => handleEditGateway(gateway.id)}
                      >
                        <Edit size={18} color={colors.primary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.errorGlass }]}
                        onPress={() => handleDeleteGateway(gateway.id)}
                      >
                        <Trash2 size={18} color={colors.error} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: gateway.isActive ? colors.successGlass : colors.cardGlass }]}
                        onPress={() => toggleGateway(gateway.id)}
                      >
                        {gateway.isActive ? (
                          <ToggleRight size={18} color={colors.success} />
                        ) : (
                          <ToggleLeft size={18} color={colors.textTertiary} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.gatewayNameContainer}>
                      <Text style={[styles.gatewayName, { color: colors.text }]}>{gateway.name}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: typeColor + '22' }]}>
                        <TypeIcon size={14} color={typeColor} />
                        <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                          {getTypeLabel(gateway.type)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.gatewayDetails}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailValue, { color: colors.warning }]}>
                        {gateway.commission}%
                      </Text>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>کۆمیسیۆن:</Text>
                    </View>

                    {gateway.apiKey && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailValue, { color: colors.textTertiary }]}>
                          {'•'.repeat(20)}
                        </Text>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>API Key:</Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <View style={[styles.statusBadge, { backgroundColor: gateway.isActive ? colors.successGlass : colors.errorGlass }]}>
                        <Text style={[styles.statusBadgeText, { color: gateway.isActive ? colors.success : colors.error }]}>
                          {gateway.isActive ? 'چالاک' : 'ناچالاک'}
                        </Text>
                      </View>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>دۆخ:</Text>
                    </View>
                  </View>
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
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, textAlign: 'right' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  typeText: { fontSize: 14, fontWeight: '600' as const },
  switchRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginTop: 16 },
  switchLabel: { fontSize: 16, fontWeight: '600' as const },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  formButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  formButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  testCard: { borderRadius: 16, borderWidth: 2, padding: 20, marginBottom: 20 },
  testTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 16, textAlign: 'right' },
  gatewayScroll: { marginBottom: 12 },
  gatewayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginLeft: 8 },
  gatewayChipText: { fontSize: 14, fontWeight: '600' as const },
  testButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  testButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  gatewayCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  gatewayHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  gatewayNameContainer: { flex: 1, marginLeft: 12 },
  gatewayName: { fontSize: 18, fontWeight: '700' as const, textAlign: 'right', marginBottom: 6 },
  typeBadge: { alignSelf: 'flex-end', flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: '700' as const },
  gatewayActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gatewayDetails: { gap: 8 },
  detailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14, fontWeight: '600' as const },
  detailValue: { fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' as const },
});
