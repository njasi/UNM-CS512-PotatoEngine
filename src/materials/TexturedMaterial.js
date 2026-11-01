// will need add support for a object having a bunch of textures
// normal, bump, color etc, but im tired for now these docstrings
// were annoying and distrcted me from actually finishing the texture
// related code lol
// probably also want to extend the phong mat to get the base 
// values

import { Scene } from "..";
import { ShaderProgram } from "../shaders";


/**
 * 
 */
export default class TexturedMaterial extends Material {
  constructor(label, textureLabel) {
    super(label);
    this.textureLabel = textureLabel;
    this.textureLoc = null;
  }

  /**
   * Setup the texture(TODO s) location
   * @param {WebGL2RenderingContext} gl 
   * @param {ShaderProgram} shaderProgram 
   */
  initUniforms(gl, shaderProgram) {
    super.initUniforms(gl, shaderProgram)
    this.textureLoc = gl.getUniformLocation(
      shaderProgram.program,
      "uTexture",
    );
  }

  /**
   * bind the textures
   * @param {WebGL2RenderingContext} gl 
   * @param {Scene} scene 
   */
  updateUniforms(gl, scene) {
    super.updateUniforms(gl)

    const textureUnit = 0;
    const texture = scene.getTexture(this.textureLabel);

    texture.bind(textureUnit);

    if (this.textureLoc !== null) {
      gl.uniform1i(this.textureLoc, textureUnit);
    }
  }
}
