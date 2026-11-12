/**
 * @module objects/armature
 */

import { vec3 } from "../../util";

/**
 * Representation of a joint in the armature structure
 *
 * @class
 */
export default class ArmatureJoint {
  /**
   * make a new AmatureJoint
   * @param {string} label
   * @param {Object} options
   * @param {number} options.id
   * @param {number[]} [options.restPosition=[0, 0, 0]] x, y, z tuple
   * @param {number[]} [options.restRotation=[0, 0, 0]] x, y, z tuple
   */
  constructor(
    label,
    { id, restPosition = [0, 0, 0], restRotation = [0, 0, 0] },
  ) {
    this.id = id;
    this.label = label;
    this.restPosition = vec3.copy(restPosition);
    // NOTE: rotated in x,y,z order, but we can change that if needed, my vert shaders can handle any rot order (see bvh implementation)
    this.restRotation = vec3.copy(restRotation);

    // current position and rotation, we just start them at rest
    this.position = vec3.copy(restPosition);
    this.rotation = vec3.copy(restRotation);

    // all bones touching this joint, note that this allows us
    // to have a gtaph instead of a tree.
    this.connectedBoneIds = new Set();
  }

  /**
   * Reset a joint's position/rotation to its resting spot
   */
  restJoint() {
    this.position = vec3.copy(this.restPosition);
    this.rotation = vec3.copy(this.restRotation);
  }
}
