import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../theme/colors';

interface SnackbarProps {
  show: boolean;
  message: string;
  variant: 'success' | 'error';
  onClose: () => void;
  duration?: number;
  testID?: string;
}

export function Snackbar({ show, message, variant, onClose, duration = 4000, testID = 'snackbar' }: SnackbarProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => onCloseRef.current(), duration);
      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [show, duration, opacity, translateY]);

  const backgroundColor = variant === 'success' ? '#4a7c0a' : '#c62828';

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: insets.bottom + 16, backgroundColor },
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents={show ? 'auto' : 'none'}
      testID={testID}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.message} testID={`${testID}-message`}>{message}</Text>
      <TouchableOpacity onPress={onClose} testID={`${testID}-close`} accessibilityLabel="Cerrar" accessibilityRole="button">
        <Text style={styles.closeBtn}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  closeBtn: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    fontFamily: fonts.regular,
  },
});
