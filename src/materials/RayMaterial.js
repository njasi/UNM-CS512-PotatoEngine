/** @module materials/RayMaterial */

import ShaderProgram from "../shaders/ShaderProgram";
import { rgb } from "../util/color";
import { vertColor } from "./common";
import Material from "./Material";

/**
 * Convenience Interface class for phong shader materials
 * @class
 * @alias module:materials/RayMaterial
 */
export default class RayMaterial extends Material {
  static MATERIAL_BYTE_SIZE = 64;

  /**
   * Create a (phong shader) material interface object.
   * @param {rgb()} ka
   * @param {rgb()} kd
   * @param {rgb()} ks
   * @param {float} specularExp
   * @param {number} [alpha=1]
   */
  constructor(
    label,
    {
      ka = [0.1, 0.1, 0.1],
      kd = [0.1, 0.1, 0.1],
      ks = [0.1, 0.1, 0.1],
      specularExp = 1,
      alpha = 1,
      refractiveIndex = 1,
      reflectivity = 0,
      materialIndex = -1,
    } = {},
  ) {
    super(label);
    this.ka = ka;
    this.kd = kd;
    this.ks = ks;
    this.specularExp = specularExp;
    this.alpha = alpha;
    this.refractiveIndex = refractiveIndex;
    this.reflectivity = reflectivity;
    this.materialIndex = materialIndex;

    this.kaLoc = undefined;
    this.kdLoc = undefined;
    this.ksLoc = undefined;
    this.specularExpLoc = undefined;
    this.alphaLoc = undefined;
  }

  /**
   * Pack the data into a predefined structure i can pass down to the
   * shader to render
   *
   * <pre>
   *  struct Material {
   *    vec4 ka; // w unused
   *    vec4 kd; // w unused
   *    vec4 ks; // w unused
   *    vec4 optics; // specular, refractiveIndex, reflectivity
   *  };
   * </pre>
   *
   * TODO can probably cache this to not recompute every time
   * maybe a dirty attribute on it or smth
   */
  packData() {
    const bytes = new ArrayBuffer(RayMaterial.MATERIAL_BYTE_SIZE);
    const view = new DataView(bytes);

    // vec4 ka (offset 0)
    view.setInt32(0, this.ka[0], true);
    view.setInt32(4, this.ka[1], true);
    view.setInt32(8, this.ka[2], true);
    view.setInt32(12, 0, true);

    // vec4 kd (offset 16)
    view.setFloat32(16, this.kd[0], true);
    view.setFloat32(20, this.kd[1], true);
    view.setFloat32(24, this.kd[2], true);
    view.setFloat32(28, 0, true);

    // vec4 ks (offset 32)
    view.setFloat32(32, this.ks[0], true);
    view.setFloat32(36, this.ks[1], true);
    view.setFloat32(40, this.ks[2], true);
    view.setFloat32(44, 0, true);

    // vec4 optics (offset 48)
    view.setFloat32(48, this.specularExp, true);
    view.setFloat32(52, this.refractiveIndex, true);
    view.setFloat32(56, this.reflectivity, true);
    view.setFloat32(60, 0, true);

    return bytes;
  }

  /**
   * Get the location values for the parts of the material
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   * @param {ShaderProgram} shader
   */
  initUniforms(gl, shader) {
    super.initUniforms(gl, shader);
    // No uniforms, using a buffer block
  }

  /**
   * Update the values of the material uniform
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  updateUniforms(gl) {
    super.updateUniforms();
    // No uniforms, using a buffer block
  }

  /**
   * Clean up the uniforms after material was used
   * useful for the secondary optional material
   */
  cleanup() {
    super.cleanup();
    // No uniforms, using a buffer block
  }
}
