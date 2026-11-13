/**
 * @module objects/armature
 */

import { vec3 } from "../../util";
import { rgb } from "../../util/color";
import { generateCylinder, generateSphere } from "../primitives";
import SceneObject from "../SceneObject";
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
export default class Armature {
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
    this.rootJointId = 0;
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

  /**
   * Helper for setting the position & rotation of a joint
   * @param {number} jointId
   * @param {number[]} position
   * @param {number[]} rotation
   */
  setJointTransform(jointId, position, rotation) {
    const joint = this.getJoint(jointId);
    joint.position = position;
    joint.rotation = rotation;
  }

  /**
   * Generate a SceneObject representation of the armature so we can render that
   *
   * @param {Object} [options={}]
   * @param {boolean} [options.rayObject=false] If it should use ray objects which are inherently different than the other types
   * @param {number} [options.radius=0.1]
   * @param {number} [options.segments=16]
   * @param {number[]} [options.color=hsl(0, 0%, 0%)]
   * @param {number[]} [options.colorJoint=rgb(255, 255, 255)]
   * @param {string} [options.prefix=""]
   * @param {number} [options.rootJointId=this.rootJointId]
   * @returns
   */
  generateArmatureObject({
    rayObject = false,
    radius = 0.1,
    segments = 16,
    color = rgb(0, 0, 0),
    colorJoint = rgb(255, 255, 255),
    prefix = "armature",
    rootJointId = this.rootJointId,
  } = {}) {
    this.validate();
    console.log("rootLabel", prefix + "ROOT" + this.label);
    // the parent of all other objects
    const rootObject = _makeJoint(
      prefix + "ROOT" + this.label,
      2,
      0.001,
      color,
      rayObject,
    );
    const rootJoint = this.getJoint(rootJointId);

    if (!rootJoint) {
      throw new Error(`Root joint ${rootJointId} does not exist`);
    }

    const jointObjects = new Map();
    const boneObjects = new Map();

    const visitedJoints = new Set();
    const visitedBones = new Set();

    /**
     * build the sceneobject joint structure
     * @param {SceneObject} parent
     * @param {ArmatureJoint} joint
     */
    const _buildJoint = (parent, joint) => {
      if (visitedJoints.has(joint.id)) {
        return;
      }

      visitedJoints.add(joint.id);

      console.log("label joint ", joint.id, prefix + joint.label);

      const jointObj = _makeJoint(
        prefix + joint.label,
        segments,
        radius,
        colorJoint,
        rayObject,
      );

      jointObj.position = [...joint.restPosition];
      jointObj.rotation = [...joint.restRotation];

      parent.addChild(jointObj);
      jointObjects.set(joint.id, jointObjects);

      // visit the bones
      for (const boneId of joint.connectedBoneIds) {
        if (visitedBones.has(boneId)) {
          continue;
        }
        visitedBones.add(boneId);
        const bone = this.getBone(boneId);

        if (!bone) {
          throw new Error(
            `Joint ${joint.id} references missing bone ${boneId} :(`,
          );
        }

        // find the other end of the bone
        const endJointId =
          bone.headJointId == joint.id ? bone.tailJointId : bone.headJointId;

        const endJoint = this.getJoint(endJointId);

        if (!endJoint) {
          throw new Error(`Bone ${boneId} has a missing endpoint :(`);
        }

        const boneObj = _makeBone(
          prefix + bone.label,
          endJoint.restPosition,
          segments,
          radius,
          color,
          rayObject,
        );

        if (boneObj) {
          jointObj.addChild(boneObj);
          boneObjects.set(bone.id, boneObj);
        }

        // only if we havent seen it should we traverse to the next
        // joint at the end of the bone
        // this could end up wonky looking in a cycle im not sure
        if (!visitedJoints.has(endJoint.id)) {
          _buildJoint(jointObj, endJoint);
        }
      }
      return jointObj;
    };
    _buildJoint(rootObject, rootJoint);

    // attach these to the root to use them
    // in animation, ie attach update function to
    // rootObject that can look up joints needed and set
    // their information
    rootObject.joints = jointObjects;
    rootObject.boned = boneObjects;
    rootObject.setUpdateCB(this._rootObjectUpdater(this, jointObjects));

    return rootObject;
  }

  _rootObjectUpdater(armature, jointObjects) {
    return function (dt) {
      // console.log(this)
      for (const [jointId, jointObj] of jointObjects) {
        const joint = armature.getJoint(jointId);

        if (jointId !== 1) {
          continue;
        }

        // console.log("JOINT:", jointId, joint.rotation);
        jointObj.position = [...joint.position];
        // console.log(jointObj.label, jointObj.rotation);
        jointObj.rotation = [...joint.rotation];
      }
    };
  }
}

/**
 * make a joint scene object
 *
 * @param {string} label
 * @param {number} segments
 * @param {number} radius
 * @param {*} color
 * @param {boolean} [rayObject=false]
 * @returns {SceneObject}
 */
function _makeJoint(label, segments, radius, color, rayObject = false) {
  const sphere = generateSphere(segments, radius);
  sphere.generateColors(color);
  return sphere.toSceneObject(label);
}

/**
 * make a bone scene object
 *
 * @param {string} label
 * @param {number[]} offset
 * @param {number} segments
 * @param {number} radius
 * @param {number[]} color
 * @param {boolean} [rayObject=false]
 */
function _makeBone(label, offset, segments, radius, color, rayObject = false) {
  const [x, y, z] = offset;
  const len = Math.hypot(x, y, z);

  if (len == 0) {
    // oops all joint
    return undefined;
  }

  const bonePrim = generateCylinder(segments, radius, len, {
    z_c: len / 2,
    bulge: 0.75,
    segments_h: 8,
  });
  bonePrim.generateColors(color);
  const bone = bonePrim.toSceneObject(label);

  // this should be just like the bvh loader rotation
  // but im not sure
  const rotationX = -Math.atan2(y, Math.hypot(x, z));
  const rotationY = Math.atan2(x, z);
  bone.rotation = [rotationX, rotationY, 0];

  return bone;
}
