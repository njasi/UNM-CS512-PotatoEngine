/**
 * @module materials/common 
 * @description Common phong materials and helper functions to generate them.
*/

import PhongMaterial from "./PhongMaterial";
import { rgb } from "../util/color";

/**
 * this is just vec3 scale but didnt feel like making a vec3 util file
 * 
 * @param {number[]} colorValue 
 * @param {number} scale 
 * @returns {number[]}
 */
const scaleColor = (colorValue, scale) => {
  return colorValue.map((x) => x * scale);
};

/**
 * Given material options return a new material
 * @param {string} label the name of the material
 * @param {*} options material configuration
 * @param {rgb()} options.ka: ambient color contribution
 * @param {rgb()} options.kd: diffuse color contribution
 * @param {rgb()} options.ks: specular color contribution
 * @param {number} options.specularExponent: specular exponent (>0)
 * @param {number} options.alpha: transparency if used with transparent renderpass
 * @returns {PhongMaterial}
 */
export function generateMaterial(label, options) {
  return new PhongMaterial(
    label,
    options.ka,
    options.kd,
    options.ks,
    options.specularExp,
    options.alpha,
  );
}

/**
 * Given a base color generate a metallic like material
 * @param {string} label the name of the material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns {PhongMaterial}
 */
export function metallic(label, baseColor) {
  return generateMaterial(label, {
    ka: scaleColor(baseColor, 0.2),
    kd: scaleColor(baseColor, 0.5),
    ks: scaleColor(baseColor, 0.9),
    specularExp: 64,
  });
}

/**
 * Given a base color generate a plastic like material
 * @param {string} label the name of the material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns {PhongMaterial}
 */
export function plastic(label, baseColor) {
  return generateMaterial(label, {
    ka: scaleColor(baseColor, 0.1),
    kd: scaleColor(baseColor, 0.8),
    ks: [0.5, 0.5, 0.5],
    specularExp: 32,
  });
}

/**
 * Given a base color generate a glass like material
 *
 * This one makes sense on an otherwise clear material
 *
 * @param {string} label the name of the material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns {PhongMaterial}
 */
export function glass(label, baseColor) {
  return generateMaterial(label, {
    ka: scaleColor(baseColor, 0.02),
    kd: scaleColor(baseColor, 0.05),
    ks: [0.9, 0.9, 0.9],
    specularExp: 96,
  });
}

/**
 * Given a base color generate a wood like material
 * @param {string} label the name of the material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns {PhongMaterial}
 */
export function wood(label, baseColor) {
  return generateMaterial(label, {
    ka: scaleColor(baseColor, 0.15),
    kd: scaleColor(baseColor, 0.75),
    ks: [0.08, 0.08, 0.08],
    specularExp: 12,
  });
}

/**
 * material mostly based on the vert color below and ambient
 * with small contributions from diffuse and specular
 *
 * @param {string} label the name of the material
 * @returns {PhongMaterial}
 */
export function vertColor(label) {
  return generateMaterial(label, {
    ka: [0.8, 0.8, 0.8],
    kd: [0.2, 0.2, 0.2],
    ks: [0.2, 0.2, 0.2],
    specularExp: 16,
  });
}

/**
 * only ambient lighting is included
 * @param {string} label the name of the material
 * @returns {PhongMaterial}
 */
export function ambientOnly(label, ka = [1, 1, 1]) {
  return generateMaterial(label, {
    ka: ka,
    kd: [0, 0, 0],
    ks: [0, 0, 0],
    specularExp: 1,
  });
}

/**
 * only diffuse lighting is included
 * @param {string} label the name of the material
 * @returns {PhongMaterial}
 */
export function diffuseOnly(label, kd = [1, 1, 1]) {
  return generateMaterial(label, {
    ka: [0, 0, 0],
    kd: kd,
    ks: [0, 0, 0],
    specularExp: 1,
  });
}

/**
 * only specular lighting is included
 * @param {string} label the name of the material
 * @returns {PhongMaterial}
 */
export function specularOnly(label, ks = [1, 1, 1], exp = 16) {
  return generateMaterial(label, {
    ka: [0.01, 0.01, 0.01],
    kd: [0.01, 0.01, 0.01],
    ks: ks,
    specularExp: exp,
  });
}
