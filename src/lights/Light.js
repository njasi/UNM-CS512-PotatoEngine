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
   * @param {number} [options.attA=1] Light attenuation constant value
   * @param {number} [options.attB=0.09] Light attenuation linear value
   * @param {number} [options.attC=0.032] Light attenuation quadratic value
   */
  constructor(
    label,
    position,
    {
      color = rgba(255, 255, 255, 1),
      intensity = 1.0,
      type = LIGHT_POINT,
      attA = 1,
      attB = 0.09,
      attC = 0.032,
    } = {},
  ) {
    this.label = label;
    this.position = position;
    this.color = color;
    this.intensity = intensity;
    // probably turn type into an int enum later
    this.type = type;
    this.attA = attA;
    this.attB = attB;
    this.attC = attC;

    this.positionLoc = undefined;
    this.colorLoc = undefined;
    this.intensityLoc = undefined;
    this.typeLoc = undefined;
    this.attALoc = undefined;
    this.attBLoc = undefined;
    this.attCLoc = undefined;
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
    this.attALoc = gl.getUniformLocation(
      shader.program,
      `uLights[${index}].attA`,
    );
    this.attBLoc = gl.getUniformLocation(
      shader.program,
      `uLights[${index}].attB`,
    );
    this.attCLoc = gl.getUniformLocation(
      shader.program,
      `uLights[${index}].attC`,
    );
  }

  /**
   * Update the value of the uniform for this light
   * @param {*} gl
   * @param {mat4} transformation transformation to apply before sending point to shader
   */
  updateUniforms(gl, transformation) {
    const tPosition = transformPoint(this.position, transformation);

    gl.uniform3f(this.positionLoc, tPosition[0], tPosition[1], tPosition[2]);

    gl.uniform3f(this.colorLoc, this.color[0], this.color[1], this.color[2]);

    gl.uniform1f(this.intensityLoc, this.intensity);

    gl.uniform1i(this.typeLoc, this.type);

    gl.uniform1f(this.attALoc, this.attA);
    gl.uniform1f(this.attBLoc, this.attB);
    gl.uniform1f(this.attCLoc, this.attC);
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
