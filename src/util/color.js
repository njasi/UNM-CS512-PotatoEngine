/** 
 * @module util/color 
 * @description Utility functions to make managing color easier.
*/

/**
 * Quick helper to translate rbga to webgl rgba
 *
 * ie 0-255 => 0-1
 *
 * @param {Number} r  red value [0, 255]
 * @param {Number} g  green value [0, 255]
 * @param {Number} b  blue value [0, 255]
 * @param {Number} a  alpha value [0, 1]
 * @returns {number[]} 4 element array [r,g,b,a]
 */
export function rgba(r, g, b, a = undefined) {
  return [r / 255, g / 255, b / 255, a == undefined ? 1 : a];
}
/**
 * Quick helper to translate rbg to webgl rgba
 *
 * ie 0-255 => 0-1
 * 
 * alpha value defaults to 1. Use rgba() for alpha options
 *
 * @param {Number} r  red value [0, 255]
 * @param {Number} g  green value [0, 255]
 * @param {Number} b  blue value [0, 255]
 * @returns {number[]} 4 element array [r,g,b,a]
 */
export function rgb(r, g, b) {
  return rgba(r, g, b, 1);
}

/**
 * Parse a hexcode string into rgba to use
 * should be convenient when start actually working with
 * color pallets like im supposed to later.
 *
 * @param {string} hexcode the hexcode string 
 * @returns {number[]} 4 element array [r,g,b,a]
 */
export function hex(hexcode) {
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
}

/**
 * Convert hsv to rgb values webgl understands
 *
 * https://en.wikipedia.org/wiki/HSL_and_HSV#To_RGB
 *
 * @param {*} hue hue in degrees [0,360)
 * @param {*} saturation saturation amount [0,1]
 * @param {*} value value level [0,1]
 * @param {number} [alpha=1] alpha value of the color
 * @returns {number[]} 4 element array [r,g,b,a]
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
 * @param {*} hue hue in degrees [0,360)
 * @param {*} saturation saturation amount [0,1]
 * @param {*} value value level [0,1]
 * @param {number} [alpha=1] alpha value of the color
 * @returns {number[]} 4 element array [r,g,b,a]
 */
export function hsva(hue, saturation, value, alpha) {
  return hsv(hue, saturation, value, alpha);
}

/**
 * Convert hsv to rgb values webgl understands
 * - uses radians instead of degrees
 *
 * @param {*} hue in radians [0, 2\pi]
 * @param {*} saturation saturation amount [0,1]
 * @param {*} value value level [0,1]
 * @param {number} [alpha=1] alpha value of the color
 * @returns {number[]} 4 element array [r,g,b,a]
 */
export function hsvrad(hue, saturation, value, alpha = 1) {
  return hsv((hue * 180) / Math.PI, saturation, value, alpha);
}
