/**
 * Simple wrapper representation of a shader program
 */
export default class ShaderProgram {
  /**
   * Create a new shader program
   * @param {*} label
   * @param {*} program
   * @param {*} gl
   * @param {Object} [options={}]
   * @param {boolean} [options.hasMaterial=false]
   * @param {boolean} [options.hasLight=false]
   * @param {string[]} [options.extraLocs=[]]
   */
  constructor(
    label,
    program,
    gl,
    { hasMaterial = false, hasLight = false, extraLocs = [] } = {},
  ) {
    this.label = label;
    this.program = program;

    this.hasMaterial = hasMaterial;
    this.hasLight = hasLight;

    // NOTE: we are assuming here that all of our shaders will use these
    //       values if we do this here, may need extensions for other custom shaders
    this.posLoc = gl.getAttribLocation(this.program, "aPosition");
    this.colorLoc = gl.getAttribLocation(this.program, "aColor");

    // can also define locs per object if needed...
    // materials work this way

    this.timeLoc = gl.getUniformLocation(this.program, "uTime");
    this.uMVM = gl.getUniformLocation(this.program, "uModelViewMatrix");
    this.uPM = gl.getUniformLocation(this.program, "uProjectionMatrix");
    this.uMTM = gl.getUniformLocation(
      this.program,
      "uModelTransformationMatrix",
    );

    for (const loc of extraLocs) {
      this.extraLocs[loc] = gl.getUniformLocation(this.program, loc);
    }
  }

  /**
   * Add an extra loc
   * @param {*} loc
   * @param {*} gl 
   */
  addLoc(loc, gl) {
    this.extra[loc] = gl.getUniformLocation(this.program, loc);
  }

  /**
   * Use the shader program
   * @param {*} gl 
   * @returns 
   */
  use(gl) {
    if (!this.program) {
      console.warn("Cannot render before initializing the shader program");
      return;
    }
    gl.useProgram(this.program);
  }
}
