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
 *      !!! this is a lie, turns out bvh files can use any rotation order
 *      and each joint can even use its own rotation order..........
 *      offset seems to be standard xyz but I dont trust that any more
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

import { rgba } from "../helpers";
import {
  generateCylinder,
  generateFillerColors,
  generateSphere,
} from "../primitives";
import SceneObject from "../SceneObject";
import Scene from "../../Scene";
import BVHObject, { BVHObjectRoot } from "./BVHObject";

// TODO probably do something more reasonable than this
const LOADED_BVH = {};

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

  const loadedBVH = parseBVH(text);

  console.log(loadedBVH);

  LOADED_BVH[id] = loadedBVH;
}

/**
 * Parse the BVH structure from text
 * - load joint structure
 * - give list of joint names in order for animation
 * - return animation frame information
 *
 * @param {*} text text to parse
 * @returns
 */
function parseBVH(text) {
  // todo track joint objs so can reference while animating
  const jointList = [];
  const frames = [];

  const tokens = text.match(/[{}]|[^\s{}]+/g);

  let motionInfo = {};
  let totalChannels = 0;
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

  /**
   * Parse a joint and its children recursively from tokens
   *
   * ROOT joint_Root
   * {
   * OFFSET 0 0 0
   * CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation
   * JOINT Hips
   * {...}
   * ...
   * }
   *
   * @returns
   */
  function parseJoint() {
    const type = nextToken();
    const label = nextToken();

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
    jointList.push(joint);
    totalChannels += joint.channels.length;

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
        const offset = parseVector();
        nextExpect("}");

        joint.addChild(new Joint(label + "end", offset, [], false, true));
      }
    }

    nextExpect("}");
    return joint;
  }

  function parseNamedNumber() {
    let numLabel = "";
    while (!numLabel.endsWith(":")) {
      numLabel += nextToken();
    }
    const value = nextNumber();
    return { [numLabel.replace(":", "").replaceAll(" ", "")]: value };
  }

  /**
   * Parse the motion (animation frame) section of the bvh file
   */
  function parseMotion() {
    nextExpect("MOTION");
    motionInfo = {
      ...parseNamedNumber(),
      ...parseNamedNumber(),
    };
    for (let j = 0; j < motionInfo.Frames; j++) {
      frames.push([...new Array(totalChannels)].map((_) => nextNumber()));
    }
  }

  nextExpect("HIERARCHY");
  const rootJoint = parseJoint();
  parseMotion();

  return { rootJoint, jointList, frames, motionInfo };
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
function makeJoint(label, segments, thickness, color, root = false) {
  const spherePrim = generateSphere(segments, 1.5 * thickness);
  const colors = generateFillerColors(
    spherePrim.vertexCount,
    rgba(255, 255, 255, 1),
  );

  if (root) {
    return new BVHObjectRoot(
      label,
      new Float32Array(spherePrim.vertices),
      new Float32Array(colors),
      new Uint16Array(spherePrim.indices),
    );
  }

  return new BVHObject(
    label,
    new Float32Array(spherePrim.vertices),
    new Float32Array(colors),
    new Uint16Array(spherePrim.indices),
  );
}

/**
 * Construct bones from joint positions and update function
 * from the frames
 *
 * NOTE: joint names probably changes at somepoint
 *
 * @param {Joint} rootJoint     the root of the joint structure
 * @param {*} jointList    list of sequential joint names
 * @param {*} frames    the animation frames
 * @param {*} motionInfo  animation metadata
 * @param {number} thickness    the radius of object geometry
 * @param {number} segments the number of segments to use in object geometry
 * @param {rgba()} color    the color of all created objects
 * @param {string} prefix   the prefix to attach to all object labels
 * @returns
 */
function bvhToSkeletonObject(
  rootJoint,
  jointList,
  frames,
  motionInfo,
  thickness = 0.1,
  segments = 16,
  color = rgba(255, 255, 255, 1),
  prefix = "",
) {
  // this will be empty with no verts since its a 'joint'
  // unless I want to render them as spheres...
  const root = makeJoint(prefix + "ROOT", segments, thickness, color, true);

  makeBones(root, rootJoint, thickness, segments, color, prefix);

  const jointListCopy = jointList.map((joint) => {
    const j = structuredClone(joint);
    j.label = prefix + j.label;
    return j;
  });
  root.jointList = jointListCopy;
  root.frames = frames;
  root.animationPlay = true;
  root.motionInfo = motionInfo;

  root.setUpdateCB(updateBVH);

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
  const jointObj = makeJoint(
    prefix + currJoint.label,
    segments,
    thickness,
    color,
  );
  jointObj.position = [...currJoint.offset];
  parent.addChild(jointObj);

  for (let i = 0; i < currJoint.children.length; i++) {
    const childJoint = currJoint.children[i];
    const [x, y, z] = childJoint.offset;

    // make new cylinder from prev joint to current joint position
    // relative coords now so we dont need to use diffs
    const dist = Math.hypot(x, y, z);

    if (dist == 0) {
      makeBones(jointObj, childJoint, thickness, segments, color, prefix);
      continue;
    }

    // hmm might need to make joints like the root joint thats empty
    const bonePrim = generateCylinder(
      segments,
      thickness,
      dist,
      0,
      0,
      dist / 2,
      0.75,
      true,
      8,
    );
    const colors = generateFillerColors(bonePrim.vertexCount, color, true);
    const bone = new SceneObject(
      prefix + currJoint.label + "-" + childJoint.label,
      new Float32Array(bonePrim.vertices),
      new Float32Array(colors),
      new Uint16Array(bonePrim.indices),
    );

    const rotationX = -Math.atan2(y, Math.hypot(x, z));
    const rotationY = Math.atan2(x, z);
    bone.rotation = [rotationX, rotationY, 0];

    jointObj.addChild(bone);
    // might need a safty check, not sure if every joint is garunteed to have rotation channels
    jointObj.bvhRotationOrder = currJoint.channels
      .filter((e) => e.endsWith("rotation"))
      .map((e) => e.replace("rotation", ""));

    makeBones(jointObj, childJoint, thickness, segments, color, prefix);
  }

  return jointObj;
}

////////////////////////
// ANIMATION CREATION //
////////////////////////

/**
 * Interpolate positions between two frames
 *
 * @param {*} positions
 * @param {*} ratio
 * @returns
 */
function interpolatePosition(positions, ratio) {
  return (1 - ratio) * positions[0] + ratio * positions[1];
}

/**
 * Interpolate angles (bvh degrees) between two frames
 *
 * @param {*} positions
 * @param {*} ratio
 * @returns
 */
function interpolateAngles(angles, ratio) {
  const diff = angles[1] - angles[0];
  const delta = ((diff + 540) % 360) - 180;

  return (angles[0] + ratio * delta + 360) % 360;
}

/**
 * Apply a frame to a single child
 * this will be some soft of spline from the previous frame to the current
 * frame based on the time. probably linear is easiest
 *
 * TODO actually do interpolatio
 *
 * @param {Joint} child   the child joint to animate
 * @param {Scene} scene   the animation scene
 * @param {number} frameRatio  the ratio between frames
 * @param {*} prevFrame   the previous frame location
 * @param {*} nextFrame   the next frame locations
 * @param {*} interpolate if frames should be interpolated
 */
function applyChildFrame(
  child,
  scene,
  frameRatio,
  prevFrame,
  nextFrame,
  interpolate,
) {
  const channels = {};
  for (let i = 0; i < child.channels.length; i++) {
    channels[child.channels[i]] = [prevFrame[i], nextFrame[i]];
  }

  let x,
    y,
    z = 0;

  if (interpolate) {
    x = (interpolateAngles(channels["Xrotation"], frameRatio) * Math.PI) / 180;
    y = (interpolateAngles(channels["Yrotation"], frameRatio) * Math.PI) / 180;
    z = (interpolateAngles(channels["Zrotation"], frameRatio) * Math.PI) / 180;
  } else {
    x = (channels["Xrotation"][0] * Math.PI) / 180;
    y = (channels["Yrotation"][0] * Math.PI) / 180;
    z = (channels["Zrotation"][0] * Math.PI) / 180;
  }

  const rotation = [x, y, z];

  const childObj = scene.getObject(child.label);
  childObj.rotation = rotation;
  if ((child.channels.length > 3) & child.root) {
    if (interpolate) {
      childObj.position = [
        interpolatePosition(channels["Xposition"], frameRatio),
        interpolatePosition(channels["Yposition"], frameRatio),
        interpolatePosition(channels["Zposition"], frameRatio),
      ];
    } else {
      childObj.position = [
        channels["Xposition"][0],
        channels["Yposition"][0],
        channels["Zposition"][0],
      ];
    }
  }
}

/**
 * Update function to play the animation
 *
 * could probably precompute a lot of things here, but seems fast enough already
 */
function updateBVH(dt, scene) {
  if (!this.animationPlay) {
    return;
  }

  this.animationTime += dt * this.animationSpeed;

  // calculate the prev, next frames and the ratio between them for interpolation
  const loopedTime =
    this.animationTime % (this.motionInfo.Frames * this.motionInfo.FrameTime);
  const prevFrameIdx = Math.floor(loopedTime / this.motionInfo.FrameTime);
  const nextFrameIdx = (prevFrameIdx + 1) % this.motionInfo.Frames;
  const frameRatio =
    (loopedTime % this.motionInfo.FrameTime) / this.motionInfo.FrameTime;

  let offset = 0;
  for (const joint of this.jointList) {
    // grab only the frame parts needed in the joint update
    // could probably pass offset & the whole array to save on compute ig
    const prevFrame = this.frames[prevFrameIdx].slice(
      offset,
      offset + joint.channels.length,
    );
    const nextFrame = this.frames[nextFrameIdx].slice(
      offset,
      offset + joint.channels.length,
    );
    offset += joint.channels.length;
    applyChildFrame(
      joint,
      scene,
      frameRatio,
      prevFrame,
      nextFrame,
      this.animationInterpolate,
    );
  }
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
    LOADED_BVH[id].rootJoint,
    LOADED_BVH[id].jointList,
    LOADED_BVH[id].frames,
    LOADED_BVH[id].motionInfo,
    thickness,
    segments,
    color,
    prefix,
  );
}

/**
 * Add a bvh object to a scene, this is more complicated than normal because
 * we created all those bones in here without adding them to the scene
 * @param {Scene} scene
 * @param {SceneObject} bvhObject
 * @param {string} shader
 */
export function sceneAddBVH(scene, bvhObject, shader, root = true) {
  scene.addObject(bvhObject, shader, !root);
  for (const child of bvhObject.children) {
    sceneAddBVH(scene, child, shader, false);
  }
}

/**
 * Hide the "tail" that these bandai namco bvh files have
 * @param {*} bvhObject
 * @returns
 */
export function bandaiNamcoHideTail(bvhObject) {
  const tail = bvhObject.children[0].children[0];
  tail.shouldDraw = false;
  return bvhObject;
}
