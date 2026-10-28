import { transformPoint } from "../util/transformations";
import ShaderProgram from "./ShaderProgram";

/**
 * Phong shader program, I'm just using it to tack on another uniform for free
 * while still remaining readable if i have to deal with it later rather
 * than using the extras thing even though that would work
 */
export default class PhongShaderProgram extends ShaderProgram {
  /**
   * Create a new shader program
   * @param {*} label
   * @param {*} program
   * @param {*} gl
   * @param {Object} options
   * @param {number} [options.maxLights=64]
   * @param {boolean} [options.hasLight=true]
   * @param {boolean} [options.hasMaterial=true]
   */
  constructor(
    label,
    program,
    gl,
    { maxLights = 64, hasLight = true, hasMaterial = true },
  ) {
    super(label, program, gl);
    this.hasLight = hasLight;
    this.hasMaterial = hasMaterial;
    this.maxLights = maxLights;

    this.uLightCount = gl.getUniformLocation(this.program, "uLightCount");
    this.lightBuffer;

    this._initLightBuffer(gl, this.maxLights);
  }

  /**
   * Update the light count uniform
   * @param {*} count
   * @param {*} gl
   */
  setLightCount(gl, count) {
    gl.uniform1i(this.uLightCount, count);
  }

  /**
   * Reserve a buffer for lighting information.
   * @param {*} gl
   * @param {*} maxLights
   */
  _initLightBuffer(gl, maxLights) {
    this.maxLights = maxLights;
    this.lightBuffer = gl.createBuffer();

    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lightBuffer);

    gl.bufferData(
      gl.UNIFORM_BUFFER,
      maxLights * 16 * Float32Array.BYTES_PER_ELEMENT,
      gl.DYNAMIC_DRAW,
    );

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.lightBuffer);

    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Pack the lighting information into arrays for the lighting buffer...
   *
   * If i figure out some form of light change tracking, can I just update
   * that section of the buffer? Unsure if its needed though. most of the
   * work load seems to be gpu bottlenecking
   *
   * @param {*} lightTransformation
   * @returns
   */
  _packLightData(lightTransformation, lights) {
    const count = lights.length;

    if (count > this.maxLights) {
      throw new Error(
        `Scene has ${count} lights, but ${this.label}'s buffer supports ${this.maxLights}.`,
      );
    }

    const data = new Float32Array(this.maxLights * 16);

    const positionOffset = 0;
    const colorOffset = this.maxLights * 4;
    const attenuationOffset = this.maxLights * 8;
    const directionOffset = this.maxLights * 12;

    const origin = transformPoint([0, 0, 0], lightTransformation);

    for (let i = 0; i < count; i++) {
      const light = lights[i];

      const position = transformPoint(light.position, lightTransformation);
      const endpoint = transformPoint(light.direction, lightTransformation);

      const ip = positionOffset + i * 4;
      const ic = colorOffset + i * 4;
      const ia = attenuationOffset + i * 4;
      const id = directionOffset + i * 4;

      data[ip] = position[0];
      data[ip + 1] = position[1];
      data[ip + 2] = position[2];
      data[ip + 3] = light.type;

      data[ic] = light.color[0];
      data[ic + 1] = light.color[1];
      data[ic + 2] = light.color[2];
      data[ic + 3] = light.intensity;

      data[ia] = light.attA;
      data[ia + 1] = light.attB;
      data[ia + 2] = light.attC;
      data[ia + 3] = light.cutoff;

      data[id] = endpoint[0] - origin[0];
      data[id + 1] = endpoint[1] - origin[1];
      data[id + 2] = endpoint[2] - origin[2];
      data[id + 3] = light.spotExponent;
    }

    return data;
  }

  /**
   * Upload the scene light information into the shader program buffer
   * This buffer should actually be global, so might not even need to call
   * it for all shader programs if they use the same format. unsure though.
   * might need a new binding per program but maybe not upload.
   *
   * This is faster than the uniform method, but still slow on the gpu end
   * when there are >30 lights, at least on my 2012 laptop lol.
   * Distance based light culling might be a good idea, since lights by
   * default will have attenuation, and this would also effect spotlights
   *
   * @param {*} gl
   * @param {*} lightTransformation
   */
  _uploadLightData(gl, lightTransformation, lights) {
    const data = this._packLightData(lightTransformation, lights);
    const lightCount = lights.length;

    if (lightCount > this.maxLights) {
      throw new Error(
        `Scene has ${lightCount} lights, but ${this.label}'s GPU buffer supports ${this.maxLights}.`,
      );
    }

    // shove the data into the buffer
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lightBuffer);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data, 0, data.length);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.lightBuffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  /**
   * Update the shader's light buffer
   * @param {*} gl
   * @param {*} lightTransformation
   * @param {*} lights
   * @returns
   */
  updateLights(gl, lightTransformation, lights) {
    if (!this.hasLight) {
      return;
    }

    this._uploadLightData(gl, lightTransformation, lights);
  }
}
