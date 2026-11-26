/**
 * @module renderers
 */
import RenderPass from "./RenderPass";

export const RENDER_PASS_TRANSPARENT = "transparent";

/**
 * Add a simple transparent renderpass to the scene for see through objects
 * this render pass should use the phong shader program with materials that have alpha
 * or another program that sets alpha from color or something...
 * @param {Scene} scene
 */
export function addTransparentRenderPass(scene) {
  scene.addRenderPass(
    new RenderPass(RENDER_PASS_TRANSPARENT, {
      setup: (gl) => {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
      },
      cleanup: (gl) => {
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      },
      // sort: (a, b) => b.cameraDepth - a.cameraDepth,
    }),
  );
}
