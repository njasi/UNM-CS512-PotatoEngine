import SceneObject from "../SceneObject";

/**
 * Wrapper class to track all the things we want to add to
 * the BVHObject in order to animate it
 */
export default class BVHObject extends SceneObject {
  constructor() {
    super(...arguments);

    this.animationPlay = false;
    this.animationTime = 0;
    this.jointList = [];
    this.frames = [];
    this.motionInfo = {};
  }
}
