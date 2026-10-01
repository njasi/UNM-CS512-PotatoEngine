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

import {
  generateSphereObject,
  makeSceneObjectGenerator,
  rgba,
} from "../helpers";
import { generateCylinder, generateFillerColors } from "../primitives";
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
  constructor(label, offset, channels, root = false, end = false) {
    this.label = label;
    this.offset = offset;
    this.channels = channels;
    this.children = [];
    this.root = root;
    this.end = end;
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

  const { joints, frames } = parseBVH(text);

  LOADED_BVH[id] = { joints, frames };
}

function parseBVH(text) {
  // todo track joint obj names so can reference while animating
  const joints = [];
  const frames = [];

  const tokens = text.match(/[{}]|[^\s{}]+/g);
  console.log(tokens);

  let i = 0;

  /**
   * Get the next token in the list
   * @returns
   */
  function nextToken() {
    i++;
    return tokens[i - 1];
  }

  /**
   * Get the next token in list and parse it into a number
   * @returns Number
   */
  function nextNumber() {
    const value = Number(nextToken());
    return value;
  }

  /**
   * Check if the next value is an expected valkue
   * @param {string} expected
   */
  function nextExpect(expected) {
    const value = nextToken();
    if (value != expected) {
      throw new Error(`expected ${expected} got ${value}`);
    }
  }

  /**
   * Parse a vec of numbers from the token stream
   * @returns [x, y, z]
   */
  function parseVector() {
    return [nextNumber(), nextNumber(), nextNumber()];
  }

  function parseJoint() {
    const type = nextToken();
    const label = nextToken();

    console.log(type,label)

    nextExpect("{");
    nextExpect("OFFSET");
    const offset = parseVector();

    nextExpect("CHANNELS");
    const channelCount = nextNumber();

    const channels = [];
    for (let i = 0; i < channelCount; i++) {
      channels.push(nextToken());
    }

    const joint = new Joint(label, offset, channels, type == "ROOT");

    while (tokens[i] !== "}") {
      if (tokens[i] == "JOINT") {
        // children parsing
        joint.addChild(parseJoint());
        continue;
      }

      if (tokens[i] == "End") {
        // at an endpoinit
        nextToken();
        nextExpect("Site");
        nextExpect("{");
        nextExpect("OFFSET");
        const offset = parseVector()
        nextExpect("}")

        joint.addChild(new Joint(label + "end", offset, [], false, true));
      }
    }
    
    nextExpect("}")
    return joint
  }


  function parseMotion(){
    nextExpect("MOTION")
    // TODO lots of numbers lol
  }

  nextExpect("HIERARCHY")
  console.log(parseJoint())
}

///////////////////////////////////
// SKELETON SCENEOBJECT CREATION //
///////////////////////////////////

/**
 * Make a joint placeholder bones connect from joint to joint
 * i think we will rotate a joint to apply the animation later
 * not the bone? unsure...
 *
 * TODO could make these balls so theyre visible...
 * @param {string} label
 * @returns
 */
function makeJoint(label, segments, thickness, color) {
  return generateSphereObject(label, color, segments, thickness);
}

/**
 * Construct bones from joint positions and update function
 * from the frames
 *
 * @param {*} joints    the joint list & structure
 * @param {*} frames    the animation frames
 * @param {number} thickness    the radius of object geometry
 * @param {number} segments the number of segments to use in object geometry
 * @param {rgba()} color    the color of all created objects
 * @param {string} prefix   the prefix to attach to all object labels
 * @returns
 */
function bvhToSkeletonObject(
  joints,
  frames,
  thickness = 0.1,
  segments = 16,
  color = rgba(255, 255, 255, 1),
  prefix = "",
) {
  // this will be empty with no verts since its a 'joint'
  // unless I want to render them as spheres...
  const root = makeJoint("ROOT");

  makeBones(root, joints[i]);

  root.setUpdateCB(generateUpdateBVH(joints, frames));

  return root;
}

/**
 * Make the skeleton structure described in the bvh file
 *
 * - joints are spheres
 *      - rotate move these to produce the animation later
 * - bones are cylinders that go from joint to joint
 *      - dont think we need to touch these after creating
 *
 * @param {SceneObject} parent  the previous parent object
 * @param {Joint} currJoint current joint we are parsing
 * @param {number} thickness    the radius of object geometry
 * @param {number} segments the number of segments to use in object geometry
 * @param {rgba()} color    the color of all created objects
 * @param {string} prefix   the prefix to attach to all object labels
 */
function makeBones(
  parent,
  currJoint,
  thickness = 0.1,
  segments = 16,
  color = rgba(255, 255, 255, 1),
  prefix = "",
) {
  const jointObj = makeJoint(prefix + currJoint.label);
  jointObj.position = [...currJoint.offset];
  parent.addChild(jointObj);

  for (let i = 0; i < currJoint.children.length; i++) {
    const childJoint = currJoint.children[i];
    const [x, y, z] = childJoint.offset;

    // make new cylinder from prev joint to current joint position
    // relative coords now so we dont need to use diffs
    const dist = Math.hypot(x, y, z);

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
    const colors = generateFillerColors(bonePrim.vertexCount, color, true);
    const bone = new SceneObject(
      prefix + currJoint.label + "-" + childJoint.label,
      bonePrim.vertices,
      colors,
      bonePrim.indices,
    );

    // TODO: calculate the rotation from the x,y,z values
    bone.rotation = [0, 0, 0];

    jointObj.addChild(bone);

    makeBones(jointObj, childJoint, thickness, segments, color, prefix);
  }

  return jointObj;
}

////////////////////////
// ANIMATION CREATION //
////////////////////////

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

/**
 * Load a BVH file into a SceneObject.
 * @param {*} id the id of the cached & parsed bvh file to load
 * @param {number} thickness    the radius of object geometry
 * @param {number} segments the number of segments to use in object geometry
 * @param {rgba()} color    the color of all created objects
 * @param {string} prefix   the prefix to attach to all object labels
 * @returns
 */
export function loadBVH(
  id,
  thickness = 0.1,
  segments = 16,
  color = rgba(255, 255, 255, 1),
  prefix = "",
) {
  return bvhToSkeletonObject(
    LOADED_BVH[id].joints,
    LOADED_BVH[id].frames,
    thickness,
    segments,
    color,
    prefix,
  );
}
