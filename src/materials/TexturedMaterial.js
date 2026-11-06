/**
 * @module materials/TexturedMaterial
 */

import { Scene } from "..";
import { ShaderProgram } from "../shaders";
import Material from "./Material";

/**
 * Wrapper class to represent a material that uses texture data
 *
 * TODO might want to extend PhongMaterial to get those basic values...
 *
 * @class
 * @alias module:materials/TexturedMaterial
 */
export default class TexturedMaterial extends Material {
  /**
   * Default texture type name for normal texture maps
   */
  static TEXTURE_TYPE_NORMAL = "normal";
  /**
   * Default texture type name for bump texture maps
   */
  static TEXTURE_TYPE_BUMP = "bump";
  /**
   * Default texture type name for albedo (regular base color) texture maps
   */
  static TEXTURE_TYPE_ALBEDO = "albedo";
  /**
   * Default texture type name for secondary albedo map ( to blend with TEXTURE_TYPE_ALBEDO) texture maps
   */
  static TEXTURE_TYPE_ALBEDO2 = "albedo2";
  /**
   * Default texture type name for displacement texture maps (shifts all other maps in the texture)
   */
  static TEXTURE_TYPE_DISPLACEMENT = "displacement";

  /**
   * Default texture type name for color ramp texture (TextureColorRamp)
   */
  static TEXTURE_TYPE_COLOR_RAMP = "colorRamp";

  /**
   * Applies to TEXTURE_TYPE_BUMP
   *
   * The scale of bumps in bump maps
   *
   * type: float
   */
  static U_BUMP_SCALE = "uBumpScale";
  /**
   * Applies to TEXTURE_TYPE_NORMAL
   *
   * The scale of normals in normal map
   *
   * type: float
   */
  static U_NORMAL_SCALE = "uNormalScale";
  /**
   * Applies to TEXTURE_TYPE_DISPLACEMENT
   *
   * The u coord displacement
   *
   * type: float
   */
  static U_DISPLACEMENT_U = "uDisplacementU";
  /**
   * Applies to TEXTURE_TYPE_DISPLACEMENT
   *
   * The c coord displacement
   *
   * type: float
   */
  static U_DISPLACEMENT_V = "uDisplacementV";
  /**
   * Applies to TEXTURE_TYPE_DISPLACEMENT
   *
   * Scales the amount of displacement the displacement map causes
   *
   * type: float
   */
  static U_DISPLACEMENT_STRENGTH = "uDisplacementStrength";
  /**
   * Applies to TEXTURE_TYPE_ALBEDO, TEXTURE_TYPE_NORMAL, TEXTURE_TYPE_BUMP, TEXTURE_TYPE_DISPLACEMENT
   *
   * Scales the amount of displacement the displacement map causes
   *
   * type: vec2
   */
  static U_TILE = "uTile";

  /**
   * Applies to TEXTURE_TYPE_ALBEDO2 and TEXTURE_TYPE_ALBEDO
   * 
   * Select the blend mode between the two albedo maps
   */
  static U_BLEND_MODE = "uAlbedoBlendMode"

  /**
   * Make a new texturedmaterial
   * @param {*} label 
   * @param {*} textures 
   */
  constructor(label, textures = {}) {
    super(label);

    // texture information
    this._textures = new Map();
    this._locs = new Map();

    this.label = label;
    this.programLabel = undefined;

    for (const [type, cfg] of Object.entries(textures)) {
      this.setTexture(type, cfg.textureLabel, cfg);
    }
  }

  /**
   * Set the value of a texture type, ie normal, bump etc
   * @param {string} type the type of the texture
   * @param {string} textureLabel the label of the texture to use
   * @param {*} [options={}]
   * @param {string} [options.samplerUniform=undefined] specify the name of the  sampler uniform defaults to u<Type>Map
   * @param {string} [options.useUniform=undefined] specify the name of the use uniform defaults to uUse<Type>Map
   * @param {*} [options.extraUniforms={}] dictionary of supplemental uniforms {uniformName:value} pairs
   */
  setTexture(
    type,
    textureLabel,
    {
      samplerUniform = undefined,
      useUniform = undefined,
      extraUniforms = {},
    } = {},
  ) {
    const uLabel = type.charAt(0).toUpperCase() + type.slice(1);

    // add tile to extra by default
    extraUniforms = { ...extraUniforms, [`uTile${uLabel}`]: [1, 1] };

    if (TexturedMaterial.U_TILE in extraUniforms) {
      extraUniforms[TexturedMaterial.U_TILE + uLabel] =
        extraUniforms[TexturedMaterial.U_TILE];
      delete extraUniforms[TexturedMaterial.U_TILE];
    }

    const textureInfo = {
      textureLabel,
      samplerUniform: samplerUniform ?? `u${uLabel}Map`,
      useUniform: useUniform ?? `uUse${uLabel}Map`,
      extraUniforms: extraUniforms,
    };

    // TODO proper cleaning check here, this should work for now
    // to make sure an old texture is removed properly
    this.removeTexture(type);
    this._textures.set(type, textureInfo);

    if (this._gl && this._program) {
      // add after the program has started...
      this._getLocs(type, textureInfo);
    }
  }

  /**
   * Remove a texture from the material
   * @param {string} type the usage of the material in the shader eg normal, bump, etc
   */
  removeTexture(type) {
    const locs = this._locs.get(type);

    // make sure we turn off the texture usage in the shader before
    // we delete any information...
    if (!!locs && !!locs.use) {
      this._gl.uniform1i(locs.use, 0);
    }

    // TODO: I don't need to unbind anything here since we will
    // ignore related locs if the use loc is false, but
    // it might be better to not have garbage left behind

    this._textures.delete(type);
    this._locs.delete(type);
  }

  /**
   * Setup the texture(TODO s) location
   * @param {WebGL2RenderingContext} gl
   * @param {ShaderProgram} shaderProgram
   */
  initUniforms(gl, shaderProgram) {
    super.initUniforms(gl, shaderProgram);
    this._locs.clear();

    // will still need this to interface with my render loop in scene.
    this.programLabel = shaderProgram.label;

    for (const [type, texture] of this._textures) {
      this._getLocs(type, texture);
    }
  }

  /**
   * Bind the textures & update related uniforms
   * @param {WebGL2RenderingContext} gl
   * @param {Scene} scene the scene prompting the update
   */
  updateUniforms(gl, scene) {
    super.updateUniforms(gl);

    let textureUnit = 0;

    for (const [type, texture] of this._textures) {
      const locs = this._locs.get(type);
      const texture2d = scene.getTexture(texture.textureLabel);

      // TODO: do we need to verify the texture still exists?
      // might be useful since user could remove a texture while things
      // are running...

      texture2d.bind(textureUnit);

      if (!!locs.sampler) {
        this._gl.uniform1i(locs.sampler, textureUnit);
      }

      if (!!locs.use) {
        this._gl.uniform1i(locs.use, 1);
      }

      for (const [uniformName, value] of Object.entries(
        texture.extraUniforms,
      )) {
        // TODO: for now just support floats, vec2, maybe a robust
        // type split later?
        if (typeof value == "number") {
          // floats
          this._gl.uniform1f(locs[uniformName], value);
        } else if (
          // vec2 support
          typeof value == "object" &&
          Array.isArray(value) &&
          value.length == 2
        ) {
          this._gl.uniform2fv(locs[uniformName], value);
        } else {
          console.error(
            `Unsupported extra uniform (type, value): (${typeof value}, ${value})`,
          );
        }
      }

      textureUnit++;
    }
  }

  /**
   * Set the value of a extra uniform on a texture map
   * without re setting the entire texture
   * @param {String} type
   * @param {String} uniformName
   * @param {*} value
   */
  setTextureExtraUniform(type, uniformName, value) {
    const texture = this._textures.get(type);
    if (!texture) {
      throw new Error(`Texture type "${type}" is not set`);
    }

    if (uniformName == TexturedMaterial.U_TILE) {
      uniformName += type.charAt(0).toUpperCase() + type.slice(1);
    }

    // updated value will propagate to shader in updateUniforms
    texture.extraUniforms[uniformName] = value;

    // update the locations as well
    // since we could be adding an extra loc
    const locs = this._locs.get(type);
    if (this._gl && this._program && locs && !(uniformName in locs)) {
      locs[uniformName] = this._gl.getUniformLocation(
        this._program,
        uniformName,
      );
    }
  }

  /**
   * Clean up the uniforms after material was used
   */
  cleanup() {
    super.cleanup();
    for (const [type, _] of this._textures) {
      this.disableTexture(type);
    }
  }

  /**
   * Disable the usage uniform for a texture
   * @param {string} type the type of texture eg normal, bump, etc
   */
  disableTexture(type) {
    this._setTextureUsageUniform(type, 0);
  }

  /**
   * Enable the usage uniform for a texture
   * @param {string} type the type of texture eg normal, bump, etc
   */
  enableTexture(type) {
    this._setTextureUsageUniform(type, 1);
  }

  /**
   * Set the usage uniform for the given
   * @param {string} type the type of texture eg normal, bump, etc
   * @param {boolean} value
   */
  _setTextureUsageUniform(type, value) {
    const locs = this._locs.get(type);
    this._gl.uniform1i(locs.use, value);
  }

  /**
   * Find all the locs related to a specific texture type
   * and update the internal locs map
   * @param {string} type
   * @param {*} texture
   */
  _getLocs(type, texture) {
    const locs = {
      sampler: this._gl.getUniformLocation(
        this._program,
        texture.samplerUniform,
      ),
      use: this._gl.getUniformLocation(this._program, texture.useUniform),
    };

    // get the cursed extra uniforms, may want to nest these or prefix them with
    // the type by default?
    for (const extraUniformName of Object.keys(texture.extraUniforms)) {
      locs[extraUniformName] = this._gl.getUniformLocation(
        this._program,
        extraUniformName,
      );
    }

    this._locs.set(type, locs);
  }
}
