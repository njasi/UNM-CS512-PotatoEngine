/**
 * @module renderers/RayRenderPass
 */

import RayObject from "../objects/RayObject";
import RenderPass from "./RenderPass";

/**
 * Wrapper class to help define render order and different types of objects
 *
 * Specifically this subclass handles a ray tracing type pass
 * - additional list to tracks lights
 * - TODO additional handling for textures
 * - TODO additional handling for materials
 *
 * @class
 * @alias module:renderers/RayRenderPass
 */
export default class RayRenderPass extends RenderPass {
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
   * @param {boolean} [options.objIndependent=false] have the renderpass to run even if no objects in it
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
      objIndependent = false,
      programLabel = undefined,
    } = {},
  ) {
    super(label, {
      framebuffer,
      viewport,
      clearMask,
      clearColor,
      setup,
      cleanup,
      updateUniforms,
      sort,
      objIndependent,
      programLabel,
    });

    // add lights set
    this.lights = new Set();
  }

  /**
   * Add an object to the passes list
   * @param {RayObject} obj Object to add
   */
  addObject(obj) {
    if (obj.light) {
      this.lights.add(obj);
    } else {
      super.addObject(obj);
    }
  }

  /**
   * Remove an object from the passes collection
   * @param {RayObject} obj Object to remove
   */
  removeObject(obj) {
    // just try removing from both for simplicity
    super.removeObject(obj);
    this.objects.delete(obj);
  }
}
