import PhysicsObject from "./PhysicsObject";

/**
 * Literally just a object floating on water, that behaves just like physics object
 * Might just combine being "floaty" on the normal physics object later
 *
 * Floating calculations are very lazy but good enough for now.
 */
export default class FloatingObject extends PhysicsObject {
  /**
   * Create a floating physics object
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
   * @param {Number} buoyancy m/s^2 acceleration we should get up if below water
   * @param {Number} waterFriction percent of x,z speed kept if in water (0-1)
   * @param {Function} waterFunction function given position & time return water y-level
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
    buoyancy = 15,
    waterFriction = 0.99,
    waterFunction = undefined,
  ) {
    super(
    label,
    vertices,
    colors,
    indices,
    parent,
    position,
    rotation,
    velocity,
    rotVelocity,
    gravity,
    hitboxRadius,
    collidable,
    onCollision,
    );

    // function to get the height of water given a position
    this.waterFunction = waterFunction;
    this.buoyancy = buoyancy;
    this.waterFriction = waterFriction;

    this.snappedToWater = false;
  }

  update(dt, scene) {
    // physics object does an update of the position according to velocity
    // so maybe we jst update the velocity for next tick if we find we are below
    // the water at the calculated point
    super.update(dt, scene);

    // return height of water at given point & time (s)
    const waterY = this.waterFunction(this.position, scene.time / 1000);

    // if close enough to water surface 
    // & slow enough, zero out gravity and set snappedToWater=true
    if (Math.abs(this.velocity[1]) < 0.01 && Math.abs(waterY - this.position[1]) < 0.01){
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
      const damper = Math.pow(this.waterFriction, dt * 1000/30)
      this.velocity[0] *= damper;
      this.velocity[1] *= damper;
      this.velocity[2] *= damper;
      this.rotVelocity[0] *= damper;
      this.rotVelocity[1] *= damper;
      this.rotVelocity[2] *= damper;
    }
  }
}
