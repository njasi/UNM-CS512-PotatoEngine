/**
 * @module objects/armature
 */

import { vec3 } from "../../util";
import { Armature } from "./Armature";

/**
 * Representation of a bone in armature model
 * @class
 * @alias ArmatureBone
 */
export default class ArmatureBone {
  /**
   * Make a new ArmatureBone
   * @param {string} label 
   * @param {*} options
   */
  constructor(label, { id, headJointId, tailJointId }) {
    if (headJointId === tailJointId) {
      throw new Error(`Bone "${label}" cannot connect a joint to itself`);
    }

    this.id = id;
    this.label = label;
    this.headJointId = headJointId;
    this.tailJointId = tailJointId;
  }

  /**
   * get the resting bone information
   * @param {Armature} armature
   * @returns {*}
   */
  getRest(armature) {
    const head = armature.getJoint(this.headJointId);
    const tail = armature.getJoint(this.tailJointId);

    if (!head || !tail) {
      throw new Error(
        `Bone ("${this.label}") points to a missing joint ${!head ? this.headJointId : this.tailJointId}`,
      );
    }

    return {
      head: head.restPosition,
      tail: tail.restPosition,
      length: vec3.distance(head.restPosition, tail.restPosition),
    };
  }
}
