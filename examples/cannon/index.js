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
import FloatingObject from "../../src/objects/FloatingObject";
import PhysicsObject from "../../src/objects/PhysicsObject";
import { generateBarrel, generateBomb } from "../../src/objects/compositions";

import { cacheOBJ, generateOBJObject } from "../../src/objects/objLoader";
import { scaleVec4 } from "../../src/vec4";

const canvas = document.getElementById("glcanvas");
const vertEditor = document.getElementById("vertEditor");
const waterEditor = document.getElementById("waterEditor");
const fragEditor = document.getElementById("fragEditor");

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

scene.addShader(
  new Shader(
    "waterVertex",
    scene.gl.VERTEX_SHADER,
    "",
    "/src/shaders/water.vert",
  ),
);

let cannonConfig = {
  elevation: 45,
  yaw: 0,
  power: 50,
};

/**
 * Update cannon rotation based on the cannon config dict
 */
function updateCannon() {
  // TODO get cannon from scene and update it when we update config
  const cannon = scene.getObject("cannon");
  cannon.rotation[0] = (cannonConfig.elevation / 180) * Math.PI;
  cannon.rotation[1] = (cannonConfig.yaw / 180) * Math.PI;
}

/**
 * enforce a cooldown on the cannon as well as start an animation
 * from firing
 * @param {*} lookVector
 * @returns bool true if button was disabled, false if it was active
 */
function cannonCooldown(lookVector) {
  const button = document.getElementById("fire-button");
  const cannon = scene.getObject("cannon");

  if (button.disabled) {
    return true;
  }

  button.disabled = true;

  const startTime = scene.time;
  // TODO: should really set the update function on the cannon object
  const cooldownInter = setInterval(() => {
    const dt = scene.time - startTime;
    const shift = Math.sin((dt / 200) * Math.PI);

    // scale and give cannon kickback
    if (dt <= 200) {
      cannon.scale[0] = 1 + 0.1 * shift;
      cannon.scale[1] = 1 + 0.1 * shift;
      cannon.scale[2] = 1 + 0.1 * shift;
      cannon.position[0] = 0.5 * shift * -lookVector[0];
      cannon.position[2] = 0.5 * shift * -lookVector[2];
    } else {
      cannon.scale = [1, 1, 1];
      cannon.position[0] = 0;
      cannon.position[2] = 0;
    }

    if (dt > 500) {
      clearInterval(cooldownInter);
      button.disabled = false;
    }
  }, 30);

  return false;
}

/**
 * Create a bomb and launch it out of the cannon barrel
 * according to the cannonConfig settings from the sliders
 *
 * Bomb will explode upon collision and delete both objects
 * - if its a barrel a new barrel will be spawned
 */
function fireCannon() {
  const yawR = (cannonConfig.yaw / 180) * Math.PI;
  const pitR = (cannonConfig.elevation / 180) * Math.PI;

  // This took forever to figure out...
  // hopefully the addition of Z doesnt make it too bad later
  const cannonLook = [
    -Math.sin(yawR) * Math.cos(pitR),
    Math.sin(pitR),
    -Math.cos(pitR) * Math.cos(yawR),
    0,
  ];

  if (cannonCooldown(cannonLook)) {
    return;
  }

  const bombPrim = generateBomb(0.5);

  const position = scaleVec4(cannonLook, 3);
  position[1] += 1.75;

  // random rotation and velocuty
  // NOTE: z rotation looks a lil wonky maybe
  const rotation = [
    Math.random() * 2 * Math.PI,
    Math.random() * 2 * Math.PI,
    Math.random() * 2 * Math.PI,
    0,
  ];
  const rotVelocity = [
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    0,
  ];

  // use unit vector from the cannon angle
  // and then scale it based on the power slider
  const velocity = scaleVec4(cannonLook, cannonConfig.power / 4);

  const bomb = new PhysicsObject(
    "bomb" + Date.now(),
    new Float32Array(bombPrim.vertices),
    new Float32Array(bombPrim.colors),
    new Uint16Array(bombPrim.indices),
    undefined,
    position,
    rotation,
    velocity,
    rotVelocity,
    9.81,
    0.5,
    true,
    (bomb, other) => {
      animateExplosion(bomb.position);

      scene.removeObject(bomb.label);
      scene.removeObject(other.label);

      if (other.label.startsWith("barrel")) {
        // todo increase score or something idk
        addRandomBarrel();
      }
    },
  );

  scene.addObject(bomb, "basic");
}

let barrelCount = 0;
/**
 * Add a barrel to the scene with
 * - random position
 * - random velocity
 * - random rotation
 */
function addRandomBarrel() {
  const barrelPrim = generateBarrel(20, 1, 2.5, 0, 0, 0, 0.2);

  const velocity = [
    Math.random() * 10 - 5,
    Math.random() * 30,
    Math.random() * 10 - 5,
  ];
  const rotVelocity = [Math.random(), Math.random(), Math.random()];
  const position = [
    Math.random() * 50 - 25,
    Math.random() * -20,
    Math.random() * -20 - 15,
  ];
  const rotation = [
    Math.random() * 2 * Math.PI,
    Math.random() * 2 * Math.PI,
    Math.random() * 2 * Math.PI,
  ];

  barrelCount++;
  const barrel = new FloatingObject(
    "barrel" + barrelCount,
    new Float32Array(barrelPrim.vertices),
    new Float32Array(barrelPrim.colors),
    new Uint16Array(barrelPrim.indices),
    undefined,
    position,
    rotation,
    velocity,
    rotVelocity,
  );

  barrel.hitboxRadius = 1.5;
  barrel.waterFunction = (pos, time) => 0.4 * Math.sin(time);

  scene.addObject(barrel, "basic");
}

/**
 * Animate an explosion (fast growing sphere)
 * at the indicated position
 *
 * @param {*} position
 */
function animateExplosion(position) {
  const explosion = generateSphereObject(
    "explosion" + Date.now(),
    rgba(241, 123, 12, 1),
    32,
    1,
  );
  explosion.position = position;

  let scale = 0.3;
  explosion.position = position;
  explosion.scale = [scale, scale, scale];
  scene.addObject(explosion, "basic");

  const explodeInt = setInterval(() => {
    scale *= 1.5;
    explosion.scale = [scale, scale, scale];
    if (scale > 5) {
      scene.removeObject(explosion.label);
      clearInterval(explodeInt);
    }
  }, 30);
}

/**
 * Initalize all the objects in the starting scene
 * - 10 random barrels
 * - cannon
 * - pillar canon sits on
 * - water
 */
function initSceneObjects() {
  for (let i = 0; i < 10; i++) {
    addRandomBarrel();
  }
  // add water
  scene.addObject(
    generateGridObject("water", rgba(1, 86, 239), 20, 200),
    "water",
  );

  // pillar for cannon to sit on
  const pillar = generateCylinderObject(
    "pillar",
    rgba(78, 75, 73, 1),
    32,
    2.5,
    2,
    0,
    0,
    0,
  );
  pillar.rotation[0] = Math.PI / 2;
  pillar.position[1] = -0.5;
  scene.addObject(pillar, "basic");

  // watercolor =>  rgba(1, 86, 239)
  const cannon = generateCannonObject("cannon", undefined);
  cannon.position[1] = 1.8;
  cannon.rotation[0] = Math.PI / 4;
  scene.addObject(cannon, "basic");
}

/**
 * INitalize mouse interactions with the canvas
 * - basically drag calculations let us rotate the scene
 */
function setupMouseControls() {
  // Mouse and keyboard interactions
  let mouseDown = false,
    lastX,
    lastY;

  canvas.addEventListener("mousedown", (e) => {
    mouseDown = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener("mouseup", () => (mouseDown = false));
  canvas.addEventListener("mouseleave", () => (mouseDown = false));
  canvas.addEventListener("mousemove", (e) => {
    if (!mouseDown) return;
    let dx = e.clientX - lastX;
    let dy = e.clientY - lastY;

    scene.rotationY += dx * 0.01;
    scene.rotationX += dy * 0.01;

    lastX = e.clientX;
    lastY = e.clientY;
  });
}

/**
 * Initalize keyboard controls
 * - w & s to move z
 * - arrows to move x & y
 */
function setupKeyboardControls() {
  document.addEventListener("keydown", (e) => {
    const step = 0.2;

    switch (e.key) {
      case "ArrowUp":
        scene.camera.move(0, -step, 0);
        break;

      case "ArrowDown":
        scene.camera.move(0, step, 0);
        break;

      case "ArrowLeft":
        scene.camera.move(step, 0, 0);
        break;

      case "ArrowRight":
        scene.camera.move(-step, 0, 0);
        break;

      case "w":
        scene.camera.move(0, 0, step);
        break;

      case "s":
        scene.camera.move(0, 0, -step);
        break;
    }
  });
}

/**
 * Attach event listeners to the html elements
 * ie sliders & fire button
 */
function setupInputControls() {
  document.getElementById("fire-button").addEventListener("mousedown", () => {
    fireCannon();
  });

  /**
   * Handle an event to any of the cannon sliders and update the config dict
   * @param {*} event
   */
  function handleCannonConfig(event) {
    const name = event.target.name;
    cannonConfig[name] = parseFloat(event.target.value);
    document.getElementById(name + "Value").innerText = cannonConfig[name];
    updateCannon();
  }

  document.getElementById("yaw").addEventListener("input", handleCannonConfig);
  document
    .getElementById("elevation")
    .addEventListener("input", handleCannonConfig);
  document
    .getElementById("power")
    .addEventListener("input", handleCannonConfig);
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
  scene.addProgram("water", "waterVertex", "basicFragment");

  initSceneObjects();

  const vertexShader = scene.getShader("basicVertex");
  const fragmentShader = scene.getShader("basicFragment");
  const waterShader = scene.getShader("waterVertex");

  vertEditor.value = vertexShader.source;
  waterEditor.value = waterShader.source;
  fragEditor.value = fragmentShader.source;

  scene.initBuffers();

  // initShaderProgram();
  // vertEditor.onkeyup = initShaderProgram;
  // fragEditor.onkeyup = initShaderProgram;

  setupMouseControls();
  setupKeyboardControls();
  setupInputControls();

  // Initialize when page loads
  // dont need onload since we defer this script

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
