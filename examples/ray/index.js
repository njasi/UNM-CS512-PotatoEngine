import Scene from "../../src/Scene";
import RayShaderProgram from "../../src/shaders/RayShaderProgram";
import controls from "../../src/controls";

// try to plug in new scene abstraction
const scene = new Scene("glcanvas");
scene.camera.move(0, -2.5, -25);
scene.rotationX += Math.PI / 6;

scene.createProgram(
  "ray",
  "/src/shaders/vertex/ray.vert",
  "/src/shaders/fragment/ray.frag",
  RayShaderProgram,
);


/**
 * Attach event listeners to the html elements
 */
function setupInputControls() {
  
}

/**
 * Initalize all the objects in the starting scene
 * - the segments of the arm
 */
function initSceneObjects() {

}

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

  initSceneObjects();

  controls.FlightControls.setupMouseControls(scene);
  controls.FlightControls.setupKeyboardControls(scene);

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
