/**
 * @module shaders/ShaderProgram
 */

/**
 * Simple wrapper class representation of a shader program
 *
 * @class
 * @alias module:shaders/ShaderProgram
 */
export default class ShaderProgram {
  /**
   * Create a new shader program
   * @param {string} label the label to use for this program
   * @param {Shader} vertexShader the vertex shader to use when compiling the program
   * @param {Shader} fragmentShader the fragment shader to use when compiling the program
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   * @param {Object} [options={}]
   * @param {boolean} [options.hasMaterial=false] if this program uses Materials in its objects
   * @param {boolean} [options.hasLight=false]  if this program uses Lighting
   * @param {string[]} [options.extraLocs=[]] extra uniform locs to init in this program
   */
  constructor(
    label,
    vertexShader,
    fragmentShader,
    { hasMaterial = false, hasLight = false, extraLocs = [] } = {},
  ) {
    this.label = label;
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;

    this.hasMaterial = hasMaterial;
    this.hasLight = hasLight;

    this.extraLocsNames = extraLocs;
    this.extraLocs = {};
  }

  /**
   * Initialize the properties of the shader program
   * this mostly consists of getting uniform & attribute locations
   *
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  _init(gl) {
    // NOTE: we are assuming here that all of our shaders will use these
    //       values if we do this here, may need extensions for other custom shaders
    this.posLoc = gl.getAttribLocation(this.program, "aPosition");
    this.colorLoc = gl.getAttribLocation(this.program, "aColor");

    // can also define locs per object if needed...
    // materials work this way, bvh objects etc

    this.timeLoc = gl.getUniformLocation(this.program, "uTime");
    this.uMVM = gl.getUniformLocation(this.program, "uModelViewMatrix");
    this.uPM = gl.getUniformLocation(this.program, "uProjectionMatrix");
    this.uMTM = gl.getUniformLocation(
      this.program,
      "uModelTransformationMatrix",
    );

    for (const loc of this.extraLocsNames) {
      this.extraLocs[loc] = gl.getUniformLocation(this.program, loc);
    }
  }

  /**
   * using the compiled vertex and fragment shader, link a shader program.
   * Additionally initialize the shader program's uniform / attribute locations
   *
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  load(gl) {
    this.program = gl.createProgram();

    gl.attachShader(this.program, this.vertexShader.shader);
    gl.attachShader(this.program, this.fragmentShader.shader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      gl.deleteProgram(this.program);
      throw new Error(
        `Failed to link shader program: ${gl.getProgramInfoLog(program)}`,
      );
    }

    this._init(gl);
  }

  /**
   * Add an extra loc to the shader,
   * @param {string} loc uniform to locate in the shader program
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  addLoc(loc, gl) {
    this.extra[loc] = gl.getUniformLocation(this.program, loc);
  }

  /**
   * Use the shader program as the active program
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  use(gl) {
    if (!this.program) {
      console.warn("Cannot render before initializing the shader program");
      return;
    }
    gl.useProgram(this.program);
  }
}
