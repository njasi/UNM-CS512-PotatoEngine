/**
 * @module materials/TexturedMaterial
 */

// will need add support for a object having a bunch of textures
// normal, bump, color etc, but im tired for now these docstrings
// were annoying and distrcted me from actually finishing the texture
// related code lol
// probably also want to extend the phong mat to get the base
// values

import { Scene } from "..";
import { ShaderProgram } from "../shaders";

/**
 * Wrapper class to represent a material that uses texture data
 *
 * @class
 * @alias module:materials/TexturedMaterial
 */
export default class TexturedMaterial extends Material {
  constructor(label, textures = {}) {
    // internal state for ease of use
    // TODO should do this across the other classes...
    // would be cleaner than the current annoying pass
    // gl everywhere structure
    this._gl = undefined;
    this._program = undefined;

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

    const textureInfo = {
      textureLabel,
      samplerUniform: samplerUniform ?? `u${uLabel}Map`,
      useUniform: useUniform ?? `uUse${uLabel}Map`,
      extraUniforms: extraUniforms,
    };

    // TODO proper cleaning check here, this should work for now
    // to make sure an old texture is removed properly
    this.removeTexture(type);
    this.textures.set(type, textureInfo);

    if (this._gl && this._program) {
      // add after the program has started...
      this._getLocs(type, texture);
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

    this.textures.delete(type);
    this._locs.delete(type);
  }

  /**
   * Setup the texture(TODO s) location
   * @param {WebGL2RenderingContext} gl
   * @param {ShaderProgram} shaderProgram
   */
  initUniforms(gl, shaderProgram) {
    super.initUniforms(gl, shaderProgram);
    // honestly i should start tracking gl and related objects everywhere
    // since it makes other functions easier to work with
    this._gl = gl;
    this._program = shaderProgram.program;
    this._locs.clear();

    // will still need this to interface with my render loop in scene.
    this.programLabel = shaderProgram.label;

    for (const [type, texture] of this.textures) {
      this._getLocs(type, texture);
    }
  }

  /**
   * Bind the textures & update related uniforms
   * @param {WebGL2RenderingContext} gl
   * @param {Scene} scene
   */
  updateUniforms(gl, scene) {
    super.updateUniforms(gl);

    const textureUnit = 0;

    for (const [type, texture] of this.textures) {
      const locs = this._locs.get(type);
      const texture2d = scene.getTexture(this.textureLabel);

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
        // TODO: for now just support floats, maybe a robust
        // type split later?
        if (typeof value == "number") {
          this._gl.uniform1f(locs[uniformName], value);
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
   * Find all the locs related to a specific texture type
   * and update the internal locs map
   * @param {string} type
   * @param {*} texture
   */
  _getLocs(type, texture) {
    const locs = {
      sampler: this._gl.getUniformLocation(this._program),
      use: this._gl.getUniformLocation(this._program, texture.useUniform),
    };

    for (const extraUniformName of Object.keys(texture.extraUniforms)) {
      locs[extraUniformName] = gl.getUniformLocation(
        this._program,
        extraUniformName,
      );
    }

    this._locs.set(type, locs);
  }
}
