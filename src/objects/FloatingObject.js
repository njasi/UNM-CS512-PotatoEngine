import PhysicsObject from "./PhysicsObject";

/**
 * Literally just a object floating on water, that behaves just like physics object
 * Might just combine being "floaty" on the normal physics object later
 *
 * Floating calculations are very lazy but good enough for now.
 */
export default class FloatingObject extends PhysicsObject {
  /**
   * Create a floating physics object@param {string} label
   * @param {Float32Array} vertices
   * @param {Float32Array} colors
   * @param {Int16Array} indices
   * @param {Float32Array} normals
   * @param {*} options
   * @param {SceneObject} options.parent            the parent of this object (can be set through addChild instead)
   * @param {*} options.position                    initial position of the object
   * @param {*} options.rotation                    initial rotation of the object
   * @param {*} options.scale                       initial scale of the object
   * @param {boolean} options.shouldDraw            if this object should be drawn
   * @param {string} options.programLabel           the program to draw this object with
   * @param {string} options.materialLabel          the material to use with this object
   * @param {*} options.velocity
   * @param {*} options.rotVelocity
   * @param {number} options.gravity                gravity acceleration to apply to the object
   * @param {number} options.hitboxRadius           the radius of this objects hitbox
   * @param {boolean} options.collidable            if this object is collidable or not
   * @param {function} options.onCollision          Callback function to call when this object collides with another collidable
   * @param {Number} buoyancy                       m/s^2 acceleration we should get up if below water
   * @param {Number} waterFriction                  percent of x,z speed kept if in water (0-1)
   * @param {Function} waterFunction                function given position & time return water y-level
   */
  constructor(
    label,
    vertices,
    colors,
    indices,
    normals,
    {
      // basic scene object options
      parent = undefined,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = [1, 1, 1],
      shouldDraw = true,
      programLabel = undefined,
      materialLabel = undefined,
      // physics object options
      velocity = [0, 0, 0, 0],
      rotVelocity = [0, 0, 0, 0],
      gravity = 9.81,
      hitboxRadius = 0,
      collidable = true,
      onCollision = undefined,
      // floating object options
      buoyancy = 15,
      waterFriction = 0.99,
      waterFunction = undefined,
    },
  ) {
    super(label, vertices, colors, indices, normals, {
      parent,
      position,
      rotation,
      scale,
      shouldDraw,
      programLabel,
      materialLabel,
      velocity,
      rotVelocity,
      gravity,
      hitboxRadius,
      collidable,
      onCollision,
    });

    // function to get the height of water given a position
    this.waterFunction = waterFunction;
    this.buoyancy = buoyancy;
    this.waterFriction = waterFriction;

    this.snappedToWater = false;
  }

  /**
   * Update the object based on time change and
   * the updateCB function if set
   *
   * additionally apply the PhysicsObject based updates
   * - gravity, pos & rot velocity
   * - detect collisions in the scene
   * 
   * finally apply FloatingObject updates:
   * - check water level
   * - float up 
   * - decelerate in water
   * - snap to water if speed low & close to surface
   * 
   * @param {*} dt
   * @param {*} scene
   */
  update(dt, scene) {
    // physics object does an update of the position according to velocity
    // so maybe we jst update the velocity for next tick if we find we are below
    // the water at the calculated point
    super.update(dt, scene);

    // return height of water at given point & time (s)
    const waterY = this.waterFunction(this.position, scene.time / 1000);

    // if close enough to water surface
    // & slow enough, zero out gravity and set snappedToWater=true
    if (
      Math.abs(this.velocity[1]) < 0.01 &&
      Math.abs(waterY - this.position[1]) < 0.01
    ) {
      this.snappedToWater = true;
      this.gravity = 0;
    }

    if (this.snappedToWater) {
      this.position[1] = waterY;
    } else {
      // assume we float up to the center position for now
      if (this.position[1] < waterY) {
        this.velocity[1] += this.buoyancy * dt;
      }
    }

    // if snapped to or below or touching water,
    // apply water "friction" for x,z velocity
    if (
      this.snappedToWater ||
      this.position[1] < waterY ||
      this.position[1] - waterY < this.hitboxRadius
    ) {
      // again another big simplification but should look meh
      const damper = Math.pow(this.waterFriction, (dt * 1000) / 30);
      this.velocity[0] *= damper;
      this.velocity[1] *= damper;
      this.velocity[2] *= damper;
      this.rotVelocity[0] *= damper;
      this.rotVelocity[1] *= damper;
      this.rotVelocity[2] *= damper;
    }
  }
}
