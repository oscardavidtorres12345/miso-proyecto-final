// __esModule: true is required so Babel interop resolves the default export correctly
const React = require('react');
const { View } = require('react-native');

const wrap = (name: string) =>
  ({ children, ...props }: any) =>
    React.createElement(View, { testID: props.testID ?? name }, children ?? null);

const leaf = () => null;

const Svg = wrap('Svg');

module.exports = {
  __esModule: true,
  default: Svg,
  Svg,
  Circle: leaf,
  Rect: leaf,
  Ellipse: leaf,
  Path: leaf,
  Line: leaf,
  Stop: leaf,
  RadialGradient: leaf,
  LinearGradient: leaf,
  Defs: wrap('Defs'),
  G: wrap('G'),
  ClipPath: wrap('ClipPath'),
  Mask: wrap('Mask'),
  Text: leaf,
};
