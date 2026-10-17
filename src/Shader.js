/**
 * Wrapper class to represent a shader file
 */
export default class Shader {
  /**
   * Create a new shader
   * @param {*} label       the name of the shader
   * @param {*} type        the type of shader
   * @param {*} source      source text
   * @param {*} source_url  source url
   */
  constructor(label, type, source, source_url) {
    this.label = label;
    this.type = type;
    this.source = source;
    this.source_url = source_url;

    this.shader = undefined;

    this.loadRemote = this.loadRemote.bind(this);
    this.create = this.create.bind(this);
  }

  /**
   * Initialize the shader wth webgl
   * @param {*} gl the webgl2 context from canvas
   * @param {*} type the type of shader
   * @param {*} source the shader source
   * @returns
   */
  create(gl) {
    let shader = gl.createShader(this.type);
    gl.shaderSource(shader, this.source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    this.shader = shader;
  }

  /**
   * Load a shader from a remote source (file)
   * @param {*} url shader url to load from
   * @returns the text of the shader file
   */
  async loadRemote() {
    if (!this.source_url) {
      console.error(this.name + ":\tNo source_url found");
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
