jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const React = require('react');

  function MockFlatList(props: any) {
    const { data, renderItem, ListHeaderComponent, ItemSeparatorComponent, keyExtractor } = props;
    const items = Array.isArray(data) ? data : [];
    let header: any = null;
    if (ListHeaderComponent != null) {
      header =
        typeof ListHeaderComponent === 'function'
          ? React.createElement(ListHeaderComponent)
          : ListHeaderComponent;
    }
    const rows = items.map((item: any, index: number) => {
      const k = typeof keyExtractor === 'function' ? keyExtractor(item, index) : String(index);
      return React.createElement(
        React.Fragment,
        { key: k },
        renderItem({ item, index, separators: {} }),
        index < items.length - 1 && ItemSeparatorComponent
          ? React.createElement(ItemSeparatorComponent)
          : null,
      );
    });
    return React.createElement(RN.View, { testID: 'mock-flatlist-proxy-root' }, header, rows);
  }

  return new Proxy(RN, {
    get(target, prop, receiver) {
      if (prop === 'FlatList') return MockFlatList;
      return Reflect.get(target, prop, receiver);
    },
  });
});

export {};
