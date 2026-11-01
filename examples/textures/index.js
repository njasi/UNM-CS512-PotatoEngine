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

function addLights() {
  const globalLight = new Light("directionalLight", [0, 0, 0], {
    type: LIGHT_DIRECTIONAL,
    direction: [1, -1, 0],
    intensity: 1,
  });
  const globalLight2 = new Light("directionalLight2", [0, 0, 0], {
    type: LIGHT_DIRECTIONAL,
    direction: [-1, -1, -1],
    intensity: 1,
  });
  scene.addLight(globalLight);
  scene.addLight(globalLight2);
}

function addShaders() {
  scene.addShader(
    new Shader(
      "basicVertex",
      scene.gl.VERTEX_SHADER,
      "/src/shaders/vertex.vert",
    ),
  );

  scene.addShader(
    new Shader(
      "phongFragment",
      scene.gl.FRAGMENT_SHADER,
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
  scene.addObject(sphere, shader, "glass", {
    passes: ["transparent"],
    addChildren: true,
  });
  sphere.position = [-3, 1, 0];

  sphere.lightingRadius = 1;
  cube.lightingRadius = 2;
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
  scene.createTexture("bricks", "./assets/brick.png");
  scene.createTexture("texture2", "./assets/texture2.jpg");
  scene.addProgram("phong", "basicVertex", "phongFragment", PhongShaderProgram);

  // refactored loading to be less annoying lol
  await scene.load();

  addLights();

  initSceneObjects();

  basicControls.setupMouseControls(scene);
  basicControls.setupKeyboardControls(scene);

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
