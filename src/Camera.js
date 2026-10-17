import {
  perspective,
  mat4Translate,
  matMul,
  box2Cube,
  frustum2Box,
  mat4Identity,
} from "./transformations";


/**
 * Simple camera class, probably want some updates here for lighting
 */
export default class Camera {
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
   * Calculate perspective projection matrix
   * @returns 
   */
  createPerspectiveProjection() {
    return perspective(this.fov, this.aspect, this.zNear, this.zFar);
  }

  /**
   * Calculate orthographic projection matrix
   * @returns 
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
   * set projection matrix to perspective
   */
  usePerspective() {
    this.projection = this.createPerspectiveProjection();
  }

  /**
   * set projection matrix to orthographic
   */
  useOrthographic() {
    this.projection = this.createOrthographicProjection();
  }

  /**
   * Resize the viewport
   * @param {*} aspect 
   */
  resize(aspect) {
    this.aspect = aspect;
    this.projection = this.createOrthographicProjection();
  }

  /**
   * Move the position of the camera
   * @param {*} x 
   * @param {*} y 
   * @param {*} z 
   */
  move(x, y, z) {
    this.x += x;
    this.y += y;
    this.z += z;
  }

  /**
   * get the view matrix of the camera
   * @returns 
   */
  getViewMatrix() {
    return mat4Translate(mat4Identity(), [this.x, this.y, this.z]);
  }

  /**
   * get camera projection matrix
   * @returns 
   */
  getProjectionMatrix() {
    return this.projection;
  }
}
