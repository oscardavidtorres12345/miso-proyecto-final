const React = require('react');
const { View } = require('react-native');

function VirtualizedList(props) {
  const { children, ...rest } = props;
  return React.createElement(View, rest, children);
}

module.exports = VirtualizedList;
