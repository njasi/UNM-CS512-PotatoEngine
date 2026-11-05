import {
  perspective,
  mat4Translate,
  matMul,
  mat4RotateX,
  mat4RotateY,
  box2Cube,
  flipZ,
  mat4Identity,
} from "./util/transformations";

/**
 * Camera operations wrapper class
 */
class Camera {
  /**
   * Create a new camera
   * @param {number} aspect
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} fov
   * @param {number} zNear
   * @param {number} zFar
   * @param {number} orthoSize
   */
  constructor(
    aspect,
    x = 0,
    y = 0,
    z = -6,
    fov = Math.PI / 4,
    zNear = 0.1,
    zFar = 100,
    orthoSize = 2.5,
  ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.yaw = 0;
    this.pitch = 0;

    this.fov = fov;
    this.aspect = aspect;
    this.zNear = zNear;
    this.zFar = zFar;
    this.orthoSize = orthoSize;

    this.projection = this.createPerspectiveProjection();
  }

  /**
   * Calculate a perspective projection matrix
   */
  createPerspectiveProjection() {
    return perspective(this.fov, this.aspect, this.zNear, this.zFar);
  }

  /**
   * Calculate an orthographic projection matrix
   */
  createOrthographicProjection() {
    return matMul(
      box2Cube(
        -this.orthoSize * this.aspect,
        this.orthoSize * this.aspect,
        -this.orthoSize,
        this.orthoSize,
        this.zNear,
        this.zFar,
      ),
      flipZ(),
    );
  }

  /**
   * Set the projection matrix to perspective
   */
  usePerspective() {
    this.projection = this.createPerspectiveProjection();
  }

  /**
   * Set the projection matrix to orthographic
   */
  useOrthographic() {
    this.projection = this.createOrthographicProjection();
  }

  /**
   * Resize the viewport
   * @param {number} aspect
   */
  resize(aspect) {
    this.aspect = aspect;
    this.projection = this.createPerspectiveProjection();
  }

  /**
   * Move the position of the camera
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  move(x, y, z) {
    this.x += x;
    this.y += y;
    this.z += z;
  }

  /**
   * Rotate the camera.
   * @param {number} yawDelta Horizontal rotation in radians
   * @param {number} pitchDelta Vertical rotation in radians
   */
  rotate(yawDelta, pitchDelta) {
    this.yaw += yawDelta;

    // stop from flipping upside down cause that would be confusing
    // maybe could allow it and add like a axis compass to the scene
    const maxPitch = Math.PI / 2 - 0.01;
    this.pitch = Math.max(
      -maxPitch,
      Math.min(maxPitch, this.pitch + pitchDelta),
    );
  }

  /**
   * Set the camera orientation.
   * @param {number} yaw Horizontal rotation in radians
   * @param {number} pitch Vertical rotation in radians
   */
  setRotation(yaw, pitch) {
    this.yaw = yaw;
    this.pitch = 0;
    this.rotate(0, pitch);
  }

  /**
   * Get the view transformation matrix for the camera
   * @returns {Float32Array} (mat4)
   */
  getViewMatrix() {
    // inverse rotation for camera view matrix
    const rotation = mat4RotateX(
      mat4RotateY(mat4Identity(), -this.yaw),
      -this.pitch,
    );
    const translation = mat4Translate(rotation, [this.x, this.y, this.z]);

    return translation;
  }

  /**
   * get the projection matrix
   * @returns {Float32Array}
   */
  getProjectionMatrix() {
    return this.projection;
  }
}

export default Camera;
