import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts } from '../../theme/colors';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  closeLabel?: string;
  onConfirm: () => void;
}

export function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  cancelLabel,
  confirmLabel,
  closeLabel = 'Close',
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.85}
            testID="modal-close-icon-btn"
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
          >
            <Text style={styles.closeIcon}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title} testID="modal-confirm-title">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.85} testID="modal-cancel-btn" accessibilityRole="button" accessibilityLabel={cancelLabel}>
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} activeOpacity={0.85} testID="modal-confirm-btn" accessibilityRole="button" accessibilityLabel={confirmLabel}>
              <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.secondary,
    marginBottom: 12,
    paddingRight: 24,
  },
  message: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.secondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 22,
    lineHeight: 22,
    color: colors.secondary,
    fontFamily: fonts.medium,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 999,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.white,
  },
});
