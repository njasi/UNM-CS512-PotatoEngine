import { rgba } from "../util/color";

import ShaderProgram from "../shaders/ShaderProgram";
import { transformPoint } from "../util/transformations";

export const LIGHT_POINT = 0;
export const LIGHT_SPOT = 1;
export const LIGHT_DIRECTIONAL = 2;

export default class Light {
  /**
   * Representation of a light source
   * @param {*} label
   * @param {*} position
   * @param {*} options
   * @param {*} options.color
   * @param {*} options.intensity
   * @param {*} options.type
   */
  constructor(
    label,
    position,
    {
      color = rgba(255, 255, 255, 1),
      intensity = 1.0,
      type = LIGHT_POINT,
    } = {},
  ) {
    this.label = label;
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
   * - access the ith element in uLights and grab the
   *   respective properties
   *
   * @param {*} gl
   * @param {ShaderProgram} shader
   * @param {Number} index
   */
  updateLocs(gl, shader, index) {
    this.positionLoc = gl.getUniformLocation(
      shader.program,
      `uLights[${index}].position`,
    );
    this.colorLoc = gl.getUniformLocation(
      shader.program,
      `uLights[${index}].color`,
    );
    this.intensityLoc = gl.getUniformLocation(
      shader.program,
      `uLights[${index}].intensity`,
    );
    this.typeLoc = gl.getUniformLocation(
      shader.program,
      `uLights[${index}].type`,
    );
  }

  /**
   * Update the value of the uniform for this light
   * @param {*} gl
   * @param {mat4} transformation transformation to apply before sending point to shader
   */
  updateUniforms(gl, transformation) {
    const tPosition = transformPoint(this.position, transformation)

    gl.uniform3f(
      this.positionLoc,
      tPosition[0],
      tPosition[1],
      tPosition[2],
    );

    gl.uniform3f(this.colorLoc, this.color[0], this.color[1], this.color[2]);

    gl.uniform1f(this.intensityLoc, this.intensity);

    gl.uniform1i(this.typeLoc, this.type);
  }

  /**
   * Update the light for the given shader
   * - refinds the locations (for if the indexes have changed)
   * - then updates the uniform locs
   * @param {*} gl
   * @param {ShaderProgram} shader
   * @param {mat4} transformation   transformation to apply before sending point to shader
   * @param {Number} index
   */
  update(gl, shader, transformation, index) {
    this.updateLocs(gl, shader, index);
    this.updateUniforms(gl, transformation);
  }
}
