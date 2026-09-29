import Scene from "../../src/Scene";
import Shader from "../../src/Shader";
import {
  generateBarrelObject,
  generateBombObject,
  generateCannonObject,
  generateCylinderObject,
  generateGridObject,
  generateSphereObject,
  rgba,
} from "../../src/objects";

import basicControls from "../../src/controls/basic";

const canvas = document.getElementById("glcanvas");

// try to plug in new scene abstraction
const scene = new Scene("glcanvas");
scene.camera.move(0, -2.5, -25);
scene.rotationX += Math.PI / 6;

scene.addShader(
  new Shader(
    "basicVertex",
    scene.gl.VERTEX_SHADER,
    "",
    "/src/shaders/vertex.vert",
  ),
);

scene.addShader(
  new Shader(
    "basicFragment",
    scene.gl.FRAGMENT_SHADER,
    "",
    "/src/shaders/fragment.frag",
  ),
);

let armConfig = {
  0: {
    elevation: 45,
    yaw: 0,
  },
  1: {
    elevation: 0,
    yaw: 0,
  },
  2: {
    elevation: 0,
    yaw: 0,
  },
  3: {
    elevation: 0,
    yaw: 0,
  },
};

/**
 * Update cannon rotation based on the cannon config dict
 */
function updateArm(armId) {
  // TODO get cannon from scene and update it when we update config
  const arm = scene.getObject("arm" + armId);
  arm.rotation[0] = (armConfig[armId].elevation / 180) * Math.PI;
  arm.rotation[1] = (armConfig[armId].yaw / 180) * Math.PI;
}

/**
 * Attach event listeners to the html elements
 * ie sliders & fire button
 */
function setupInputControls(armId) {
  /**
   * Handle an event to any of the cannon sliders and update the config dict
   * @param {*} event
   */
  function handleArmConfig(event) {
    const name = event.target.name;
    armConfig[armId][name] = parseFloat(event.target.value);
    document.getElementById(name + armId + "Value").innerText =
      armConfig[armId][name];
    updateArm(armId);
  }

  document
    .getElementById("yaw" + armId)
    .addEventListener("input", handleArmConfig);
  document
    .getElementById("elevation" + armId)
    .addEventListener("input", handleArmConfig);
}

/**
 * Initalize all the objects in the starting scene
 * - 10 random barrels
 * - cannon
 * - pillar canon sits on
 * - water
 */
function initSceneObjects() {
  // scene.addObject(
  //   generateGridObject("ground", rgba(7, 79, 1, 1), 20, 200),
  //   "basic",
  // );

  // pillar for cannon to sit on
  const arm0 = generateCylinderObject(
    "arm0",
    rgba(255, 0, 0, 0),
    32,
    2.5,
    10,
    0,
    0,
    5,
  );
  arm0.rotation[0] = Math.PI / 2;
  arm0.position[1] = 0;
  scene.addObject(arm0, "basic");

  const arm1 = generateCylinderObject(
    "arm1",
    rgba(0, 255, 0, 0),
    32,
    2.5,
    10,
    0,
    0,
    5,
  );
  arm1.position[2] = 10;
  scene.addObject(arm1, "basic", true);
  arm0.addChild(arm1);

  const arm2 = generateCylinderObject(
    "arm2",
    rgba(0, 0, 255, 0),
    32,
    2.5,
    10,
    0,
    0,
    5,
  );
  arm2.position[2] = 10;
  scene.addObject(arm2, "basic", true);
  arm1.addChild(arm2);

    const arm3 = generateCylinderObject(
    "arm3",
    rgba(0, 255, 255, 0),
    32,
    2.5,
    10,
    0,
    0,
    5,
  );
  arm3.position[2] = 10;
  scene.addObject(arm3, "basic", true);
  arm2.addChild(arm3);
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
  // TODO use obj in the demo?
  // await cacheOBJ("./dist/utah_teapot.obj", "teapot");
  // scene.addObject(generateOBJObject("teapot1", undefined, "teapot"));

  await scene.loadShaders();

  scene.addProgram("basic", "basicVertex", "basicFragment");

  initSceneObjects();
  scene.initBuffers();

  basicControls.setupMouseControls(scene);
  basicControls.setupKeyboardControls(scene);
  setupInputControls(0);
  setupInputControls(1);
  setupInputControls(2);
  setupInputControls(3);

  // Initialize when page loads
  // dont need onload since we defer this script

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
