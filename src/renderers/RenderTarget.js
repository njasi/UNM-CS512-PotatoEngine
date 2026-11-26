/**
 * @module renderers/RenderTarget
 */

/**
 * Wrapper class to holding a framebuffer and its associated color texture
 * 
 * @class
 * @alias module:renderers/RenderTarget
 */

export class RenderTarget {
  static TARGET_PING = "TARGET_PING";
  static TARGET_PONG = "TARGET_PONG";
  // grab the previous used by the scene
  static TARGET_PREV = "TARGET_PREV";
  // render to the canvas, dont think you can sample from this one
  static TARGET_CANVAS = "TARGET_CANVAS";

  /**
   * Make a new render target
   * @param {WebGL2RenderingContext} gl 
   * @param {number} width 
   * @param {number} height 
   * @param {Object} [options={}] 
   * @param {boolean} [options.depth=true] 
   */
  constructor(gl, width, height, { depth = true } = {}) {
    if (width <= 0 || height <= 0) {
      throw new Error("RenderTarget dimensions must be positive");
    }

    this.gl = gl;
    this.width = width;
    this.height = height;

    this.framebuffer = gl.createFramebuffer();
    this.colorTexture = gl.createTexture();
    this.depthBuffer = depth ? gl.createRenderbuffer() : undefined;

    if (!this.framebuffer || !this.colorTexture) {
      this.dispose();
      throw new Error("Failed to create render target");
    }

    if (depth && !this.depthBuffer) {
      this.dispose();
      throw new Error("Failed to create render target depth buffer");
    }

    this._initialize();
  }

  /**
   * setup texture & allocate needed resources
   * 
   * NOTE: could use texture 2d abstraction here but tbh is cleaner doing it raw
   * 
   * @param {WebGL2RenderingContext} [gl=this.gl] 
   */
  _initialize(gl = this.gl) {

    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      this.width,
      this.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.colorTexture,
      0,
    );

    // depth attachment, todo integrate into the renderpass target pipeline...
    // only grabs colors rn
    if (this.depthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);

      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,
        this.width,
        this.height,
      );

      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        this.depthBuffer,
      );
    }

    // NOTE: make sure buffer isnt borked; seems they can get messed up if a pass
    // uses them badly. If you're seeing the below error make sure none of 
    // your render targets are being sampled from and rendered to at the same time
    // this can cause cascading issues making the below and other errors happen...
    // i think this one will only be triggered if you break the targets really early though
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      this.dispose();

      throw new Error(
        `RenderTarget framebuffer incomplete: 0x${status.toString(16)}`,
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    if (this.depthBuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }
  }

  /**
   * bind target as render dest
   * 
   * @param {WebGL2RenderingContext} [gl=this.gl] 
   */
  bind(gl = this.gl) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.width, this.height);
  }

  /**
   * clean up
   * 
   * @param {WebGL2RenderingContext} [gl=this.gl] 
   */
  dispose(gl = this.gl) {
    if (this.framebuffer) {
      gl.deleteFramebuffer(this.framebuffer);
      this.framebuffer = null;
    }
    if (this.colorTexture) {
      gl.deleteTexture(this.colorTexture);
      this.colorTexture = null;
    }
    if (this.depthBuffer) {
      gl.deleteRenderbuffer(this.depthBuffer);
      this.depthBuffer = null;
    }
  }
}
