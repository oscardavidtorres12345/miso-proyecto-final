import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import CertificateIcon from '../../assets/certificate.svg';
import CloudIcon from '../../assets/computing_cloud.svg';
import MoneyIcon from '../../assets/money_cash.svg';
import PadlockIcon from '../../assets/padlock.svg';
import { colors } from '../../theme/colors';

const FEATURES = [
  {
    Icon: PadlockIcon,
    title: 'Reservas seguras',
    description: 'Tus pagos y datos están protegidos en todo momento.',
  },
  {
    Icon: CertificateIcon,
    title: 'Mejores precios',
    description: 'Comparamos tarifas para que siempre encuentres la mejor opción.',
  },
  {
    Icon: CloudIcon,
    title: 'Cancelación flexible',
    description: 'Cambia de planes sin estrés con reembolso disponible.',
  },
  {
    Icon: MoneyIcon,
    title: 'Paga en pesos',
    description: 'Ve los precios en COP, sin sorpresas al finalizar.',
  },
];

export function FeaturesSection() {
  return (
    <View style={styles.section}>
      <View style={styles.grid}>
        {FEATURES.map(({ Icon, title, description }) => (
          <View key={title} style={styles.card}>
            <Icon width={56} height={56} />
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 17,
  },
});
