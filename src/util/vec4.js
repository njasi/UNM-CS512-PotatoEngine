/** 
 * @module util/vec4 
 * @description Vec4 utility functions
*/

/**
 * Scale a vector a by constant c
 * @param {number[]} a vector to scale [x,y,z,w]
 * @param {number} c scaling factor
 * @returns {number[]}
 */
export function scaleVec4(a, c) {
  return [a[0] * c, a[1] * c, a[2] * c, a[3] * c];
}

/**
 * Add two vectors a and b together
 * @param {number[]} a vector [x,y,z,w]
 * @param {number[]} b vector [x,y,z,w]
 * @returns {number[]}
 */
export function sumVec4(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

/**
 * Sum a list of vectors together
 * @param  {...any} vecs vectors of the format [x,y,z,w]
 * @returns {number[]}
 */
export function sumVec(...vecs) {
  return vecs.reduce(sumVec4);
}

/**
 * Calculate the distance between two vec4s. 
 * @param {number[]} a vector [x,y,z,w]
 * @param {number[]} b vector [x,y,z,w]
 * @returns {number}
 */
export function vec4distance(a, b) {
  return Math.sqrt(
    Math.pow(b[0] - a[0], 2) +
      Math.pow(b[1] - a[1], 2) +
      Math.pow(b[2] - a[2], 2),
  );
}
