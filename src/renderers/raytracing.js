/**
 * @module renderers
 */

import { Scene } from "..";
import { ShaderProgram } from "../shaders";
import RayShaderProgram from "../shaders/RayShaderProgram";
import RenderPass from "./RenderPass";

/**
 * Add a basic ray tracing render pass
 * which primarily uses RayObjects in its scene.
 * @param {Scene} scene
 * @param {string} programLabel the label of the ray tracing program
 */
export function addRayTracingRenderPass(scene, programLabel = "ray") {
  const rayPass = new RenderPass("ray", {
    clearMask: scene.gl
      ? scene.gl.COLOR_BUFFER_BIT | scene.gl.DEPTH_BUFFER_BIT
      : 0,
    setup,
    updateUniforms,
    cleanup,
    objIndependent: true,
    programLabel,
  });

  scene.addRenderPass(rayPass);
}

/**
 * Attach the render pass to the scene
 * @param {WebGL2RenderingContext} gl
 * @param {Scene} scene
 */
function setup(gl, scene) {
  // gl.
}

/**
 * Update the uniforms relevant to the pass
 * which are linked to the scene directly
 * - in our case here probably the camera uniforms count
 * @param {WebGL2RenderingContext} gl
 * @param {ShaderProgram} shaderProgram
 * @param {Scene} scene
 */
function updateUniforms(gl, shaderProgram, scene) {
  if (!(shaderProgram instanceof RayShaderProgram)) {
    return;
  }

  shaderProgram.uniforms.u_target = new Float32Array([
    -scene.camera.x,
    -scene.camera.y,
    -scene.camera.z,
  ]);

  shaderProgram.uniforms.u_cameraOrbit = new Float32Array([
    scene.camera.pitch,
    scene.camera.yaw,
  ]);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Detach the render pass from the scene
 * @param {WebGL2RenderingContext} gl
 * @param {Scene} scene
 */
function cleanup(gl, scene) {}

/**
 * Pack objects into the object buffer
 */
function packObjects() {}

/**
 * Pack materials into the material buffer
 */
function packMaterials() {}

/**
 * Pack lights into the light buffer...
 *
 * unsure if this is a light representation like i
 * was using before or we just make these scene objects
 * directional light would be nice to have and idk
 * how you'd get that from an object...
 */
function packLights() {}
