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
    this.label = label;

    // internal state for ease of use
    // TODO should do this across the other classes...
    // would be cleaner than the current annoying pass
    // gl everywhere structure
    this._gl = undefined;
    this._program = undefined;

    // set in secne when we add a mat
    this.programLabel = undefined;
  }

  /**
   * Get the location values for the parts of the material
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   * @param {ShaderProgram} shader
   */
  initUniforms(gl, shader) {
    // honestly i should start tracking gl and related objects everywhere
    // since it makes other functions easier to work with
    this._gl = gl;
    this._program = shader?.program;
  }

  /**
   * Update the values of the material uniform
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  updateUniforms(gl) {}

  /**
   * Clean up uniforms that could pollute effects after material was used
   */
  cleanup() {}
}
