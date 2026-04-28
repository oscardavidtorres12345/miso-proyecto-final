import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type CalendarProps = {
  onDayPress?: (day: {
    dateString: string;
    timestamp: number;
    day: number;
    month: number;
    year: number;
  }) => void;
  renderArrow?: (direction: 'left' | 'right') => ReactNode;
};

export function Calendar({
  onDayPress,
  renderArrow,
}: CalendarProps) {
  const press = (dateString: string, day: number) =>
    onDayPress?.({ dateString, timestamp: 0, day, month: 12, year: 2025 });

  return (
    <View testID="rn-calendar">
      {renderArrow ? renderArrow('left') : null}
      {renderArrow ? renderArrow('right') : null}
      <TouchableOpacity testID="calendar-day-1" onPress={() => press('2025-12-01', 1)}>
        <Text>1</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="calendar-day-10" onPress={() => press('2025-12-10', 10)}>
        <Text>10</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="calendar-day-05" onPress={() => press('2025-12-05', 5)}>
        <Text>5</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="calendar-day-bad1" onPress={() => press('fecha-invalida-a', 1)}>
        <Text>bad1</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="calendar-day-bad2" onPress={() => press('fecha-invalida-b', 2)}>
        <Text>bad2</Text>
      </TouchableOpacity>
    </View>
  );
}

export const LocaleConfig = { locales: {} as Record<string, unknown>, defaultLocale: '' };
