import {
  perspective,
  mat4Translate,
  matMul,
  box2Cube,
  frustum2Box,
  mat4Identity,
} from "./util/transformations";

/**
 * Simple camera class for perspective / orthographic rendering.
 */
class Camera {
  /**
   * 
   * @param {Number} aspect The aspect ratio of the camera
   * @param {Number} x initial x position of the camera
   * @param {Number} y initial y position of the camera
   * @param {Number} z initial z position of the camera
   * @param {Number} fov fov setting
   * @param {Number} zNear z of the near plane
   * @param {Number} zFar z of the far plane
   * @param {Number} orthoSize orthographic projection size
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
   * @param {Number} aspect
   */
  resize(aspect) {
    this.aspect = aspect;
    this.projection = this.createPerspectiveProjection();
  }

  /**
   * Move the position of the camera
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  move(x, y, z) {
    this.x += x;
    this.y += y;
    this.z += z;
  }

  /**
   * get the view matrix of the camera
   * @returns {Float32Array} mat4 representaton of the view matrix
   */
  getViewMatrix() {
    return mat4Translate(mat4Identity(), [this.x, this.y, this.z]);
  }

  /**
   * get camera projection matrix
   * @returns {Float32Array} mat4 representaton of the projection matrix
   */
  getProjectionMatrix() {
    return this.projection;
  }
}

export default Camera;
