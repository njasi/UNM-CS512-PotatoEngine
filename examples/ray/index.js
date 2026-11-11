import Scene from "../../src/Scene";
import RayShaderProgram from "../../src/shaders/RayShaderProgram";
import controls from "../../src/controls";
import {
  addRayTracingRenderPass,
  RENDER_PASS_RAY,
} from "../../src/renderers/raytracing";
import flight from "../../src/controls/flight";
import { RayObject } from "../../src/objects";

const SHADER_PROGRAM_RAY = "ray";

const scene = new Scene("glcanvas");
// scene.camera.move(0, 0, -25);
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

let sphere;
/**
 * Initalize all the objects in the starting scene
 * - the segments of the arm
 */
function initSceneObjects() {
  sphere = new RayObject("testSphere", RayObject.OBJECT_TYPE_SPHERE, {
    radius: 2,
  });
  let cube = new RayObject("testCube", RayObject.OBJECT_TYPE_CUBE, {
    halfSize: 1,
    position: [0, 0, -5],
  });
  let plane = new RayObject("testPlane", RayObject.OBJECT_TYPE_PLANE, {
    position: [0, -5, 0],
    width: 10,
    depth: 10,
  });

  const lightSphere = new RayObject("testLightSphere", RayObject.OBJECT_TYPE_SPHERE, {
    radius: 0.5,
    light: true,
  });
  scene.addObject(sphere, SHADER_PROGRAM_RAY, undefined, {
    passes: [RENDER_PASS_RAY],
  });
  scene.addObject(cube, SHADER_PROGRAM_RAY, undefined, {
    passes: [RENDER_PASS_RAY],
  });
  scene.addObject(plane, SHADER_PROGRAM_RAY, undefined, {
    passes: [RENDER_PASS_RAY],
  });
  scene.addObject(lightSphere, SHADER_PROGRAM_RAY, undefined, {
    passes: [RENDER_PASS_RAY],
  });
}

flight.setupMouseControls(scene);
const cameraCB = flight.setupKeyboardControls(scene);

function updateScene(dt) {
  cameraCB(dt);

  sphere.position[0] = 5 * Math.sin(scene.time / 500);
  sphere.position[1] = 5 * -Math.cos(scene.time / 500);
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
