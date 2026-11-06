/** @module materials/PhongMaterial */

import ShaderProgram from "../shaders/ShaderProgram";
import { rgb } from "../util/color";
import { vertColor } from "./common";
import Material from "./Material";

/**
 * Convenience Interface class for phong shader materials
 * @class
 * @alias module:materials/PhongMaterial
 */
export default class PhongMaterial extends Material {
  static DEFAULT_MATERIAL = {
    ka: [0.8, 0.8, 0.8],
    kd: [0.2, 0.2, 0.2],
    ks: [0.2, 0.2, 0.2],
    specularExp: 16,
    alpha: 1,
  };

  /**
   * Create a (phong shader) material interface object.
   * @param {rgb()} ka
   * @param {rgb()} kd
   * @param {rgb()} ks
   * @param {float} specularExp
   * @param {number} [alpha=1]
   */
  constructor(label, ka, kd, ks, specularExp, alpha = 1) {
    super(label);
    this.ka = ka;
    this.kd = kd;
    this.ks = ks;
    this.specularExp = specularExp;
    this.alpha = alpha;

    this.kaLoc = undefined;
    this.kdLoc = undefined;
    this.ksLoc = undefined;
    this.specularExpLoc = undefined;
    this.alphaLoc = undefined;
  }

  /**
   * Get the location values for the parts of the material
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   * @param {ShaderProgram} shader
   */
  initUniforms(gl, shader) {
    super.initUniforms(gl, shader);
    this.kaLoc = gl.getUniformLocation(shader.program, "mat.ka");
    this.kdLoc = gl.getUniformLocation(shader.program, "mat.kd");
    this.ksLoc = gl.getUniformLocation(shader.program, "mat.ks");
    this.specularExpLoc = gl.getUniformLocation(
      shader.program,
      "mat.specularExp",
    );
    this.alphaLoc = gl.getUniformLocation(shader.program, "mat.alpha");
  }

  /**
   * Update the values of the material uniform
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  updateUniforms(gl) {
    super.updateUniforms();
    gl.uniform3f(this.kaLoc, this.ka[0], this.ka[1], this.ka[2]);
    gl.uniform3f(this.kdLoc, this.kd[0], this.kd[1], this.kd[2]);
    gl.uniform3f(this.ksLoc, this.ks[0], this.ks[1], this.ks[2]);
    gl.uniform1f(this.specularExpLoc, this.specularExp);
    gl.uniform1f(this.alphaLoc, this.alpha);
  }

  /**
   * Clean up the uniforms after material was used
   * useful for the secondary optional material
   */
  cleanup() {
    super.cleanup();
    const gl = this._gl;
    gl.uniform3f(
      this.kaLoc,
      PhongMaterial.DEFAULT_MATERIAL.ka[0],
      PhongMaterial.DEFAULT_MATERIAL.ka[1],
      PhongMaterial.DEFAULT_MATERIAL.ka[2],
    );
    gl.uniform3f(
      this.kdLoc,
      PhongMaterial.DEFAULT_MATERIAL.kd[0],
      PhongMaterial.DEFAULT_MATERIAL.kd[1],
      PhongMaterial.DEFAULT_MATERIAL.kd[2],
    );
    gl.uniform3f(
      this.ksLoc,
      PhongMaterial.DEFAULT_MATERIAL.ks[0],
      PhongMaterial.DEFAULT_MATERIAL.ks[1],
      PhongMaterial.DEFAULT_MATERIAL.ks[2],
    );
    gl.uniform1f(
      this.specularExpLoc,
      PhongMaterial.DEFAULT_MATERIAL.specularExp,
    );
    gl.uniform1f(this.alphaLoc, PhongMaterial.DEFAULT_MATERIAL.alpha);
  }
}
