/** @module materials/Material */


/**
 * Convenience Interface class for basic shader materials
 * 
 * @class
 * @alias module:materials/Material
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
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   * @param {ShaderProgram} shader
   */
  initUniforms(gl, shader) {}

  /**
   * Update the values of the material uniform
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  updateUniforms(gl) {}
}
