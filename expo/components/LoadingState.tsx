import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingStateProps {
  message?: string;
  color?: string;
  size?: 'small' | 'large';
  backgroundColor?: string;
  textColor?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message, 
  color = '#6366F1', 
  size = 'large',
  backgroundColor = '#FFFFFF',
  textColor = '#6B7280'
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
});

export default LoadingState;
