/**
 * @module renderers
 */

import { Scene } from "..";
import { RayMaterial } from "../materials";
import { RayObject } from "../objects";
import { ShaderProgram } from "../shaders";
import RayShaderProgram from "../shaders/RayShaderProgram";
import RayRenderPass from "./RayRenderPass";
import RenderPass from "./RenderPass";

// TODO a lot of this can probably just
// be moved into the ray render pass...

export const RENDER_PASS_RAY = "ray";

/**
 * Add a basic ray tracing render pass
 * which primarily uses RayObjects in its scene.
 * @param {Scene} scene
 * @param {string} programLabel the label of the ray tracing program
 */
export function addRayTracingRenderPass(scene, programLabel = RENDER_PASS_RAY) {
  const rayPass = new RayRenderPass(RENDER_PASS_RAY, {
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
  // no setup rn
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

  packObjects(gl, [...this.objects], shaderProgram);
  packLights(gl, [...this.lights], shaderProgram);
  // packMaterials()

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
 * @param {WebGL2RenderingContext} gl
 * @param {RayObject[]} objects
 * @param {RayShaderProgram} shaderProgram
 * @param {Object} [options={}]
 * @param {number} [options.itemSize=RayObject.OBJECT_BYTE_SIZE]
 * @param {number} [options.maxItems=shaderProgram.maxObjects]
 * @param {WebGLBuffer | undefined} [options.targetBuffer=shaderProgram.objectBuffer]
 * @param {string} [options.countUniform="u_objectCount"]
 */
function packObjects(
  gl,
  objects,
  shaderProgram,
  {
    itemSize = RayObject.OBJECT_BYTE_SIZE,
    maxItems = shaderProgram.maxObjects,
    targetBuffer = shaderProgram.objectBuffer,
    countUniform = "u_objectCount",
  } = {},
) {
  const bytes = new ArrayBuffer(itemSize * maxItems);
  const view = new DataView(bytes);

  for (let i = 0; i < objects.length; i++) {
    const offset = i * itemSize;
    objects[i].packData(view, offset);
  }

  // throw the data into the buffer
  gl.bindBuffer(gl.UNIFORM_BUFFER, targetBuffer);
  gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Uint8Array(bytes));
  gl.bindBuffer(gl.UNIFORM_BUFFER, null);

  shaderProgram.uniforms[countUniform] = objects.length;
}

/**
 * Pack materials into the material buffer
 */
function packMaterials(gl, materials, shaderProgram) {
  const bytes = new ArrayBuffer(
    RayMaterial.MATERIAL_BYTE_SIZE * shaderProgram.maxMaterials,
  );
  const view = new DataView(bytes);

  for (let i = 0; i < materials.length; i++) {
    const offset = i * RayMaterial.MATERIAL_BYTE_SIZE;
    materials[i].packData(view, offset);
  }

  // throw the data into the buffer
  gl.bindBuffer(gl.UNIFORM_BUFFER, shaderProgram.objectBuffer);
  gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Uint8Array(bytes));
  gl.bindBuffer(gl.UNIFORM_BUFFER, null);

  shaderProgram.uniforms.u_materialCount = materials.length;
}

/**
 * Pack lights into the light buffer...
 *
 * unsure if this is a light representation like i
 * was using before or we just make these scene objects
 * directional light would be nice to have and idk
 * how you'd get that from an object...
 *
 * Identical to the object packing function so we just call it as a helper
 */
function packLights(gl, lights, shaderProgram) {
  packObjects(gl, lights, shaderProgram, {
    targetBuffer: shaderProgram.lightBuffer,
    maxItems: shaderProgram.maxLights,
    countUniform: "u_lightCount",
  });
}
