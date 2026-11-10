/**
 * @module shaders/PhongShaderProgram
 */

import Light, { LIGHT_DIRECTIONAL, LIGHT_SPOT } from "../lights/Light";
import { SceneObject } from "../objects";
import { transformPoint } from "../util/transformations";
import ShaderProgram from "./ShaderProgram";

/**
 * Phong shader program class, I'm just using it to tack on another uniform for free
 * while still remaining readable if i have to deal with it later rather
 * than using the extras thing even though that would work
 *
 * @class
 * @alias module:shaders/PhongShaderProgram
 */
export default class RayShaderProgram extends ShaderProgram {
  /**
   * Create a new shader program
   *
   * Note that this shader program will have lights and materials
   * however they are packed in a unique way so we set them as false
   * to prevent the scene from doing normal stuff to it.
   *
   * @param {*} label
   * @param {*} vertexShader
   * @param {*} fragmentShader
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   * @param {Object} options
   * @param {boolean} [options.hasLight=false]
   * @param {boolean} [options.hasMaterial=false]
   */
  constructor(
    label,
    vertexShader,
    fragmentShader,
    { hasLight = false, hasMaterial = false, objIndependent = false } = {},
  ) {
    super(label, vertexShader, fragmentShader);

    this.hasLight = hasLight;
    this.hasMaterial = hasMaterial;

    this.lightBuffer = undefined;
    this.objectBuffer = undefined;
    this.materialBuffer = undefined;

    this.maxLights = 585;
    this.maxObjects = 585;
    this.maxMaterials = 64;
  }

  /**
   * Initialize the properties of the shader program
   * this mostly consists of getting uniform & attribute locations.
   * This additionally initializes the light buffer region, the light count uniform
   * and the light mask uniform.
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  _init(gl, scene = undefined) {
    super._init(gl, scene);
    this._gl = gl;

    gl.bindAttribLocation(this.program, 0, "position");

    gl.bindVertexArray(gl.createVertexArray());
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // dont feel like making uTime changes eveywhere
    // so that stays in camel format
    const defaultLocs = [
      "uTime",
      "u_resolution",
      "u_maxBounces",
      "u_ambientStrength",
      "u_cameraOrbit",
      "u_target",
      "u_objectCount",
      "u_lightCount",
    ];

    for (const loc of defaultLocs) {
      this.locs[loc] = gl.getUniformLocation(this.program, loc);
    }

    this.timeLoc = this.locs["uTime"]

    gl.useProgram(this.program)

    this.uniforms.u_resolution = new Float32Array([scene.canvas.width, scene.canvas.height]);
    this.uniforms.u_maxBounces = 2;
    this.uniforms.u_ambientStrength = 0.2;

    this._initBuffers(gl);
  }

  /**
   * Update the light count uniform
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   * @param {number} count how many lights are currently in the scene
   */
  setLightCount(count, gl = this._gl) {
    gl.uniform1i(this.uLightCount, count);
  }

  /**
   * Reserve buffers for object, light, material information
   *
   * this is slightly faster
   * than updating a bunch of uniform locations but a little more annoying
   * @param {WebGL2RenderingContext} gl the webgl2 context from the scene canvas
   */
  _initBuffers(gl = this._gl) {
    this.lightBuffer = gl.createBuffer();
    this.objectBuffer = gl.createBuffer();
    this.materialBuffer = gl.createBuffer();

    gl.bindBuffer(gl.UNIFORM_BUFFER, this.lightBuffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.objectBuffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, this.materialBuffer);

    gl.bufferData(
      gl.UNIFORM_BUFFER,
      this.maxLights * 16 * Float32Array.BYTES_PER_ELEMENT,
      gl.DYNAMIC_DRAW,
    );
    gl.bufferData(
      gl.UNIFORM_BUFFER,
      this.maxObjects * 16 * Float32Array.BYTES_PER_ELEMENT,
      gl.DYNAMIC_DRAW,
    );
    gl.bufferData(
      gl.UNIFORM_BUFFER,
      this.maxMaterials * 16 * Float32Array.BYTES_PER_ELEMENT,
      gl.DYNAMIC_DRAW,
    );

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.lightBuffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, this.objectBuffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 2, this.materialBuffer);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }
}
