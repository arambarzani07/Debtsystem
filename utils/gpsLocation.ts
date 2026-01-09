import * as Location from 'expo-location';
import type { Debtor } from '@/types';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

export async function getCurrentLocation(): Promise<LocationCoords | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

export function findNearestDebtor(
  debtors: Debtor[],
  currentLocation: LocationCoords
): Debtor | null {
  let nearest: Debtor | null = null;
  let minDistance = Infinity;

  debtors.forEach((debtor) => {
    if (debtor.latitude && debtor.longitude) {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        debtor.latitude,
        debtor.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = debtor;
      }
    }
  });

  return nearest;
}

export function sortDebtorsByDistance(
  debtors: Debtor[],
  currentLocation: LocationCoords
): (Debtor & { distance: number })[] {
  const debtorsWithDistance = debtors
    .filter((debtor) => debtor.latitude && debtor.longitude)
    .map((debtor) => ({
      ...debtor,
      distance: calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        debtor.latitude!,
        debtor.longitude!
      ),
    }));

  return debtorsWithDistance.sort((a, b) => a.distance - b.distance);
}

export interface RouteStop {
  debtor: Debtor;
  distance: number;
  order: number;
}

export function planOptimalRoute(
  debtors: Debtor[],
  startLocation: LocationCoords
): RouteStop[] {
  const debtorsWithLocation = debtors.filter(
    (d) => d.latitude && d.longitude && d.totalDebt > 0
  );

  if (debtorsWithLocation.length === 0) {
    return [];
  }

  const route: RouteStop[] = [];
  let currentLocation = startLocation;
  const remaining = [...debtorsWithLocation];

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    remaining.forEach((debtor, index) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        debtor.latitude!,
        debtor.longitude!
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    const nearest = remaining[nearestIndex];
    route.push({
      debtor: nearest,
      distance: minDistance,
      order: route.length + 1,
    });

    currentLocation = {
      latitude: nearest.latitude!,
      longitude: nearest.longitude!,
    };

    remaining.splice(nearestIndex, 1);
  }

  return route;
}

export async function geocodeAddress(address: string): Promise<LocationCoords | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (results && results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

export async function reverseGeocode(coords: LocationCoords): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    if (results && results.length > 0) {
      const result = results[0];
      return `${result.street || ''} ${result.district || ''} ${result.city || ''}, ${result.country || ''}`.trim();
    }
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}
