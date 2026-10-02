import SceneObject from "../SceneObject";

import {
  mat4Identity,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Scale,
  mat4Translate,
} from "../../transformations";

const ROTMAP = {
  XYZ: 0,
  XZY: 1,
  YXZ: 2,
  YZX: 3,
  ZXY: 4,
  ZYX: 5,
};

/**
 * Wrapper class for bvh objects
 */
export default class BVHObject extends SceneObject {
  constructor() {
    super(...arguments);

    this.uBVHLoc;
    // bvh joints can all have unique rotation orders
    this.bvhRotationOrder = "ZXY";
  }

  /**
   * Set object specific uniforms.
   * In this case positon and rotation
   *
   * @param {Scene} scene the scene the object is in
   */
  setUniforms(scene) {
    super.setUniforms(scene);
    const shader = scene.getProgram(this.programLabel);

    this.uBVHLoc = scene.gl.getUniformLocation(shader.program, "uBVH");
  }

  /**
   * Update the transformation matrix that represents the world for children
   * components
   *
   * BVH objects use the ZXY order instead of our normal XYZ
   */
  updateWorldMatrix() {
    let M = this.parent ? this.parent.M : mat4Identity();

    const rotationFuncs = {
      "X": (M) => mat4RotateX(M, this.rotation[0]),
      "Y": (M) => mat4RotateY(M, this.rotation[1]),
      "Z": (M) => mat4RotateZ(M, this.rotation[2])
    }

    // apply transformss one by one to calc world
    // for the children of this component
    M = mat4Translate(M, this.position);
    for(const char of this.bvhRotationOrder){
      M = rotationFuncs[char](M)
    }
    M = mat4Scale(M, this.scale);

    this.M = M;
  }

  /**
   * Draw an object onto the canvas
   *
   * BVH object needs to flag that it uses bvh rotation
   * for the shader
   *
   * @param {*} gl the webgl2 context from canvas
   */
  draw(gl) {
    gl.uniform1i(this.uBVHLoc, ROTMAP[this.bvhRotationOrder]);
    super.draw(gl);
    gl.uniform1i(this.uBVHLoc, 0);
  }
}

/**
 * Wrapper class to track all the things we want to add to
 * the BVHObject in order to animate it
 */
export class BVHObjectRoot extends BVHObject {
  constructor() {
    super(...arguments);

    this.animationPlay = false;
    this.animationSpeed = 10;
    this.animationTime = 0;
    this.animationInterpolate = true;
    this.jointList = [];
    this.frames = [];
    this.motionInfo = {};
  }
}