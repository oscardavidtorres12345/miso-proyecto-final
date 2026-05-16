let insets = { top: 0, right: 0, bottom: 0, left: 0 };

export const useSafeAreaInsets = () => insets;
export const __setSafeAreaInsets = (nextInsets: {
  top: number;
  right: number;
  bottom: number;
  left: number;
}) => {
  insets = nextInsets;
};

export const SafeAreaProvider = ({ children }: any) => children;
export const SafeAreaView = ({ children }: any) => children;
export const SafeAreaConsumer = ({ children }: any) => children(insets);
export const initialWindowMetrics = {
  insets,
  frame: { x: 0, y: 0, width: 390, height: 844 },
};
