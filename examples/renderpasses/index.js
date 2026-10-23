import Scene from "../../src/Scene";
import { PhongShaderProgram, Shader } from "../../src/shaders";
import {
  generateCubeObject,
  generateGridObject,
  generateSphereObject,
} from "../../src/objects";

import basicControls from "../../src/controls/basic";
import { common } from "../../src/materials";
import Light, { LIGHT_DIRECTIONAL, LIGHT_SPOT } from "../../src/lights/Light";
import { rgb, rgba, hsv, hsvrad } from "../../src/util/color";

const scene = new Scene("glcanvas");
scene.camera.move(0, 0, -10);
scene.rotationX += Math.PI / 6;

const l = new Light("rainbowlight", [0, 5, 5]);
function addLights() {
  l.intensity = 1.5;
  const l2 = new Light("directionalLight", [0, 0, 0], {
    type: LIGHT_DIRECTIONAL,
    direction: [-1, -1, 0],
  });
  const l3 = new Light("whitelight3", [0, 5, 5], {
    type: LIGHT_SPOT,
    direction: [-1, -1, -1],
    intensity: 10,
    spotExponent: 20,
    cutoff: Math.PI / 2,
  });
  scene.addLight(l);
  scene.addLight(l2);
  scene.addLight(l3);
}

function addShaders() {
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
      "phongFragment",
      scene.gl.FRAGMENT_SHADER,
      "",
      "/src/shaders/phong.frag",
    ),
  );
}

const colors = {
  gold: rgb(255, 222, 33),
  floor: rgb(107, 107, 107),
};

function addMaterials() {
  scene.addMaterial(common.vertColor("vertcolors"), "phong");
  scene.addMaterial(
    common.generateMaterial("flat", {
      ka: [0.6, 0.6, 0.6],
      kd: [0.3, 0.3, 0.3],
      ks: [0, 0, 0],
      specularExp: 1,
    }),
    "phong",
  );
  scene.addMaterial(
    common.generateMaterial("glass", {
      ka: [0.1, 0.1, 0.1],
      kd: [0.3, 0.3, 0.3],
      ks: [0.6, 0.6, 0.6],
      specularExp: 64,
      alpha: 0.5,
    }),
    "phong",
  );

  scene.addMaterial(common.ambientOnly("ambientOnly"), "phong");
  scene.addMaterial(common.diffuseOnly("diffuseOnly"), "phong");
  scene.addMaterial(common.specularOnly("specularOnly"), "phong");
  scene.addMaterial(common.metallic("gold", colors.gold), "phong");
}

let prims = [];

function initSceneObjects(
  segments = 32,
  color = colors.gold,
  shader = "phong",
  mat = "gold",
) {
  prims = [];

  scene.removeObject("testCube");
  const cube = generateCubeObject("testCube", color);
  prims.push(cube);
  scene.addObject(cube, shader, mat);
  cube.position = [3, 1, 0];

  scene.removeObject("testSphere");
  const sphere = generateSphereObject("testSphere", color, segments, 1);
  prims.push(sphere);
  scene.addObject(sphere, shader, "glass", { passes: ["transparent"] });
  sphere.position = [-3, 1, 0];

  scene.removeObject("lightPosition");
  const sphere2 = generateSphereObject("lightPosition", color, segments, 0.3);
  prims.push(sphere2);
  scene.addObject(sphere2, shader, "specularOnly", { passes: ["transparent"] });
  sphere2.position = [0, 5, 5];

  scene.removeObject("testGround");
  const ground = generateGridObject(
    "testGround",
    colors.floor,
    segments,
    20,
    0,
    0,
    0,
  );
  prims.push(ground);
  scene.addObject(ground, shader, "flat");
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
  addShaders();
  addMaterials();

  await scene.loadShaders();
  scene.addProgram("phong", "basicVertex", "phongFragment", PhongShaderProgram);

  scene.loadMaterials();
  addLights();

  initSceneObjects();

  scene.initBuffers();

  basicControls.setupMouseControls(scene);
  basicControls.setupKeyboardControls(scene);

  setInterval(() => {
    l.color = hsv(scene.time / 12, 1, 1);
    l.intensity = 6;
    scene.render();
  }, 30);
}

main();
