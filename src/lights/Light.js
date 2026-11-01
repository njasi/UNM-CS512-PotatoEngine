/**
 * @module lights/Light
 */

import { rgba } from "../util/color";

/**
 * Point light type
 */
export const LIGHT_POINT = 0;

/**
 * Spotlight light type
 */
export const LIGHT_SPOT = 1;

/**
 * Global directional light type
 */
export const LIGHT_DIRECTIONAL = 2;

/**
 * Representation of a light source in the scene
 *
 * @class
 * @alias module:lights/Light
 */
export default class Light {
  /**
   * Representation of a light source
   * @param {string} label
   * @param {number[]} position starting position of the light
   * @param {*} options
   * @param {number[]} options.color the color of the light
   * @param {number} options.intensity intensity of the light >0
   * @param {number} options.type the type of light one of LIGHT_POINT, LIGHT_SPOT, LIGHT_DIRECTIONAL
   * @param {number} [options.attA=1] Light attenuation constant value
   * @param {number} [options.attB=0.09] Light attenuation linear value
   * @param {number} [options.attC=0.032] Light attenuation quadratic value
   * @param {number[]} [options.direction=[0, 0, 0]] direction of the light, for spot & directional lights
   * @param {number} [options.cutoff=Math.PI / 4] cutoff for spotlights
   * @param {number} [options.spotExponent=20] spotlight exponent
   * @param {number} [options.cullingCutoff=0.05] lighting contribution cuttoff after which the light is culled
   */
  constructor(
    label,
    position,
    {
      color = rgba(255, 255, 255, 1),
      intensity = 1.0,
      type = LIGHT_POINT,
      attA = 1,
      attB = 0.09,
      attC = 0.032,
      direction = [0, 0, 0],
      cutoff = Math.PI / 4,
      spotExponent = 20,
      cullingCutoff = 0.05,
    } = {},
  ) {
    this.label = label;
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    // probably turn type into an int enum later
    this.type = type;
    // light attenuation for point and spot
    this.attA = attA;
    this.attB = attB;
    this.attC = attC;

    // calculate light culling radius based on attenuation
    // TODO recalculate on value changes if needed
    //      notably changes in intensity are likely to be an issue
    this.radius =
      (this.intensity *
        (-attB * cullingCutoff +
          Math.sqrt(
            attB * attB * cullingCutoff * cullingCutoff -
              4 * attC * cullingCutoff * (attA * cullingCutoff - 1),
          ))) /
      (2 * attC * cullingCutoff);

    // spot and directional light
    this.direction = direction;
    // spot
    this.cutoff = cutoff;
    this.spotExponent = spotExponent;
  }
}
