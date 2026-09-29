import ShaderProgram from "../ShaderProgram";
import { vec4distance, scaleVec4, sumVec4 } from "../vec4";
import SceneObject from "./SceneObject";

export default class PhysicsObject extends SceneObject {
  /**
   *
   * @param {*} label
   * @param {*} vertices
   * @param {*} colors
   * @param {*} indices
   * @param {*} parent
   * @param {*} position
   * @param {*} rotation
   * @param {*} velocity
   * @param {*} rotVelocity
   * @param {*} gravity
   * @param {*} hitboxRadius
   * @param {*} collidable
   * @param {*} onCollision
   */
  constructor(
    label,
    vertices,
    colors,
    indices,
    parent = undefined,
    position,
    rotation,
    velocity = [0, 0, 0, 0],
    rotVelocity = [0, 0, 0, 0],
    gravity = 9.81,
    hitboxRadius = 0,
    collidable = true,
    onCollision = undefined,
  ) {
    super(label, vertices, colors, indices, parent);

    this.velocity = velocity;
    this.rotVelocity = rotVelocity;
    this.gravity = gravity;

    this.position = position;
    this.rotation = rotation;

    this.hitboxRadius = hitboxRadius;
    this.collidable = collidable;
    this.onCollision = onCollision;
    // TODO: calculate center of mass?
  }

  update(dt, scene) {
    // console.log("updating physics object: ", this.label, this.position, dt)
    super.update(dt, scene);

    // update the position & rotation & apply gravity
    this.position = sumVec4(this.position, scaleVec4(this.velocity, dt));
    this.rotation = sumVec4(this.rotation, scaleVec4(this.rotVelocity, dt));
    this.velocity[1] -= this.gravity * dt;

    // collisions, only do if collidable and has an oncollision
    // NOTE: for now we do big dummy collision with hitbox spheres at the positions
    //       of the objects, which we assume will be at the center of the object
    if (this.collidable && !!this.onCollision) {
      // NOTE: if we collide we should tell the other
      // object about it so it doesnt have to redo calculation
      // NOTE: in a thoughtful simulator we would not do collisions
      // per object, but once per scene so things dont need to
      // be recalculated... but I'm being lazy rn.
      for (const [_, testobj] of scene.objects) {
        // if not physics object or not collidable physics
        if (!testobj.collidable || testobj.label == this.label) {
          continue;
        }

        // if the hitboxRadiuses are close enough
        if (
          vec4distance(testobj.position, this.position) <
          this.hitboxRadius + testobj.hitboxRadius
        ) {
          this.onCollision(this, testobj);
        }
      }
    }
  }

  /**
   * Draw a physics object onto the canvas
   * additionally binds position and rotation matrices
   *
   * @param {*} gl the webgl2 context from canvas
   */
  draw(gl) {
    super.draw(gl);
  }
}
