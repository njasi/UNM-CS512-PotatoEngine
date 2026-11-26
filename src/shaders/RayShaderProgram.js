/**
 * @module shaders/PhongShaderProgram
 */

import {
  TYPE_DROPDOWN_SELECTOR,
  TYPE_READ_ONLY,
  TYPE_SHADER_PROGRAM_UNIFORMS,
} from "../controls/sceneEditor";
import { RayMaterial } from "../materials";
import DataTexture from "../textures/DataTexture";
import { RayObject, SceneObject } from "../objects";
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
  static GLASS_MODE_DOMINANT = 0;
  static GLASS_MODE_CONTRIBUTION = 1;
  static GLASS_MODE_SAMPLE = 2;
  static GLASS_MODE_NONE = 3;

  static SHADOW_MODE_FAST = 0;
  static SHADOW_MODE_FAST_GLASS = 1;
  static SHADOW_MODE_SIMPLE_GLASS = 2;
  static SHADOW_MODE_TIR_GLASS = 3;

  static EDITOR_PROPERTIES = [
    "hasMaterial",
    "hasLight",
    { name: "maxLights", type: TYPE_READ_ONLY },
    { name: "maxObjects", type: TYPE_READ_ONLY },
    { name: "maxMaterials", type: TYPE_READ_ONLY },
    {
      name: "uniforms",
      type: TYPE_SHADER_PROGRAM_UNIFORMS,
      u_glassMode: {
        type: TYPE_DROPDOWN_SELECTOR,
        options: [
          [RayShaderProgram.GLASS_MODE_DOMINANT, "GLASS_MODE_DOMINANT"],
          [RayShaderProgram.GLASS_MODE_CONTRIBUTION, "GLASS_MODE_CONTRIBUTION"],
          [RayShaderProgram.GLASS_MODE_SAMPLE, "GLASS_MODE_SAMPLE"],
          [RayShaderProgram.GLASS_MODE_NONE, "GLASS_MODE_NONE"],
        ],
        cast: Number,
      },
      u_shadowMode: {
        type: TYPE_DROPDOWN_SELECTOR,
        options: [
          [RayShaderProgram.SHADOW_MODE_FAST, "SHADOW_MODE_FAST"],
          [RayShaderProgram.SHADOW_MODE_FAST_GLASS, "SHADOW_MODE_FAST_GLASS"],
          [
            RayShaderProgram.SHADOW_MODE_SIMPLE_GLASS,
            "SHADOW_MODE_SIMPLE_GLASS",
          ],
          [RayShaderProgram.SHADOW_MODE_TIR_GLASS, "SHADOW_MODE_TIR_GLASS"],
        ],
        cast: Number,
      },
    },
  ];

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

    this.objectDataTexture = undefined;
    this.lightDataTexture = undefined;
    this.materialBuffer = undefined;

    this.maxLights = 146;
    this.maxObjects = 146;
    this.maxMaterials = 204;
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
      "u_glassMode",
      "u_shadowMode",
      "u_time",
      "u_resolution",
      "u_maxBounces",
      "u_ambientStrength",
      "u_cameraOrbit",
      "u_target",
      "u_objectCount",
      "u_objectData",
      "u_objectDataWidth",
      "u_lightCount",
      "u_lightData",
      "u_lightDataWidth",
      "u_materialCount",
      "u_materialData",
      "u_materialDataWidth",
      "u_raySamples",
      "u_maxShadowLayers",
      "u_shadowMixRatio",
      "u_fov",
      "u_textureLayerCount0",
      "u_textureLayerCount1",
      "u_textures",
      "u_texturesBaked",
    ];

    for (const loc of defaultLocs) {
      this.locs[loc] = gl.getUniformLocation(this.program, loc);
    }

    this.timeLoc = this.locs["u_time"];

    gl.useProgram(this.program);

    this.uniforms.u_glassMode = 2;
    this.uniforms.u_shadowMode = 1;
    this.uniforms.u_resolution = new Float32Array([
      scene.canvas.width,
      scene.canvas.height,
    ]);
    this.uniforms.u_shadowMixRatio = 0.99999;
    this.uniforms.u_maxBounces = 3;
    this.uniforms.u_ambientStrength = 0.2;
    this.uniforms.u_raySamples = 1;
    this.uniforms.u_maxShadowLayers = 4;
    this.uniforms.u_textures = 0;
    this.uniforms.u_texturesBaked = 1;

    let maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxTextureBytes = maxSize * maxSize * 16;
    this.maxObjects = Math.min(
      Math.floor(maxTextureBytes / RayObject.OBJECT_BYTE_SIZE),
      Math.floor(maxTextureBytes / RayObject.OBJECT_TRANSFORM_BYTE_SIZE),
    );
    this.maxLights = this.maxObjects;
    this.maxMaterials = Math.floor(
      maxTextureBytes / RayMaterial.MATERIAL_BYTE_SIZE,
    );

    this.materialDataTexture = new DataTexture(gl);
    this.objectDataTexture = new DataTexture(gl);
    this.lightDataTexture = new DataTexture(gl);
  }
}
