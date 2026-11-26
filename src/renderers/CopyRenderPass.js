/**
 * @module renderers/CopyRenderPass
 */

import { Scene } from "..";
import { ShaderProgram } from "../shaders";
import RenderPass from "./RenderPass";

/**
 * A simple render pass which copies from one target to another
 *
 * NOTE: composite / overlay etc type passes should be derivable from this structure
 *       composite probably just have two input textures and then all 
 *       the hard work happens in the shader
 * 
 * @class
 *
 * @alias module:renderers/CopyRenderPass
 */
export default class CopyRenderPass extends RenderPass {
  static RENDER_PASS_COPY = "copy";
  static INPUT_SCENE = "scene";

  /**
   * Create a new copy render pass
   * 
   * NOTE: you probably want to use CopyRenderPass.add instead of 
   *       directly making one with this constructor
   * 
   * @param {string} label
   * @param {Object} [options={}]
   * @param {string} options.programLabel
   * @param {string} [options.input=RenderPass.TARGET_PING]
   * @param {string} [options.output=RenderPass.TARGET_CANVAS]
   */
  constructor(
    label,
    {
      programLabel,
      input = RenderPass.TARGET_PING,
      output = RenderPass.TARGET_CANVAS,
    } = {},
  ) {
    const vao = undefined;
    let pass;

    super(label, {
      inputs: {
        [CopyRenderPass.INPUT_SCENE]: input,
      },
      output: output,
      objIndependent: true,
      programLabel,
      updateUniforms: (gl, program, scene, _pass, _matrices, inputs) => {
        pass._draw(gl, program, inputs);
      },
    });

    pass = this;
  }

  /**
   * Registers the copy pass
   * - make sure you register after the other passes have been added
   *   the input pass has to already exist
   * 
   * @param {Scene} scene 
   * @param {Object} [options={}] 
   * @param {string} [options.label=CopyRenderPass.RENDER_PASS_COPY] 
   * @param {string} [options.programLabel=label] 
   * @param {string} [options.input=RenderPass.TARGET_PING] 
   * @param {string} [options.output=RenderPass.TARGET_CANVAS] 
   * @returns {CopyRenderPass}
   */
  static add(
    scene,
    {
      label = CopyRenderPass.RENDER_PASS_COPY,
      programLabel = label,
      input = RenderPass.TARGET_PING,
      output = RenderPass.TARGET_CANVAS,
    } = {},
  ) {
    const pass = new CopyRenderPass(label, { programLabel, input, output });
    pass.vao = scene.gl.createVertexArray();

    scene.addRenderPass(pass);
    return pass;
  }

  /**
   * draw the input buffer to the target
   * @param {WebGL2RenderingContext} gl 
   * @param {ShaderProgram} program 
   * @param {*} inputs 
   */
  _draw(gl, program, inputs) {
    const sceneTexture = inputs[CopyRenderPass.INPUT_SCENE];

    if (!sceneTexture) {
      throw new Error(
        `Copy pass "${this.label}" did not receive iniput texture`,
      );
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.uniform1i(program.locs.u_sceneTexture, 0);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * clean up
   * @param {*} gl 
   */
  dispose(gl) {
    gl.deleteVertexArray(this.vao);
  }
}
