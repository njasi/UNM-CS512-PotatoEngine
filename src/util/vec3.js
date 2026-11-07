/**
 * @module util/vec3
 * @description Vec3 utility functions
 */

/**
 * Scale a vector a by constant c
 * @param {number[]} a vector to scale [x,y,z]
 * @param {number} c scaling factor
 * @returns {number[]}
 */
function scale(a, c) {
  return [a[0] * c, a[1] * c, a[2] * c];
}

/**
 * Add two vectors a and b together
 * @param {number[]} a vector [x,y,z]
 * @param {number[]} b vector [x,y,z]
 * @returns {number[]}
 */
function sum(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/**
 * Sum a list of vectors together
 * @param  {...any} vecs vectors of the format [x,y,z]
 * @returns {number[]}
 */
function sumList(...vecs) {
  return vecs.reduce(sum);
}

/**
 * Calculate the distance between two vec3s.
 * @param {number[]} a vector [x,y,z]
 * @param {number[]} b vector [x,y,z]
 * @returns {number}
 */
function distance(a, b) {
  return Math.sqrt(
    Math.pow(b[0] - a[0], 2) +
      Math.pow(b[1] - a[1], 2) +
      Math.pow(b[2] - a[2], 2),
  );
}

/**
 * Normalize vec3
 * @param {number[]} a vector [x,y,z]
 * @returns {number[]}
 */
function normalize(a) {
  const h = Math.hypot(...a);
  return [a[0] / h, a[1] / h, a[2] / h];
}

export default {
  scale,
  sum,
  sumList,
  distance,
  normalize,
};
