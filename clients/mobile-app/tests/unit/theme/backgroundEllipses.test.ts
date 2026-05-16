import {
  BACKGROUND_ELLIPSE_RADIUS_MULTIPLIER,
  BACKGROUND_ELLIPSE_RGB,
} from '../../../src/theme/backgroundEllipses';

describe('backgroundEllipses', () => {
  it('exports radius multiplier aligned with ellipse layout', () => {
    expect(BACKGROUND_ELLIPSE_RADIUS_MULTIPLIER).toBe(0.72);
    expect(typeof BACKGROUND_ELLIPSE_RADIUS_MULTIPLIER).toBe('number');
  });

  it('exports brand glow color token', () => {
    expect(BACKGROUND_ELLIPSE_RGB).toBe('rgb(125, 161, 13)');
  });
});
