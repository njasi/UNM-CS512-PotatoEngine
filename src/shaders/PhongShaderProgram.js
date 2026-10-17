import ShaderProgram from "./ShaderProgram";

/**
 * Phong shader program, I'm just using it to tack on another uniform for free
 * while still remaining readable if i have to deal with it later rather
 * than using the extras thing even though that would work
 */
export default class PhongShaderProgram extends ShaderProgram {
  /**
   * Create a new shader program
   * @param {*} label
   * @param {*} program
   * @param {*} gl
   * @param {Object} [options={}]
   * @param {string[]} [options.extraLocs=[]]
   */
  constructor(label, program, gl) {
    super(label, program, gl);
    this.uLightCount = gl.getUniformLocation(this.program, "uLightCount");
    this.hasLight = true;
    this.hasMaterial = true;
  }

  /**
   * Update the light count uniform
   * @param {*} count
   * @param {*} gl
   */
  setLightCount(count, gl) {
    gl.uniform1i(this.uLightCount, count);
  }
}
