import {
  getKeyboardEventsForOS,
  getKeyboardInsetHeight,
} from '../../../src/components/search/SearchBottomSheet';

describe('SearchBottomSheet helpers', () => {
  it('returns correct keyboard events for ios and android', () => {
    expect(getKeyboardEventsForOS('ios')).toEqual({
      showEvent: 'keyboardWillShow',
      hideEvent: 'keyboardWillHide',
    });
    expect(getKeyboardEventsForOS('android')).toEqual({
      showEvent: 'keyboardDidShow',
      hideEvent: 'keyboardDidHide',
    });
  });

  it('computes inset keyboard height safely', () => {
    expect(getKeyboardInsetHeight(undefined, 10)).toBe(0);
    expect(getKeyboardInsetHeight(5, 10)).toBe(0);
    expect(getKeyboardInsetHeight(300, 20)).toBe(280);
  });
});
