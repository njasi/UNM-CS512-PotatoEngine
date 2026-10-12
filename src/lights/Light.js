import { rgba } from "../objects";
import ShaderProgram from "../ShaderProgram";

class Light {
  constructor(
    label,
    {
      position,
      color = rgba(255, 255, 255, 1),
      intensity = 1.0,
      type = "point",
    } = {},
  ) {
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    // probably turn type into an int enum later
    this.type = type;

    this.positionLoc = undefined;
    this.colorLoc = undefined;
    this.intensityLoc = undefined;
    this.typeLoc = undefined;
  }

  /**
   * Update the light's loc values
   * @param {*} gl
   * @param {ShaderProgram} shader The
   */
  getLocs(gl, shader) {
    // can i get the position of elements of a struct?
    // would be useful here...
    // esp if can bind to elements in an array...
    this.positionLoc = gl.getUniformLocation(shader.program, "uLightPosition");
    this.colorLoc = gl.getUniformLocation(shader.program, "uLightColor");
    this.intensityLoc = gl.getUniformLocation(
      shader.program,
      "uLightIntensity",
    );
    this.typeLoc = gl.getUniformLocation(shader.program, "uLightType");
  }

  bindBuffers(gl) {
    // how to bind an individual light to a array?
  }
}
