import { View } from 'react-native';

const icon = (name: string) =>
  ({ _size, _color, style, ...rest }: any) => <View testID={`icon-${name}`} style={style} {...rest} />;

export const Calendar = icon('Calendar');
export const MapPin = icon('MapPin');
export const Users = icon('Users');
export const Search = icon('Search');
export const Minus = icon('Minus');
export const Plus = icon('Plus');
export const ChevronLeft = icon('ChevronLeft');
export const ChevronRight = icon('ChevronRight');
export const X = icon('X');
