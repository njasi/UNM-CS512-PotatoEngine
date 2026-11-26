/**
 * @module renderers/RenderPass
 */

import SceneObject from "../objects/SceneObject";
import Scene from "../Scene";
import { RenderTarget } from "./RenderTarget";

/**
 * Wrapper class to help define render order and different types of objects
 *
 * consider: ui elements, transparent, solid, shadow, etc
 *
 * @class
 * @alias module:renderers/RenderPass
 */
export default class RenderPass {
  // render to the canvas, dont think you can sample from this one
  static TARGET_CANVAS = RenderTarget.TARGET_CANVAS;
  static TARGET_PING = RenderTarget.TARGET_PING;
  static TARGET_PONG = RenderTarget.TARGET_PONG;
  static TARGET_PREV = RenderTarget.TARGET_PREV;

  /**
   * Create a render pass
   * @param {string} label
   * @param {*} options
   * @param {*} options.inputs  dictionary of label: RenderTarget label TARGET_CANVAS | TARGET_PING | TARGET_PONG | TARGET_PREV
   * @param {*} options.output
   * @param {*} options.viewport
   * @param {*} options.clearMask
   * @param {rgb()} options.clearColor the color to clear with
   * @param {function} options.setup callback function for before we start the pass
   * @param {function} options.cleanup callback function for after we've finished the pass
   * @param {function} options.updateUniforms callback function to call
   * @param {function} options.sort function that defines the render order of objects by sorting them
   * @param {boolean} [options.objIndependent=false] have the renderpass to run even if no objects in it
   */
  constructor(
    label,
    {
      inputs = {},
      output = RenderPass.TARGET_CANVAS,
      viewport = undefined,
      clearMask = 0,
      clearColor = undefined,
      setup = undefined,
      cleanup = undefined,
      updateUniforms = undefined,
      sort = undefined,
      objIndependent = false,
      programLabel = undefined,
    } = {},
  ) {
    this.label = label;
    this.inputs = { ...inputs };
    this.output = output;
    this.viewport = viewport;
    this.clearMask = clearMask;
    this.clearColor = clearColor;
    this.setup = setup;
    this.cleanup = cleanup;
    this.updateUniforms = updateUniforms;
    this.sort = sort;

    this.objIndependent = objIndependent;
    this.programLabel = programLabel;

    // override the default scene view / transform matrices
    this.matrices = undefined;

    this.objects = new Set();

    if (this.setup) {
      this.setup = this.setup.bind(this);
    }
    if (this.cleanup) {
      this.cleanup = this.cleanup.bind(this);
    }
    if (this.updateUniforms) {
      this.updateUniforms = this.updateUniforms.bind(this);
    }
  }

  /**
   * Add an object to the passes list
   * @param {SceneObject} obj Object to add
   */
  addObject(obj) {
    this.objects.add(obj);
  }

  /**
   * Remove an object from the passes collection
   * @param {SceneObject} obj Object to remove
   */
  removeObject(obj) {
    this.objects.delete(obj);
  }

  /**
   * Attach a render pass to a rendering session
   * @param {Scene} scene scene we are rendering in
   * @param {RenderTarget} output
   */
  attach(scene, output) {
    const gl = scene.gl;

    // NOTE: output is derived from this.output, but is not the same
    //       kept messing this up while writing this lol
    // see below: selectOutputRenderTarget
    // console.log(output)

    gl.bindFramebuffer(gl.FRAMEBUFFER, output ? output.framebuffer : null);

    const [x, y, width, height] = this.viewport ?? [
      0,
      0,
      scene.canvas.width,
      scene.canvas.height,
    ];

    gl.viewport(x, y, width, height);

    if (this.clearMask & gl.COLOR_BUFFER_BIT) {
      gl.clearColor(...(this.clearColor ?? scene.background));
    }

    if (this.clearMask) {
      gl.clear(this.clearMask);
    }

    if (!!this.setup) {
      this.setup(gl, scene, this);
    }
  }

  /**
   * Detach a render pass from the current rendering session
   * @param {Scene} scene scene we are rendering in
   */
  detach(scene) {
    if (!!this.cleanup) {
      this.cleanup(scene.gl, scene, this);
    }
  }

  /**
   * Get the objects to be rendered in this pass
   *
   * - applies the sort function if it is found
   *
   * @param {Scene} scene scene we are rendering in
   * @returns {SceneObject[]}
   */
  getObjects(scene) {
    // Iterate the Set directly unless sorting is requested.
    return this.sort
      ? [...this.objects].sort((a, b) => this.sort(a, b, scene))
      : this.objects;
  }

  /**
   * select the output target
   * @param {Scene} scene
   * @returns {undefined | RenderTarget}
   */
  selectOutputRenderTarget(scene) {
    if (this.output == RenderPass.TARGET_CANVAS) {
      return undefined;
    }

    if (this.output) {
      return scene.getRenderTarget(this.output);
    }

    return undefined;
  }

  /**
   * Select the input targets from the scene
   *
   * inputs are then attached in the scene and passed to the update uniforms cb
   *
   * @param {Scene} scene
   */
  selectInputRenderTargets(scene) {
    const inputs = {};

    for (const [name, source] of Object.entries(this.inputs)) {
      if (source == RenderPass.TARGET_PREV) {
        inputs[name] = scene.previousOutput;
      } else {
        inputs[name] = scene.getRenderTarget(source).colorTexture;
      }
    }

    return inputs;
  }
}
