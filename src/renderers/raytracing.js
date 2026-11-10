/**
 * @module renderers
 */

import { Scene } from "..";
import { ShaderProgram } from "../shaders";
import RenderPass from "./RenderPass";

/**
 * Add a basic ray tracing render pass
 * which primarily uses RayObjects in its scene.
 * @param {Scene} scene
 */
export function addRayTracingRenderPass(scene) {
  rayPass = new RenderPass("basic", {
    clearMask: scene.gl
      ? scene.gl.COLOR_BUFFER_BIT | scene.gl.DEPTH_BUFFER_BIT
      : 0,
    setup,
    updateUniforms,
    cleanup,
  });

  // dict to track ray pass specific locs
  rayPass.locs = {};

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
  if (!(shaderProgram.label in this.locs)) {

    this.locs[shaderProgram.label] = {
      targetLoc: shaderProgram.addLoc("u_target"),
      cameraOrbitLoc: shaderProgram.addLoc("u_cameraOrbit"),
    }

  }else{

  } 
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
