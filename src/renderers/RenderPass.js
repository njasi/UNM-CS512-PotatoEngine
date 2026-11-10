/**
 * @module renderers/RenderPass
 */

import SceneObject from "../objects/SceneObject";
import Scene from "../Scene";


/**
 * Wrapper class to help define render order and different types of objects
 *
 * consider: ui elements, transparent, solid, shadow, etc
 *
 * @class
 * @alias module:renderers/RenderPass
 */
export default class RenderPass {
  /**
   * Create a render pass
   * @param {string} label
   * @param {*} options 
   * @param {*} options.framebuffer
   * @param {*} options.viewport
   * @param {*} options.clearMask
   * @param {rgb()} options.clearColor the color to clear with
   * @param {function} options.setup callback function for before we start the pass
   * @param {function} options.cleanup callback function for after we've finished the pass
   * @param {function} options.updateUniforms callback function to call
   * @param {function} options.sort function that defines the render order of objects by sorting them
   */
  constructor(
    label,
    {
      framebuffer = undefined,
      viewport = undefined,
      clearMask = 0,
      clearColor = undefined,
      setup = undefined,
      cleanup = undefined,
      updateUniforms = undefined,
      sort = undefined,
    } = {},
  ) {
    this.label = label;
    this.framebuffer = framebuffer;
    this.viewport = viewport;
    this.clearMask = clearMask;
    this.clearColor = clearColor;
    this.setup = setup;
    this.cleanup = cleanup;
    this.updateUniforms = updateUniforms;
    this.sort = sort;

    // override the default scene view / transform matrices
    this.matrices = undefined

    this.objects = new Set();

    if(this.setup){
      this.setup = this.setup.bind(this);
    }
    if(this.cleanup){ 
      this.cleanup = this.cleanup.bind(this);
    }
    if(this.updateUniforms){
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
   */
  attach(scene) {
    const gl = scene.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

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
}
