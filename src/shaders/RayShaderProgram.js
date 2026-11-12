/**
 * @module shaders/PhongShaderProgram
 */

import Light, { LIGHT_DIRECTIONAL, LIGHT_SPOT } from "../lights/Light";
import { RayMaterial } from "../materials";
import { RayObject, SceneObject } from "../objects";
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

    this.maxLights = 146;
    this.maxObjects = 146;
    this.maxMaterials = 256;
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

    const defaultLocs = [
      "u_time",
      "u_resolution",
      "u_maxBounces",
      "u_ambientStrength",
      "u_cameraOrbit",
      "u_target",
      "u_objectCount",
      "u_lightCount",
      "u_materialCount",
      "u_raySamples",
      "u_glassMode",
      "u_maxShadowLayers",
      "u_tirShadow",
    ];

    for (const loc of defaultLocs) {
      this.locs[loc] = gl.getUniformLocation(this.program, loc);
    }

    this.timeLoc = this.locs["u_time"];

    gl.useProgram(this.program);

    this.uniforms.u_resolution = new Float32Array([
      scene.canvas.width,
      scene.canvas.height,
    ]);
    this.uniforms.u_maxBounces = 3;
    this.uniforms.u_ambientStrength = 0.2;
    this.uniforms.u_raySamples = 1;
    this.uniforms.u_glassMode = 2;
    this.uniforms.u_maxShadowLayers = 8;

    const maxBlockBytes = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE);
    this.maxObjects = Math.floor(maxBlockBytes / RayObject.OBJECT_BYTE_SIZE);
    this.maxLights = this.maxObjects;
    this.maxMaterials = Math.floor(
      maxBlockBytes / RayMaterial.MATERIAL_BYTE_SIZE,
    );

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
    this.lightBuffer = this._initBuffer(
      0,
      this.maxLights,
      RayObject.OBJECT_BYTE_SIZE,
    );
    this.objectBuffer = this._initBuffer(
      1,
      this.maxObjects,
      RayObject.OBJECT_BYTE_SIZE,
    );
    this.materialBuffer = this._initBuffer(
      2,
      this.maxMaterials,
      RayMaterial.MATERIAL_BYTE_SIZE,
    );

    const blockBindings = [
      ["lightBlock", 0],
      ["objectBlock", 1],
      ["materialBlock", 2],
    ];

    for (const [blockName, bindingPoint] of blockBindings) {
      const blockIndex = gl.getUniformBlockIndex(this.program, blockName);

      // might be inactive if unused or nonexistanct
      if (blockIndex !== gl.INVALID_INDEX) {
        gl.uniformBlockBinding(this.program, blockIndex, bindingPoint);
      }
    }

    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  _initBuffer(binding, capacity, stride, gl = this._gl) {
    const size = capacity * stride;
    const maxBlockSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE);

    // should probably auto adjust capacity but error works for now
    if (size > maxBlockSize) {
      throw new Error(
        `block needs ${size} bytes; device limit is ${maxBlockSize}`,
      );
    }

    const buffer = gl.createBuffer();

    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
    gl.bufferData(gl.UNIFORM_BUFFER, size, gl.DYNAMIC_DRAW);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, binding, buffer);

    return buffer;
  }
}
