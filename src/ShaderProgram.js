/**
 * Simple wrapper representation of a shader program
 */
export default class ShaderProgram {
  /**
   * Create a new shader program
   * @param {*} label 
   * @param {*} program 
   * @param {*} gl 
   */
  constructor(label, program, gl) {
    this.label = label;
    this.program = program;

    // NOTE: we are assuming here that all of our shaders will use these
    //       values if we do this here, may need extensions for other custom shaders
    this.posLoc = gl.getAttribLocation(program, "aPosition");
    this.colorLoc = gl.getAttribLocation(program, "aColor");

    // can also define locs per object if needed...
    // materials work this way

    this.timeLoc = gl.getUniformLocation(program, "uTime");
    this.uMVM = gl.getUniformLocation(program, "uModelViewMatrix");
    this.uPM = gl.getUniformLocation(program, "uProjectionMatrix");
    this.uMTM = gl.getUniformLocation(program, "uModelTransformationMatrix");
  }

  use(gl) {
    if (!this.program) {
      console.warn("Cannot render before initializing the shader program");
      return;
    }
    gl.useProgram(this.program);
  }
}
