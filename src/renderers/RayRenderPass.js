/**
 * @module renderers/RayRenderPass
 */

import { RayMaterial } from "../materials";
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
    // track pass materials set so we dont have to look up the scene info every frame
    this.materials = [];
    // map material label to material index
    this.materialMap = new Map();
    // track textures for the same reason
    // maybe work with a 2dtexture array since theres a limited number of bind points
    // 16? of them i think. Less of a problem in the others since objects are tendered
    // one at a time, but with this its an issue...
    this.textures = new Set();
  }

  /**
   * Add an object to the passes list
   * @param {RayObject} obj Object to add
   */
  addObject(obj) {
    obj.materialIndex =
      this.materialMap.get(obj.materialLabel) ?? obj.materialIndex;
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

  /**
   * Add a material to the renderpass
   * @param {RayMaterial} material
   */
  addMaterial(material) {
    material.materialIndex = this.materials.length;
    this.materialMap.set(material.label, material.materialIndex);
    this.materials.push(material);
  }

  /**
   * Remove a material from the renderpass
   *
   * make sure material indexes stay in sync...
   * @param {RayMaterial} material
   */
  removeMaterial(material) {
    this.materials.filter((m) => m.label != material.label);
    m = new Map();
    this.materials.forEach((mat, index) => {
      m.set(mat.label, index);
    });
    this.materialMap = m;
    this.objects.forEach((obj) => {
      obj.materialIndex =
        this.materialMap.get(obj.materialLabel) ?? obj.materialIndex;
    });
  }

  /**
   * Add a texture to the renderpass
   * @param {} texture
   */
  addTexture(texture) {
    this.textures.add(texture);
  }

  /**
   * Remove a texture from the renderpass
   * @param {} texture
   */
  removeTexture(texture) {
    this.textures.delete(texture);
  }
}
