import Scene from "../../src/Scene";
import RayShaderProgram from "../../src/shaders/RayShaderProgram";
import controls from "../../src/controls";
import { addRayTracingRenderPass } from "../../src/renderers/raytracing";
import flight from "../../src/controls/flight";
import { RayObject } from "../../src/objects";

const SHADER_PROGRAM_RAY = "ray";

const scene = new Scene("glcanvas");
scene.camera.move(0, -2.5, -25);
scene.rotationX += Math.PI / 6;

scene.createProgram(
  SHADER_PROGRAM_RAY,
  "/src/shaders/vertex/ray.vert",
  "/src/shaders/fragment/ray.frag",
  RayShaderProgram,
);

/**
 * Attach event listeners to the html elements
 */
function setupInputControls() {}

/**
 * Initalize all the objects in the starting scene
 * - the segments of the arm
 */
function initSceneObjects() {
  const sphere = new RayObject("testSphere", RayObject.OBJECT_TYPE_SPHERE, {
    radius: 20,
  });
  scene.addObject(sphere, SHADER_PROGRAM_RAY, undefined, { passes: ["ray"] });
}

flight.setupMouseControls(scene);
const cameraCB = flight.setupKeyboardControls(scene);

function updateScene(dt) {
  cameraCB(dt);
}

scene.setUpdateCB(updateScene);

/**
 * Main init function
 * - load the scene shaders
 * - init all objects
 * - initialize buffers
 * - attach keyboard, mouse, input listeners
 * - start animation loop
 */
async function main() {
  await scene.load();

  addRayTracingRenderPass(scene, SHADER_PROGRAM_RAY);

  initSceneObjects();

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
