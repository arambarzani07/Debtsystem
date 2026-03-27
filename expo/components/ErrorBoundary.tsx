import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={80} color="#EF4444" />
            </View>

            <Text style={styles.title}>هەڵەیەک ڕوویدا</Text>
            <Text style={styles.message}>
              ببورە، کێشەیەک لە کارپێکردنی ئەپەکەدا ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>وردەکاری هەڵە (تەنها لە حاڵەتی گەشەپێداندا):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>{this.state.errorInfo.componentStack}</Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.resetButton}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <RefreshCw size={24} color="#FFFFFF" />
              <Text style={styles.resetButtonText}>دووبارە هەوڵبدەرەوە</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  message: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 32,
  },
  errorDetails: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#F59E0B',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: 'monospace' as const,
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace' as const,
  },
  resetButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#60A5FA',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginLeft: 8,
  },
});
