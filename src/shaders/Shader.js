/**
 * @module shaders/Shader
 */

/**
 * Wrapper class to represent shader source
 *
 * @class
 * @alias module:shaders/Shader
 */
export default class Shader {
  /**
   * Create a new shader
   *
   * one of source or source_url needs to be set
   *
   * @param {string} label       the name of the shader
   * @param {*} type             the type of shader
   * @param {*} options          source options
   * @param {string} source_url  url to load source text from
   * @param {string} source      source text
   */
  constructor(label, type, source_url = undefined, source = undefined) {
    this.label = label;
    this.type = type;
    this.source = source;
    this.source_url = source_url;

    this.shader = undefined;

    this.load = this.load.bind(this);
    this.init = this.init.bind(this);
  }

  /**
   * Initialize the shader wth webgl context
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  init(gl) {
    let shader = gl.createShader(this.type);
    gl.shaderSource(shader, this.source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        `Shader ${this.label} was not able to compile properly.\n${this.source}`,
      );
      throw new Error(gl.getShaderInfoLog(shader));
    }
    this.shader = shader;
  }

  /**
   * Load a shader from a remote source file into the source attribute
   *
   * if source_url is undefined, ignore
   */
  async load() {
    if (!this.source_url) {
      return;
    }

    const response = await fetch(this.source_url);

    if (!response.ok) {
      throw new Error(
        `Failed to load ${this.source_url}: ${response.status} ${response.statusText}`,
      );
    }

    this.source = await response.text();
  }
}
