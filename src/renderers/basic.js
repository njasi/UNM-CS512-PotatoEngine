/**
 * @module renderers
 */

import { Scene } from "..";
import RenderPass from "./RenderPass";

/**
 * Add the default basic render pass to a scene
 * @param {Scene} scene 
 */
export function addBasicRenderPass(scene){
    scene.addRenderPass(
      new RenderPass("basic", {
        clearMask: scene.gl
          ? scene.gl.COLOR_BUFFER_BIT | scene.gl.DEPTH_BUFFER_BIT
          : 0,
        setup: (gl) => {
          gl.enable(gl.DEPTH_TEST);
        },
      }),
    );
}

