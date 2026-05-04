import { View } from 'react-native';

const icon =
  (name: string) =>
  ({ _size, _color, style, ...rest }: any) =>
    <View testID={`icon-${name}`} style={style} {...rest} />;

export const Calendar = icon('Calendar');
export const CalendarDays = icon('CalendarDays');
export const MapPin = icon('MapPin');
export const Users = icon('Users');
export const Search = icon('Search');
export const ArrowLeftRight = icon('ArrowLeftRight');
export const Baby = icon('Baby');
export const Car = icon('Car');
export const Coffee = icon('Coffee');
export const Dumbbell = icon('Dumbbell');
export const PawPrint = icon('PawPrint');
export const Sparkles = icon('Sparkles');
export const Star = icon('Star');
export const Tv = icon('Tv');
export const Utensils = icon('Utensils');
export const Waves = icon('Waves');
export const Wifi = icon('Wifi');
export const Wind = icon('Wind');
export const Minus = icon('Minus');
export const Plus = icon('Plus');
export const ChevronLeft = icon('ChevronLeft');
export const ChevronRight = icon('ChevronRight');
export const ChevronDown = icon('ChevronDown');
export const ChevronUp = icon('ChevronUp');
export const X = icon('X');
export const ShoppingCart = icon('ShoppingCart');
export const Globe = icon('Globe');
export const LogOut = icon('LogOut');
export const Eye = icon('Eye');
export const EyeOff = icon('EyeOff');
