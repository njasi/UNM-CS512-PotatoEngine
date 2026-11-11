/**
 * @module objects/armature
 */

import ArmatureBone from "./ArmatureBone";
import ArmatureJoint from "./ArmatureJoint";


/**
 * Representation of internal armature of a model
 * 
 * - bones, joints
 * - important to allow for joint cycles unlike the bvh tree,
 *   as something like a chest loop is common (consider mediapipe model)
 * - we can update the position of joints based on external update functions
 *   for example, after the bvh model has updated (which we already have)
 *   we can then use it to update the positions of all joints in the armature
 *   here. This shouldnt be notably expensive, and vaguely extensible
 *   to a different update function 
 * - should make a helper to turn bvh structure directly into an armature
 *   represenation and then map update function onto it...
 * 
 * @class
 */
export class Armature {
  /**
   * make a new armature structue
   * 
   * @param {string} label
   */
  constructor(label) {
    this.label = label;
    this.joints = [];
    this.bones = [];

    // tracking by id will be less of a headache than the lavels, 
    // but id still like to force labels since debugging is really 
    // easy with them lol
    this.jointsById = new Map();
    this.bonesById = new Map();
    this.nextJointId = 0;
    this.nextBoneId = 0;
  }

  /**
   * Add a new joint to the armature
   * @param {string} label
   * @param {Object} options
   * @param {number} [options.id=this.nextJointId++]
   * @param {number[]} options.restPosition
   */
  addJoint(label, { id = this.nextJointId++, restPosition }) {
    if (this.jointsById.has(id)) {
      throw new Error(`Joint ID ${id} already exists.`);
    }

    const joint = new ArmatureJoint(label, { id, restPosition });
    this.joints.push(joint);
    this.jointsById.set(id, joint);
    return joint;
  }

  /**
   * add a new bone to the armature
   * @param {string} label
   * @param {Object} options
   * @param {number} [options.id=this.nextBoneId++]
   * @param {number} options.headJointId
   * @param {number} options.tailJointId
   */
  addBone(label, { id = this.nextBoneId++, headJointId, tailJointId }) {
    if (this.bonesById.has(id)) {
      throw new Error(`Bone ${id} already exists`);
    }

    const head = this.getJoint(headJointId);
    const tail = this.getJoint(tailJointId);

    if (!head || !tail) {
      throw new Error(`Could not find the (head||tail) joint for ${label}`);
    }

    const bone = new ArmatureBone(label, {
      id,
      headJointId,
      tailJointId,
    });

    this.bones.push(bone);
    this.bonesById.set(id, bone);

    head.connectedBoneIds.add(id);
    tail.connectedBoneIds.add(id);

    return bone;
  }

  /**
   * get a joint by its id
   * @param {number} id
   * @returns {ArmatureJoint}
   */
  getJoint(id) {
    return this.jointsById.get(id);
  }

  /**
   * get a bone by its id
   * @param {number} id
   * @returns {ArmatureBone}
   */
  getBone(id) {
    return this.bonesById.get(id);
  }

  /**
   * validate the structure of the armature
   * - ie check that all bones have a joint that exists...
   * @returns {boolean}
   */
  validate() {
    for (const bone of this.bones) {
      if (
        !this.getJoint(bone.headJointId) ||
        !this.getJoint(bone.tailJointId)
      ) {
        throw new Error(`Bone "${bone.label}" has an invalid endpoint`);
      }
    }

    return true;
  }
}
