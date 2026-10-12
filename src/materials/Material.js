/**
 * Convince Interface class for shader materials
 */
export default class Material {
  /**
   * create a material instance
   * @param {string} label 
   */
  constructor(label) {
    this.label = label
  }

  /**
   * Get the location values for the parts of the material
   * @param {*} gl
   * @param {ShaderProgram} shader
   */
  initUniforms(gl, shader) {}

  /**
   * Update the values of the material uniform
   * @param {*} gl
   */
  updateUniforms(gl) {}
}
