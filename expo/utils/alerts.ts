import { Alert, Platform } from 'react-native';

export const showAlert = (
  title: string,
  message: string,
  buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[],
  options?: { cancelable?: boolean }
): void => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed && buttons[1]?.onPress) {
        buttons[1].onPress();
      } else if (!confirmed && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      if (buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons, options);
  }
};

export const showPrompt = (
  title: string,
  message: string,
  onConfirm: (text: string) => void,
  onCancel?: () => void,
  defaultValue: string = ''
): void => {
  if (Platform.OS === 'web') {
    const result = window.prompt(`${title}\n${message}`, defaultValue);
    if (result !== null) {
      onConfirm(result);
    } else if (onCancel) {
      onCancel();
    }
  } else {
    Alert.prompt(
      title,
      message,
      [
        {
          text: 'هەڵوەشاندنەوە',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'باشە',
          onPress: (text?: string) => {
            if (text !== undefined) {
              onConfirm(text);
            }
          },
        },
      ],
      'plain-text',
      defaultValue
    );
  }
};

export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  showAlert(
    title,
    message,
    [
      {
        text: 'هەڵوەشاندنەوە',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'باشە',
        onPress: onConfirm,
      },
    ]
  );
};

export const showError = (message: string): void => {
  showAlert('هەڵە', message);
};

export const showSuccess = (message: string): void => {
  showAlert('سەرکەوتوو', message);
};
