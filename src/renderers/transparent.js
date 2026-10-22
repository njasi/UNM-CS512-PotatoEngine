// TODO pass for transparent materials should be independant overall

import RenderPass from "./RenderPass";

export function addTransparentRenderPass(scene) {
  scene.addRenderPass(
    new RenderPass("transparent", {
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
