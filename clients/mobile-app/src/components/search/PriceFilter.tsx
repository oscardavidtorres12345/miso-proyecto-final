import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { t } from '../../i18n';

export interface PriceRange {
  min: string;
  max: string;
}

interface PriceFilterProps {
  value: PriceRange;
  onChange: (value: PriceRange) => void;
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

function formatDisplay(raw: string): string {
  if (!raw) return '';
  const num = Number(raw);
  if (!Number.isFinite(num)) return raw;
  return new Intl.NumberFormat('es-CO').format(num);
}

export function PriceFilter({ value, onChange }: PriceFilterProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('filters.price')}</Text>
      </View>
      <View style={styles.inputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('filters.min')}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
            value={formatDisplay(value.min)}
            onChangeText={(raw) => onChange({ ...value, min: digitsOnly(raw) })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('filters.max')}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
            value={formatDisplay(value.max)}
            onChangeText={(raw) => onChange({ ...value, max: digitsOnly(raw) })}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f7f7f7',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 24,
    color: '#111',
  },
  inputs: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 16,
    color: '#111',
  },
  input: {
    fontFamily: 'Quicksand_400Regular',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    lineHeight: 20,
    textAlignVertical: 'center',
    fontSize: 15,
    color: '#111',
  },
});
