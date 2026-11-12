import Scene from "../../src/Scene";
import RayShaderProgram from "../../src/shaders/RayShaderProgram";
import controls from "../../src/controls";
import {
  addRayTracingRenderPass,
  RENDER_PASS_RAY,
} from "../../src/renderers/raytracing";
import flight from "../../src/controls/flight";
import { RayObject } from "../../src/objects";
import { RayMaterial } from "../../src/materials";

const SHADER_PROGRAM_RAY = "ray";

const scene = new Scene("glcanvas");
// scene.camera.move(0, 0, -25);
scene.rotationX += Math.PI / 6;

const rayProgram = scene.createProgram(
  SHADER_PROGRAM_RAY,
  "../../src/shaders/vertex/ray.vert",
  "../../src/shaders/fragment/ray.frag",
  RayShaderProgram,
);

const MAT_BLUE_GLASS = "blueGlass";
let glass;
/**
 * Add materials to the scene
 */
function addMaterials() {
  glass = new RayMaterial(MAT_BLUE_GLASS, {
    ka: [0, 0, 0],
    kd: [0, 0, 1],
    ks: [0, 0, 0],
    refractiveIndex: 2.42,
  });

  scene.addMaterial(glass, SHADER_PROGRAM_RAY);
}

let sphere;
let lightSphere;
let lightSphere2;
/**
 * Initalize all the objects in the starting scene
 * - the segments of the arm
 */
function initSceneObjects() {
  sphere = new RayObject("testSphere", RayObject.OBJECT_TYPE_SPHERE, {
    radius: 2,
    materialIndex: -2,
  });
  let sphere2 = new RayObject("testSphere2", RayObject.OBJECT_TYPE_SPHERE, {
    radius: 2,
    materialLabel: MAT_BLUE_GLASS,
    position: [10, 0, 0],
  });
  let cube = new RayObject("testCube", RayObject.OBJECT_TYPE_CUBE, {
    halfSize: 2,
    position: [0, 0, -5],
    materialLabel: MAT_BLUE_GLASS,
  });
  // let cube3 = new RayObject("testCube3", RayObject.OBJECT_TYPE_CUBE, {
  //   halfSize: 2,
  //   position: [0, 0, -10],
  // });
  let cube2 = new RayObject("testCube2", RayObject.OBJECT_TYPE_CUBE, {
    halfSize: 1,
    position: [10, 0, -5],
    materialIndex: -2,
  });
  let plane = new RayObject("testPlane", RayObject.OBJECT_TYPE_PLANE, {
    position: [0, -10, 0],
    width: -1,
    depth: -1,
  });

  lightSphere = new RayObject("testLightSphere", RayObject.OBJECT_TYPE_SPHERE, {
    radius: 0.5,
    light: true,
    lightPower: 3,
  });

  lightSphere2 = new RayObject(
    "testLightSphere2",
    RayObject.OBJECT_TYPE_SPHERE,
    {
      radius: 0.1,
      light: true,
      position: [0, 2, -10],
    },
  );

  scene.addObject(sphere, SHADER_PROGRAM_RAY, undefined, {
    passes: [RENDER_PASS_RAY],
  });
  scene.addObject(sphere2, SHADER_PROGRAM_RAY, undefined, {
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
  scene.addObject(lightSphere2, SHADER_PROGRAM_RAY, undefined, {
    passes: [RENDER_PASS_RAY],
  });
  scene.addObject(cube2, SHADER_PROGRAM_RAY, undefined, {
    passes: [RENDER_PASS_RAY],
  });
  // scene.addObject(cube3, SHADER_PROGRAM_RAY, undefined, {
  //   passes: [RENDER_PASS_RAY],
  // });
}

flight.setupMouseControls(scene);
const cameraCB = flight.setupKeyboardControls(scene);

function updateScene(dt) {
  cameraCB(dt);

  sphere.position[0] = 5 * Math.sin(scene.time / 500);
  sphere.position[1] = 5 * -Math.cos(scene.time / 500);

  lightSphere2.position = [
    -scene.camera.x,
    -scene.camera.y - 1,
    -scene.camera.z,
  ];
}

/**
 * Attach event listeners to the html elements
 */
function setupInputControls() {
  function handleUniformSlider(event) {
    let val = Number(event.target.value);
    const valEle = document.getElementById(event.target.name + "-value");
    if (valEle) {
      valEle.innerHTML = val;
    }
    rayProgram.uniforms[event.target.name] =
      event.target.type == "checkbox" ? (event.target.checked ? 1 : 0) : val;
  }

  [...document.getElementsByClassName("uniform-slider")].forEach((slider) =>
    slider.addEventListener("input", handleUniformSlider),
  );

  document.getElementById("lightPower").addEventListener("input", (e) => {
    lightSphere.lightPower = e.target.value;
    document.getElementById(e.target.name + "-value").innerText =
      e.target.value;
  });

  document.getElementById("blueGlassIOR").addEventListener("input", (e) => {
    glass.refractiveIndex = e.target.value;
    document.getElementById(e.target.name + "-value").innerText =
      e.target.value;
  });
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
  addRayTracingRenderPass(scene, SHADER_PROGRAM_RAY);
  addMaterials()
  await scene.load();



  initSceneObjects();
  setupInputControls();

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
