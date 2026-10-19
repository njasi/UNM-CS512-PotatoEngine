/**
 * Quick helper to translate rbga to webgl rgba
 *
 * ie 0-255 => 0-1
 *
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} a
 * @returns
 */
export const rgba = (r, g, b, a = undefined) => [
  r / 255,
  g / 255,
  b / 255,
  a == undefined ? 1 : a,
];

/**
 * Quick helper to translate rbg to webgl rgba
 *
 * ie 0-255 => 0-1
 *
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} a
 * @returns
 */
export const rgb = (r, g, b) => {
  return rgba(r, g, b, 1);
};

/**
 * Parse a hexcode string into rgba to use
 * should be convenient when start actually working with
 * color pallets like im supposed to later.
 *
 * @param {string} hexcode
 * @returns
 */
export const hex = (hexcode) => {
  hex = hexcode.replace("#", "");

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  let a = 1;
  if (hex.length == 8) {
    a = parseInt(hex.slice(6, 8), 16);
    a /= 255;
  }

  return rgba(r, g, b, a);
};

/**
 * Convert hsv to rgb values webgl understands
 *
 * https://en.wikipedia.org/wiki/HSL_and_HSV#To_RGB
 *
 * @param {*} hue degrees [0,360)
 * @param {*} saturation
 * @param {*} value
 * @param {number} [alpha=1]
 */
export function hsv(hue, saturation, value, alpha = 1) {
  hue %= 360;

  const c = value * saturation;
  const h = hue / 60;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = value - c;

  let r, b, g;

  if (h < 1) {
    [r, g, b] = [c, x, 0];
  } else if (h < 2) {
    [r, g, b] = [x, c, 0];
  } else if (h < 3) {
    [r, g, b] = [0, c, x];
  } else if (h < 4) {
    [r, g, b] = [0, x, c];
  } else if (h < 5) {
    [r, g, b] = [x, 0, c];
  } else if (h < 6) {
    [r, g, b] = [c, 0, x];
  }

  return rgba(255 * r + m, 255 * g + m, 255 * b + m, alpha);
}

/**
 * Convert hsv + alpha to rgb values webgl understands
 *
 * just a convenience wrapper around hsv
 * @param {*} hue
 * @param {*} saturation
 * @param {*} value
 * @param {*} alpha
 */
export function hsva(hue, saturation, value, alpha) {
  return hsv(hue, saturation, value, alpha);
}

/**
 * Convert hsv to rgb values webgl understands
 * - uses radians instead of degrees
 *
 * @param {*} hue
 * @param {*} saturation
 * @param {*} value
 * @param {*} alpha
 * @returns
 */
export function hsvrad(hue, saturation, value, alpha = 1) {
  return hsv((hue * 180) / Math.PI, saturation, value, alpha);
}
