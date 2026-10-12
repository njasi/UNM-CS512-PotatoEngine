import ShaderProgram from "../ShaderProgram";
import { rgb } from "../objects";

/**
 * Convince Interface class for phong shader materials
 */
export default class PhongMaterial {
  /**
   * Create a (phong shader) material interface object.
   * @param {rgb()} ka
   * @param {rgb()} kd
   * @param {rgb()} ks
   * @param {float} specularExp
   */
  constructor(ka, kd, ks, specularExp) {
    this.ka = ka;
    this.kd = kd;
    this.ks = ks;
    this.specularExp = specularExp;

    this.kaLoc = undefined;
    this.kdLoc = undefined;
    this.ksLoc = undefined;
    this.specularExpLoc = undefined;
  }

  /**
   * Get the location values for the parts of the material
   * @param {*} gl
   * @param {ShaderProgram} shader
   */
  initUniforms(gl, shader) {
    this.kaLoc = gl.getUniformLocation(shader.program, "mat.ka");
    this.kdLoc = gl.getUniformLocation(shader.program, "mat.kd");
    this.ksLoc = gl.getUniformLocation(shader.program, "mat.ks");
    this.specularExpLoc = gl.getUniformLocation(
      shader.program,
      "mat.specularExp",
    );
  }

  /**
   * Update the values of the material uniform
   * @param {*} gl
   */
  updateUniforms(gl) {
    gl.uniform3f(this.kaLoc, this.ka[0], this.ka[1], this.ka[2]);
    gl.uniform3f(this.kdLoc, this.kd[0], this.kd[1], this.kd[2]);
    gl.uniform3f(this.ksLoc, this.ks[0], this.ks[1], this.ks[2]);
    gl.uniform1f(this.specularExpLoc, this.specularExp);
  }
}
