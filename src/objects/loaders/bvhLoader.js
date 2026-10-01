/**
 * Simple bvh loader
 * information on the format: https://research.cs.wisc.edu/graphics/Courses/cs-838-1999/Jeff/BVH.html
 *
 * - bvh rotation s in Z, X, Y order
 *      A straightforward way to create the rotation matrix is
 *      to create 3 separate rotation matrices, one for each axis
 *      of rotation. Then concatenate the matrices from left to
 *      right Y, X and Z.
 *
 *      vR = vYXZ
 *
 *      (these operations should probably be applied to the primitive itself for the initial positions...
 *       )
 *
 * - offset
 *      Adding the offset information is simple, just poke the X,Y
 *      and Z translation data into into the proper locations of
 *      the matrix. Once the local transformation is created then
 *      concatenate it with the local transformation of its parent,
 *      then its grand parent, and so on.
 *
 *      vM = vMchildMparentMgrandparent
 *
 *      (this is handled by the hierarchical model setup already we just need to set the offset per child)
 */

import { makeSceneObjectGenerator, rgba } from "../helpers";
import { generateCylinder } from "../primitives";
import SceneObject from "../SceneObject";

// TODO probably do something more reasonable than this
const LOADED_BVH = {};

const toNum = (x) => parseFloat(x);

/**
 * Representation of a joint/root node
 *
 *
 * EXAMPLE:
 *
 * HIERARCHY
 * ROOT joint_Root
 * {
 * OFFSET 0 0 0
 * CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
 * JOINT Hips
 * {
 *     OFFSET -11.2566 91.3362 32.6117
 *     CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
 *     JOINT Spine
 *
 * for the root component
 * root = new Joint("joint_Root", [0, 0, 0], [Xposition, Yposition, Zposition, Zrotation, Xrotation, Yrotation], true)
 * hips = Joint("Hips", [-11.2566, 91.3362, 32.6117], [Xposition, Yposition, Zposition, Zrotation, Xrotation, Yrotation])
 * root.addChild(hips)
 */
class Joint {
  constructor(label, offset, channels, root = false) {
    this.label = label;
    this.offset = offset;
    this.channels = channels;
    this.children = [];
  }

  /**
   * Add a child joint to the joint
   * @param {Joint} child
   */
  addChild(child) {
    this.children.push(child);
  }
}

/**
 * Parse a bvh file into more understandable format for later
 *
 * @param {*} url
 * @param {*} id
 */
export async function cacheBVH(url, id) {
  const response = await fetch(url);
  const text = await response.text();

  const joints = [];
  const frames = [];

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // TODO actul parsing
  }

  LOADED_BVH[id] = { joints, frames };
}

/**
 * Construct bones from joint positions and update function
 * from the frames
 *
 */
function bvhToSkeletonObject(joints, frames) {
  // this will be empty with no verts since its a 'joint'
  // unless I want to render them as spheres...
  const root = new SceneObject();

  makeBones(root, joints[i]);

  root.setUpdateCB(generateUpdateBVH(joints, frames));
}

function makeBones(
  prevJoint,
  currJoint,
  thickness = 0.1,
  segments = 16,
  color = rgba(255, 255, 255, 1),
  prefix = "",
) {
  // make new cylinder from prev joint to current joint position
  const dist = Math.hypot(
    currJoint.offset[0] - prevJoint.offset[0],
    currJoint.offset[1] - prevJoint.offset[1],
    currJoint.offset[2] - prevJoint.offset[2],
  );

  // hmm might need to make joints like the root joint thats empty
  const bonePrim = generateCylinder(
    segments,
    thickness,
    dist,
    0,
    0,
    dist / 2,
    0,
    true,
    2,
  );
  // TODO rotate prim to the right direction
  const bone = new SceneObject(prefix + "_" + currJoint.label);

  for (let i = 0; i < currJoint.children.length; i++) {
    let childObj = makeBones(currJoint, currJoint.children[i]);
    bone.addChild(childObj);
  }
}

/**
 * Apply a frame to a single child
 * this will be some soft of spline from the previous frame to the current
 * frame based on the time. probably linear is easiest
 *
 * @param {SceneObject} child
 * @param {*} time          the current time in the animation
 * @param {*} framesPrevStart    the time the prev frame started
 * @param {*} framesNextStart    the time the next frame starts
 * @param {*} framesPrev    the parameters for the prev frame
 * @param {*} framesNext    the parameters for the next frame
 */
function applyChildFrame(
  child,
  time,
  framePrevStart,
  frameNextStart,
  framesPrev,
  framesNext,
) {}

/**
 * Update function to play the animation
 */
function generateUpdateBVH(joints, frames) {
  function updateBVH(dt, scene) {
    // TODO use frames to update object
  }

  return updateBVH;
}

export function loadBVH(id) {
  return bvhToSkeletonObject(...LOADED_BVH[id]);
}
