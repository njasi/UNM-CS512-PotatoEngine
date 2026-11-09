/**
 * @module objects/PhysicsObject
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
 * @alias module:objects/PhysicsObject
 */
export default class PhysicsObject extends SceneObject {
  /**
   * Make a new PhysicsObject, a scene object with simple physics builtin
   * @param {string} label
   * @param {*} options
   * @param {Float32Array} options.vertices
   * @param {Float32Array} options.colors
   * @param {Int16Array} options.indices
   * @param {Float32Array} options.normals
   * @param {SceneObject} options.parent            the parent of this object (can be set through addChild instead)
   * @param {number[]} options.position             initial three tuple [x,y,z] position of the object
   * @param {number[]} options.rotation             initial three tuple [x,y,z] rotation of the object
   * @param {number[]} options.scale                initial three tuple [x,y,z] scale of the object
   * @param {boolean} options.shouldDraw            if this object should be drawn
   * @param {string} options.programLabel           the program to draw this object with
   * @param {string} options.materialLabel          the material to use with this object
   * @param {number} options.velocity
   * @param {number} options.rotVelocity
   * @param {number} options.gravity                gravity acceleration to apply to the object
   * @param {number} options.hitboxRadius           the radius of this objects hitbox
   * @param {boolean} options.collidable            if this object is collidable or not
   * @param {function} options.onCollision          Callback function to call when this object collides with another collidable
   */
  constructor(
    label,
    {
      // basic scene object options
      vertices = undefined,
      colors = undefined,
      indices = undefined,
      normals = undefined,
      parent = undefined,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = [1, 1, 1],
      shouldDraw = true,
      programLabel = undefined,
      materialLabel = undefined,
      tangents = undefined,
      texCoords = undefined,
      // physics object options
      velocity = [0, 0, 0, 0],
      rotVelocity = [0, 0, 0, 0],
      gravity = 9.81,
      hitboxRadius = 0,
      collidable = true,
      onCollision = undefined,
    } = {},
  ) {
    super(label, vertices, colors, indices, normals, {
      parent,
      position,
      rotation,
      scale,
      shouldDraw,
      programLabel,
      materialLabel,
      tangents,
      texCoords,
    });

    this.velocity = velocity;
    this.rotVelocity = rotVelocity;
    this.gravity = gravity;

    this.position = position;
    this.rotation = rotation;

    this.hitboxRadius = hitboxRadius;
    this.collidable = collidable;
    this.onCollision = onCollision;
    // TODO: calculate center of mass?
  }

  /**
   * Update the object based on time change and
   * the updateCB function if set
   *
   * additionally apply the physics based updates
   * - gravity, pos & rot velocity
   * - detect collisions in the scene
   * @param {number} dt change in time in s
   * @param {Scene} scene the scene prompting the update
   */
  update(dt, scene) {
    // update the position & rotation & apply gravity
    this.position = sumVec4(this.position, scaleVec4(this.velocity, dt));
    this.rotation = sumVec4(this.rotation, scaleVec4(this.rotVelocity, dt));
    this.velocity[1] -= this.gravity * dt;

    // collisions, only do if collidable and has an oncollision
    // NOTE: for now we do big dummy collision with hitbox spheres at the positions
    //       of the objects, which we assume will be at the center of the object
    if (this.collidable && !!this.onCollision) {
      // NOTE: if we collide we should tell the other
      // object about it so it doesnt have to redo calculation
      // NOTE: in a thoughtful simulator we would not do collisions
      // per object, but once per scene so things dont need to
      // be recalculated... but I'm being lazy rn.
      for (const [_, testobj] of scene.objects) {
        // if not physics object or not collidable physics
        if (!testobj.collidable || testobj.label == this.label) {
          continue;
        }

        // if the hitboxRadiuses are close enough
        if (
          vec4distance(testobj.position, this.position) <
          this.hitboxRadius + testobj.hitboxRadius
        ) {
          this.onCollision(this, testobj);
        }
      }
    }

    //update at end so parent matricies are correct
    super.update(dt, scene);
  }
}
