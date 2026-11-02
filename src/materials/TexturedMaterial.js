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
   * @param {string} type
   * @param {string} textureLabel
   * @param {*} options
   */
  setTexture(type, textureLabel, options = {}) {
    const textureInfo = {
      textureLabel,
      ...options,
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
   * @param {*} type
   */
  removeTexture(type) {
    const locs = this._locs.get(type);

    // TODO figure out the internal structure of locs
    // how many needed per texture? should be a couple...
    // 1 for the texture sampler itself and then more for
    // config like one as a bool label use bump, bumpScale...?

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
      const texture = scene.getTexture(this.textureLabel);

      texture.bind(textureUnit);

      if (locs.sampler2D !== null) {
        gl.uniform1i(locs.sampler2D, textureUnit);
      }

      // TODO enumerate the other uniforms

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
    // TODO make full list of the locs we need per texture...

    // sampler2D : the texture itself
    // dynamic list of uniforms? since you can have things like bumpScale etc

    const locs = {
      sampler2D: this._gl.getUniformLocation(this._program),
    };

    this._locs.set(type, locs);
  }
}
