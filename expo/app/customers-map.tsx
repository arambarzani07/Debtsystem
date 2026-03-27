import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useDebt } from '@/contexts/DebtContext';

// Conditionally import react-native-maps
let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

try {
  const mapsModule = require('react-native-maps');
  MapView = mapsModule.default || mapsModule.MapView;
  Marker = mapsModule.Marker;
  PROVIDER_GOOGLE = mapsModule.PROVIDER_GOOGLE;
} catch (error) {
  // react-native-maps not available - will show fallback UI
  console.warn('react-native-maps not available:', error);
}
import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentLocation, type LocationCoords } from '@/utils/gpsLocation';
import { MapPin, Navigation, List, X, Section, Phone } from 'lucide-react-native';
import type { Debtor } from '@/types';

export default function CustomersMapScreen() {
  const { debtors } = useDebt();
  const { colors } = useTheme();
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [showList, setShowList] = useState(false);

  const debtorsWithLocation = useMemo(() => {
    return debtors.filter(d => d.latitude && d.longitude);
  }, [debtors]);

  useEffect(() => {
    const load = async () => {
      setIsLoadingLocation(true);
      try {
        const location = await getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
        } else {
          if (debtorsWithLocation.length > 0) {
            setCurrentLocation({
              latitude: debtorsWithLocation[0].latitude!,
              longitude: debtorsWithLocation[0].longitude!,
            });
          } else {
            setCurrentLocation({
              latitude: 36.1911,
              longitude: 44.0091,
            });
          }
        }
      } catch (error) {
        console.error('Error loading location:', error);
        setCurrentLocation({
          latitude: 36.1911,
          longitude: 44.0091,
        });
      } finally {
        setIsLoadingLocation(false);
      }
    };
    load();
  }, [debtorsWithLocation]);

  const loadCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      } else {
        if (debtorsWithLocation.length > 0) {
          setCurrentLocation({
            latitude: debtorsWithLocation[0].latitude!,
            longitude: debtorsWithLocation[0].longitude!,
          });
        } else {
          setCurrentLocation({
            latitude: 36.1911,
            longitude: 44.0091,
          });
        }
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setCurrentLocation({
        latitude: 36.1911,
        longitude: 44.0091,
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMarkerPress = (debtor: Debtor) => {
    setSelectedDebtor(debtor);
  };

  const handleDebtorCardPress = (debtorId: string) => {
    router.push(`/debtor/${debtorId}` as any);
  };

  const handleGetDirections = (debtor: Debtor) => {
    if (!debtor.latitude || !debtor.longitude) return;
    
    const url = Platform.select({
      ios: `maps:?daddr=${debtor.latitude},${debtor.longitude}&dirflg=d`,
      android: `google.navigation:q=${debtor.latitude},${debtor.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${debtor.latitude},${debtor.longitude}`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Error opening maps:', err);
        if (Platform.OS === 'web') {
          alert('نەتوانرا نەخشە بکرێتەوە');
        } else {
          Alert.alert('هەڵە', 'نەتوانرا نەخشە بکرێتەوە');
        }
      });
    }
  };

  const handleCallDebtor = (debtor: Debtor) => {
    if (!debtor.phone) return;
    
    const url = `tel:${debtor.phone}`;
    Linking.openURL(url).catch(err => {
      console.error('Error making call:', err);
      if (Platform.OS === 'web') {
        alert('نەتوانرا پەیوەندی بکرێت');
      } else {
        Alert.alert('هەڵە', 'نەتوانرا پەیوەندی بکرێت');
      }
    });
  };

  const centerOnLocation = () => {
    loadCurrentLocation();
  };

  if (isLoadingLocation) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'نەخشەی کڕیاران',
            headerStyle: {
              backgroundColor: '#1E293B',
            },
            headerTintColor: '#F1F5F9',
            headerTitleStyle: {
              fontWeight: '700' as const,
            },
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            چاوەڕوانی شوێنی ئێستا...
          </Text>
        </View>
      </>
    );
  }

  if (!currentLocation) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'نەخشەی کڕیاران',
            headerStyle: {
              backgroundColor: '#1E293B',
            },
            headerTintColor: '#F1F5F9',
            headerTitleStyle: {
              fontWeight: '700' as const,
            },
          }}
        />
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={colors.backgroundGradient as [string, string, ...string[]]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.errorContent}>
            <MapPin size={64} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              نەتوانرا شوێنی ئێستا بدۆزرێتەوە
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={loadCurrentLocation}
            >
              <Text style={styles.retryButtonText}>هەوڵدانەوە</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'نەخشەی کڕیاران',
          headerStyle: {
            backgroundColor: '#1E293B',
          },
          headerTintColor: '#F1F5F9',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      <View style={styles.container}>
        {MapView ? (
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
          >
            {debtorsWithLocation.map((debtor) => (
              <Marker
                key={debtor.id}
                coordinate={{
                  latitude: debtor.latitude!,
                  longitude: debtor.longitude!,
                }}
                title={debtor.name}
                description={`قەرز: ${debtor.totalDebt.toLocaleString('en-US')}`}
                onPress={() => handleMarkerPress(debtor)}
                pinColor={debtor.totalDebt > 0 ? '#EF4444' : '#22C55E'}
              />
            ))}
          </MapView>
        ) : (
          <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B' }]}>
            <LinearGradient
              colors={colors.backgroundGradient as [string, string, ...string[]]}
              style={StyleSheet.absoluteFill}
            />
            <MapPin size={64} color={colors.primary} />
            <Text style={[styles.errorText, { color: colors.text, marginTop: 16 }]}>
              نەخشە بەردەست نیە
            </Text>
            <Text style={[styles.emptyListSubtext, { marginTop: 8 }]}>
              تکایە react-native-maps دامەزراندن بکە
            </Text>
          </View>
        )}

        <SafeAreaView style={styles.overlayContainer} edges={['top', 'left', 'right']}>
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.95)']}
              style={styles.statsGradient}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{debtorsWithLocation.length}</Text>
                  <Text style={styles.statLabel}>کڕیار لەسەر نەخشە</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{debtors.length - debtorsWithLocation.length}</Text>
                  <Text style={styles.statLabel}>بێ شوێن</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.primary }]}
              onPress={centerOnLocation}
            >
              <Navigation size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowList(!showList)}
            >
              {showList ? (
                <X size={24} color="#FFFFFF" />
              ) : (
                <List size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {showList && (
          <View style={styles.listContainer}>
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.98)', 'rgba(15, 23, 42, 0.98)']}
              style={styles.listGradient}
            >
              <ScrollView
                style={styles.listScroll}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.listTitle}>کڕیارانی لەسەر نەخشە</Text>
                {debtorsWithLocation.map((debtor) => (
                  <TouchableOpacity
                    key={debtor.id}
                    style={[
                      styles.listItem,
                      { 
                        backgroundColor: 'rgba(51, 65, 85, 0.6)',
                        borderColor: 'rgba(96, 165, 250, 0.3)',
                      }
                    ]}
                    onPress={() => {
                      setSelectedDebtor(debtor);
                      setShowList(false);
                    }}
                  >
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemName}>{debtor.name}</Text>
                      {debtor.phone && (
                        <Text style={styles.listItemPhone}>{debtor.phone}</Text>
                      )}
                      {debtor.address && (
                        <Text style={styles.listItemAddress}>{debtor.address}</Text>
                      )}
                    </View>
                    <View style={styles.listItemRight}>
                      <Text
                        style={[
                          styles.listItemDebt,
                          { color: debtor.totalDebt > 0 ? '#EF4444' : '#22C55E' }
                        ]}
                      >
                        {debtor.totalDebt.toLocaleString('en-US')}
                      </Text>
                      <MapPin
                        size={20}
                        color={debtor.totalDebt > 0 ? '#EF4444' : '#22C55E'}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                {debtorsWithLocation.length === 0 && (
                  <View style={styles.emptyList}>
                    <MapPin size={48} color="#64748B" />
                    <Text style={styles.emptyListText}>
                      هیچ کڕیارێک لەسەر نەخشە نیە
                    </Text>
                    <Text style={styles.emptyListSubtext}>
                      تکایە شوێن زیاد بکە لە کاتی زیادکردنی کڕیار
                    </Text>
                  </View>
                )}
              </ScrollView>
            </LinearGradient>
          </View>
        )}

        {selectedDebtor && !showList && (
          <View style={styles.debtorCard}>
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.98)', 'rgba(15, 23, 42, 0.98)']}
              style={styles.debtorCardGradient}
            >
              <View style={styles.debtorCardContent}>
                <View style={styles.debtorCardHeader}>
                  <TouchableOpacity
                    onPress={() => setSelectedDebtor(null)}
                    style={styles.closeButton}
                  >
                    <X size={20} color="#94A3B8" />
                  </TouchableOpacity>
                  <Text style={styles.debtorCardName}>{selectedDebtor.name}</Text>
                </View>
                {selectedDebtor.phone && (
                  <Text style={styles.debtorCardPhone}>{selectedDebtor.phone}</Text>
                )}
                {selectedDebtor.address && (
                  <Text style={styles.debtorCardAddress}>{selectedDebtor.address}</Text>
                )}
                <View style={styles.debtorCardStats}>
                  <View style={styles.debtorCardStat}>
                    <Text style={styles.debtorCardStatLabel}>قەرز</Text>
                    <Text
                      style={[
                        styles.debtorCardStatValue,
                        { color: selectedDebtor.totalDebt > 0 ? '#EF4444' : '#22C55E' }
                      ]}
                    >
                      {selectedDebtor.totalDebt.toLocaleString('en-US')}
                    </Text>
                  </View>
                </View>
                <View style={styles.debtorCardActions}>
                  {selectedDebtor.phone && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
                      onPress={() => handleCallDebtor(selectedDebtor)}
                    >
                      <Phone size={18} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>پەیوەندی</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleGetDirections(selectedDebtor)}
                  >
                    <Section size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>ڕێگا</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewDetailsButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleDebtorCardPress(selectedDebtor.id)}
                  >
                    <Text style={styles.viewDetailsButtonText}>بینینی وردەکاری</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  overlayContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    pointerEvents: 'box-none',
  },
  statsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  statsGradient: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  buttonGroup: {
    position: 'absolute' as const,
    bottom: 32,
    left: 16,
    gap: 12,
    pointerEvents: 'auto',
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  listContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  listGradient: {
    flex: 1,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
    gap: 4,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F1F5F9',
    textAlign: 'right',
  },
  listItemPhone: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'right',
  },
  listItemAddress: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
  listItemRight: {
    alignItems: 'center',
    gap: 4,
  },
  listItemDebt: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  emptyList: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  debtorCard: {
    position: 'absolute' as const,
    bottom: 32,
    left: 16,
    right: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  debtorCardGradient: {
    padding: 20,
  },
  debtorCardContent: {
    gap: 12,
  },
  debtorCardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 4,
  },
  debtorCardName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    flex: 1,
    textAlign: 'right',
  },
  debtorCardPhone: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'right',
  },
  debtorCardAddress: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'right',
  },
  debtorCardStats: {
    marginTop: 8,
  },
  debtorCardActions: {
    marginTop: 12,
    flexDirection: 'row-reverse',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  debtorCardStat: {
    alignItems: 'center',
    gap: 4,
  },
  debtorCardStatLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  debtorCardStatValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
