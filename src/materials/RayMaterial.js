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
   * Create a (ray tracing shader) material interface object.
   * @param {*} label
   * @param {Object} [object={}] 
   * @param {number[]} [object.ka=[0.1, 0.1, 0.1]] 
   * @param {number[]} [object.kd=[0.1, 0.1, 0.1]] 
   * @param {number[]} [object.ks=[0.1, 0.1, 0.1]] 
   * @param {number} [object.specularExp=1] 
   * @param {number} [object.alpha=1] 
   * @param {number} [object.refractiveIndex=1] 
   * @param {number} [object.reflectivity=0] 
   * @param {number} [object.materialIndex=-1]  
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
   * 
   * @param {DataView} view the dataview of the material block
   * @param {number} offset byte offset to the start of this material
   */
  packData(view, offset) {
    // vec4 ka (offset 0)
    view.setInt32(0 + offset, this.ka[0], true);
    view.setInt32(4 + offset, this.ka[1], true);
    view.setInt32(8 + offset, this.ka[2], true);
    view.setInt32(12 + offset, 0, true);

    // vec4 kd (offset 16)
    view.setFloat32(16 + offset, this.kd[0], true);
    view.setFloat32(20 + offset, this.kd[1], true);
    view.setFloat32(24 + offset, this.kd[2], true);
    view.setFloat32(28 + offset, 0, true);

    // vec4 ks (offset 32)
    view.setFloat32(32 + offset, this.ks[0], true);
    view.setFloat32(36 + offset, this.ks[1], true);
    view.setFloat32(40 + offset, this.ks[2], true);
    view.setFloat32(44 + offset, 0, true);

    // vec4 optics (offset 48)
    view.setFloat32(48 + offset, this.specularExp, true);
    view.setFloat32(52 + offset, this.refractiveIndex, true);
    view.setFloat32(56 + offset, this.reflectivity, true);
    view.setFloat32(60 + offset, 0, true);
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
