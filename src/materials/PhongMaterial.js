import ShaderProgram from "../shaders/ShaderProgram";
import { rgb } from "../util/color";
import Material from "./Material";

/**
 * Convenience Interface class for phong shader materials
 */
export default class PhongMaterial extends Material {
  /**
   * Create a (phong shader) material interface object.
   * @param {rgb()} ka
   * @param {rgb()} kd
   * @param {rgb()} ks
   * @param {float} specularExp
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
   * @param {*} gl
   * @param {ShaderProgram} shader
   */
  initUniforms(gl, shader) {
    super.initUniforms();
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
   * @param {*} gl
   */
  updateUniforms(gl) {
    super.updateUniforms();
    gl.uniform3f(this.kaLoc, this.ka[0], this.ka[1], this.ka[2]);
    gl.uniform3f(this.kdLoc, this.kd[0], this.kd[1], this.kd[2]);
    gl.uniform3f(this.ksLoc, this.ks[0], this.ks[1], this.ks[2]);
    gl.uniform1f(this.specularExpLoc, this.specularExp);
    gl.uniform1f(this.alphaLoc, this.alpha);
  }
}
