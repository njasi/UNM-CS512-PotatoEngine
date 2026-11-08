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
   * @param {number[]} [options.restPosition=[0, 0, 0]]
   */
  constructor(label, { id, restPosition = [0, 0, 0] }) {
    this.id = id;
    this.label = label;
    this.restPosition = vec3.copy(restPosition);

    // all bones touching this joint, note that this allows us
    // to have a gtaph instead of a tree.
    this.connectedBoneIds = new Set();
  }
}
