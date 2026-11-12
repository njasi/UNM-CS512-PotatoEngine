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
    this.locs = {};

    this._gl = undefined;

    this.uniforms = new Proxy(
      {},
      {
        set: (target, key, value) => {
          if (key in this.locs) {
            target[key] = value;
            this._setUniform(key, value);
            return true;
          }
        },
        get: (target, key) => {
          return target[key];
        },
      },
    );
  }

  /**
   * Initialize the properties of the shader program
   * this mostly consists of getting uniform & attribute locations
   *
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  _init(gl) {
    this._gl = gl;
    // can also define locs per object if needed...
    // materials work this way, bvh objects etc

    this.timeLoc = gl.getUniformLocation(this.program, "uTime");
    this.uMVM = gl.getUniformLocation(this.program, "uModelViewMatrix");
    this.uPM = gl.getUniformLocation(this.program, "uProjectionMatrix");
    this.uMTM = gl.getUniformLocation(
      this.program,
      "uModelTransformationMatrix",
    );

    for (const loc of [...this.extraLocsNames]) {
      this.locs[loc] = gl.getUniformLocation(this.program, loc);
    }
  }

  /**
   * using the compiled vertex and fragment shader, link a shader program.
   * Additionally initialize the shader program's uniform / attribute locations
   *
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  load(gl = this._gl, scene = undefined) {
    this.program = gl.createProgram();

    gl.attachShader(this.program, this.vertexShader.shader);
    gl.attachShader(this.program, this.fragmentShader.shader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error(
        `Failed to link shader program: ${gl.getProgramInfoLog(this.program)}`,
      );
      gl.deleteProgram(this.program);
    }

    this._init(gl, scene);
  }

  /**
   * Add an extra loc to the shader program,
   * @param {string} loc uniform to locate in the shader program
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   * @returns {WebGLUniformLocation | null}
   */
  addLoc(loc, gl = this._gl) {
    this.locs[loc] = gl.getUniformLocation(this.program, loc);
    return this.locs[loc];
  }

  /**
   * Use the shader program as the active program
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  use(gl = this._gl) {
    if (!this.program) {
      console.warn("Cannot render before initializing the shader program");
      return;
    }
    gl.useProgram(this.program);
  }

  /**
   * Set a uniform value
   *
   * supports:
   *  float
   *  int
   *  vec2
   *  vec3
   *  vec4
   *
   * @param {string} loc the string name of the uniform
   * @param {number | number[]} value
   */
  _setUniform(loc, value, gl = this._gl) {
    const location = this.locs[loc];

    if (location == null) {
      console.warn("COuld not find location ", loc);
      return;
    }

    if (typeof value === "boolean") {
      gl.uniform1i(location, value ? 1 : 0);
      return;
    }

    if (typeof value === "number") {
      if (Number.isInteger(value)) {
        gl.uniform1i(location, value);
      } else {
        gl.uniform1f(location, value);
      }
      return;
    }

    if (!Array.isArray(value) && !ArrayBuffer.isView(value)) {
      throw new TypeError(`Unsupported value for uniform "${loc}"`);
    }

    const n = value.length;
    if (n < 2 || n > 4) {
      throw new RangeError(`Uniform "${loc}" expects a vec2, vec3, or vec4`);
    }

    const isFloatTypedArray =
      value instanceof Float32Array || value instanceof Float64Array;

    const isIntegerTypedArray =
      value instanceof Int8Array ||
      value instanceof Uint8Array ||
      value instanceof Int16Array ||
      value instanceof Uint16Array ||
      value instanceof Int32Array ||
      value instanceof Uint32Array;

    const isInteger =
      isIntegerTypedArray ||
      (!isFloatTypedArray && Array.from(value).every(Number.isInteger));

    const suffix = isInteger ? "iv" : "fv";

    gl[`uniform${n}${suffix}`](location, value);
  }
}
