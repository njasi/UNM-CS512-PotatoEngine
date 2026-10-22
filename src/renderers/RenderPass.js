import SceneObject from "../objects/SceneObject";
import Scene from "../Scene";

/**
 * Wrapper class to help define render order and different types of objects
 *
 * consider: ui elements, transparent, solid, shadow, etc
 */
export default class RenderPass {
  /**
   * Create a render pass
   * @param {*} label
   * @param {*} options
   * @param {*} options.framebuffer
   * @param {*} options.viewport
   * @param {*} options.clearMask
   * @param {*} options.clearColor
   * @param {*} options.setup
   * @param {*} options.cleanup
   * @param {*} options.sort
   */
  constructor(
    label,
    {
      framebuffer = null,
      viewport = null,
      clearMask = 0,
      clearColor = null,
      setup = null,
      cleanup = null,
      sort = null,
    } = {},
  ) {
    this.label = label;
    this.framebuffer = framebuffer;
    this.viewport = viewport;
    this.clearMask = clearMask;
    this.clearColor = clearColor;
    this.setup = setup;
    this.cleanup = cleanup;
    this.sort = sort;

    this.objects = new Set();
  }

  /**
   * Add an object to the passes list
   * @param {SceneObject} obj
   */
  addObject(obj) {
    this.objects.add(obj);
  }

  /**
   * Remove an object from the passes collection
   * @param {SceneObject} obj
   */
  removeObject(obj) {
    this.objects.delete(obj);
  }

  /**
   * Attach a render pass to a rendering session
   * @param {Scene} scene
   */
  attach(scene) {
    const gl = scene.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    const [x, y, width, height] = this.viewport ?? [
      0,
      0,
      scene.canvas.width,
      scene.canvas.height,
    ];

    gl.viewport(x, y, width, height);

    if (this.clearMask & gl.COLOR_BUFFER_BIT) {
      gl.clearColor(...(this.clearColor ?? scene.background));
    }

    if (this.clearMask) {
      gl.clear(this.clearMask);
    }

    if (!!this.setup) {
      this.setup(gl, scene, this);
    }
  }

  /**
   * Detach a render pass from the current rendering session
   * @param {Scene} scene
   */
  detach(scene) {
    if (!!this.cleanup) {
      this.cleanup(scene.gl, scene, this);
    }
  }

  /**
   * Get the objects to be rendered in this pass
   *
   * - applies the sort function if it is found
   *
   * @param {Scene} scene
   * @returns
   */
  getObjects(scene) {
    // Iterate the Set directly unless sorting is requested.
    return this.sort
      ? [...this.objects].sort((a, b) => this.sort(a, b, scene))
      : this.objects;
  }
}
