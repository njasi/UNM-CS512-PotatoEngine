/**
 * @module renderers
 */

import { Scene } from "..";
import RenderPass from "./RenderPass";

export const RENDER_PASS_BASIC = "basic";

/**
 * Add the default basic render pass to a scene
 * @param {Scene} scene
 * @param {*} output 
 */
export function addBasicRenderPass(scene, output = RenderPass.TARGET_CANVAS) {
  try {
    // try removing, so we can overrwrite with custom settings if we want
    scene.removeRenderPass(RENDER_PASS_BASIC);
  } catch {}

  scene.addRenderPass(
    new RenderPass(RENDER_PASS_BASIC, {
      output,
      clearMask: scene.gl
        ? scene.gl.COLOR_BUFFER_BIT | scene.gl.DEPTH_BUFFER_BIT
        : 0,
      setup: (gl) => {
        gl.enable(gl.DEPTH_TEST);
      },
    }),
  );
}
