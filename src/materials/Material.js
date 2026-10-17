/**
 * Convenience Interface class for shader materials
 */
export default class Material {
  /**
   * create a material instance
   * @param {string} label 
   */
  constructor(label) {
    this.label = label

    // set in secne when we add a mat
    this.programLabel = undefined
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
