import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Platform } from 'react-native';

const PIN_KEY = 'app_pin';

export const [SecurityContext, useSecurity] = createContextHook(() => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [hasPin, setHasPin] = useState(false);

  const checkIfPinExists = useCallback(async () => {
    try {
      const pin = await AsyncStorage.getItem(PIN_KEY);
      if (!pin || pin === 'undefined' || pin === 'null' || pin.trim() === '') {
        setHasPin(false);
        return false;
      }
      setHasPin(true);
      return true;
    } catch (error) {
      console.error('Error checking PIN:', error);
      await AsyncStorage.removeItem(PIN_KEY);
      return false;
    }
  }, []);

  useEffect(() => {
    checkIfPinExists();
  }, [checkIfPinExists]);

  const setPin = useCallback(async (pin: string) => {
    try {
      await AsyncStorage.setItem(PIN_KEY, pin);
      setHasPin(true);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  }, []);

  const verifyPin = useCallback(async (pin: string) => {
    try {
      const storedPin = await AsyncStorage.getItem(PIN_KEY);
      if (!storedPin || storedPin === 'undefined' || storedPin === 'null') {
        return false;
      }
      if (storedPin.trim() === pin.trim()) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }, []);

  const removePin = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(PIN_KEY);
      setHasPin(false);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Error removing PIN:', error);
      return false;
    }
  }, []);

  const authenticateWithBiometrics = useCallback(async () => {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'چوونەژوورەوەی دڵنیاکردنەوە',
        cancelLabel: 'پاشگەزبوونەوە',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error authenticating with biometrics:', error);
      return false;
    }
  }, []);

  const checkBiometricAvailability = useCallback(async () => {
    if (Platform.OS === 'web') {
      return { available: false, type: null };
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      return {
        available: hasHardware && isEnrolled,
        types: supportedTypes,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { available: false, types: [] };
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const requestPinForDeletion = useCallback(async (onSuccess: () => void) => {
    const hasPinCode = await checkIfPinExists();
    
    if (!hasPinCode) {
      onSuccess();
      return;
    }
    
    return { requiresPin: true, onSuccess };
  }, [checkIfPinExists]);

  return useMemo(() => ({
    isAuthenticated,
    hasPin,
    setPin,
    verifyPin,
    removePin,
    authenticateWithBiometrics,
    checkBiometricAvailability,
    checkIfPinExists,
    logout,
    requestPinForDeletion,
  }), [
    isAuthenticated,
    hasPin,
    setPin,
    verifyPin,
    removePin,
    authenticateWithBiometrics,
    checkBiometricAvailability,
    checkIfPinExists,
    logout,
    requestPinForDeletion,
  ]);
});
