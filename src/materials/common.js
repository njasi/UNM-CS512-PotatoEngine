import PhongMaterial from "./PhongMaterial";
import { rgb } from "../objects";

/**
 * Given a material cfg return a new material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns
 */
export function generateMaterial(cfg) {
  return new PhongMaterial(cfg.ka, cfg.kd, cfg.ks, cfg.specularExp);
}

/**
 * Given a base color generate a metallic like material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns
 */
export function metallic(baseColor) {
  // TODO
  return generateMaterial();
}

/**
 * Given a base color generate a plastic like material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns
 */
export function plastic(baseColor) {
  // TODO
  return generateMaterial();
}

/**
 * Given a base color generate a glass like material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns
 */
export function glass(baseColor) {
  // TODO
  return generateMaterial();
}

/**
 * Given a base color generate a wood like material
 * @param {rgb()} baseColor 3-tuple rgb color
 * @returns
 */
export function wood(baseColor) {
  // TODO
  return generateMaterial();
}

/**
 * material mostly based on the vert color below and ambient
 * with small contributions from diffuse and specular
 */
export function vertColor() {
  return generateMaterial({
    ka: [0.8, 0.8, 0.8],
    kd: [0.2, 0.2, 0.2],
    ks: [0.2, 0.2, 0.2],
    specularExp: 16,
  });
}
