/**
 * @module objects/RayObject
 */

import { Scene } from "..";
import { vec4distance, scaleVec4, sumVec4 } from "../util/vec4";
import SceneObject from "./SceneObject";

/**
 * Physics Scene object class, these objects have
 * - simple gravity
 * - movement velocity
 * - rotational velocity
 * - basic collisions (spheres atm)
 *
 * @class
 * @alias module:objects/RayObject
 */
export default class RayObject extends SceneObject {
  /**
   * Make a new RayObject, a scene object meant to run in the
   * hw7 based ray tracing fragment. Note that this object type is unique and does
   * not rely on a mesh like all of our previous setup, it relies on the shader
   * to construct the information at runtime. This also means that
   * things like texture uvs, tangents etc will also have to be constructed at
   * runtime.
   *
   * NOTE: Although a mesh should be usable in a ray tracer like this, consider checking the
   * reflection for a triangle and just representing the reflection of a mesh as a triangle
   * lookup then triangle reflection.
   *
   * NOTE: it could be reasonable to have all interaction with this type of object within
   * the shader itself, but I like the structure of using shader as renderer and js as
   * the logical control in webgl so I'll maintain that for now
   *
   * NOTE: js doesn't have multi class inheritance baked in so will be annoying to transfer the
   * tiny changes in the physics object class for example. Can do something messy to accomplish it
   * though..
   *
   * @param {string} label
   * @param {number} type                           the type of object to render in the ray traced scene
   * @param {*} options
   * @param {SceneObject} options.parent            the parent of this object (can be set through addChild instead)
   * @param {number[]} options.position             initial three tuple [x,y,z] position of the object
   * @param {number[]} options.rotation             initial three tuple [x,y,z] rotation of the object
   * @param {number[]} options.scale                initial three tuple [x,y,z] scale of the object
   * @param {boolean} options.shouldDraw            if this object should be drawn
   * @param {string} options.programLabel           the program to draw this object with
   * @param {string} options.materialLabel          the material to use with this object
   * @param {string} options.child                  if the object is a child
   * @param {string} options.passes                 the renderpasses to render this object with
   * @param {string} options.lightingCenter         the center of the object to calculate light culling with
   * @param {string} options.lightingRadius         the radius of the object to use when calculate light culling
   */
  constructor(
    label,
    type,
    {
      // basic scene object options
      parent = undefined,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = [1, 1, 1],
      shouldDraw = true,
      programLabel = undefined,
      materialLabel = undefined,
      child = false,
      passes = undefined,
      lightingCenter = [0, 0, 0],
      lightingRadius = 1,
    } = {},
  ) {
    super(label, {
      parent,
      position,
      rotation,
      scale,
      shouldDraw,
      programLabel,
      materialLabel,
      lightingCenter,
      lightingRadius,
      child,
      passes,
    });

    this.type = type;
  }

  /**
   * Pack the data into a predefined structure i can pass down to the
   * shader to render
   */
  packData() {
    // TODO: need to decide on information format...
    // buffer like I use with lights?
    // position => center
    // scale => ~ radius...
    // shouldDraw => pack nothing and report this
    // would be nice to still have parent relations but that highly
    //    relies on the parent transformation matrix which applies to
    //    vertices which we don't have anymore... will need to think abt that
  
  
  }

  loadBuffers() {
    // no buffers here
  }

  bindBuffers() {
    // no buffers here
  }

  cleanBuffers() {
    // no buffers here
  }

  setUniforms() {
    // no per object uniforms
  }

  draw() {
    // drawing op directly happens in the shader
  }

  // NOTE: otherwise we use setUpdateCB, updateWorldMatrix, update
  // the same as normal objects
}
