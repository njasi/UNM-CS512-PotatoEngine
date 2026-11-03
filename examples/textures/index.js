import Scene from "../../src/Scene";
import { PhongShaderProgram, Shader } from "../../src/shaders";
import {
  generateCubeObject,
  generateGridObject,
  generateSphereObject,
} from "../../src/objects";

import basicControls from "../../src/controls/basic";
import { common, TexturedMaterial } from "../../src/materials";
import Light, { LIGHT_DIRECTIONAL, LIGHT_SPOT } from "../../src/lights/Light";
import { rgb, rgba, hsv, hsvrad } from "../../src/util/color";

const scene = new Scene("glcanvas");
scene.camera.move(0, 0, 0);
scene.rotationX += Math.PI / 6;

function addLights() {
  const globalLight = new Light("directionalLight", [0, 0, 0], {
    type: LIGHT_DIRECTIONAL,
    direction: [1, -1, 0],
    intensity: 1,
  });
  scene.addLight(globalLight);
}

function addShaders() {
  scene.addShader(
    new Shader(
      "basicVertex",
      scene.gl.VERTEX_SHADER,
      "../../src/shaders/vertex.vert",
    ),
  );

  scene.addShader(
    new Shader(
      "phongFragment",
      scene.gl.FRAGMENT_SHADER,
      "../../src/shaders/phong.frag",
    ),
  );

  scene.addProgram("phong", "basicVertex", "phongFragment", PhongShaderProgram);
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

  const bricks_albedo_only = new TexturedMaterial("bricks_albedo_only", {
    [TexturedMaterial.TEXTURE_TYPE_ALBEDO]: { textureLabel: "bricks" },
  });

  const bricks_bump_only = new TexturedMaterial("bricks_bump_only", {
    [TexturedMaterial.TEXTURE_TYPE_BUMP]: {
      textureLabel: "texture2",
      extraUniforms: { uBumpScale: 10 },
    },
  });

  const bricks_normal_only = new TexturedMaterial("bricks_normal_only", {
    [TexturedMaterial.TEXTURE_TYPE_NORMAL]: {
      textureLabel: "brick2",
      extraUniforms: { uNormalScale: 1 },
    },
  });

  const bricks_bump_albedo = new TexturedMaterial("bricks_bump_albedo", {
    [TexturedMaterial.TEXTURE_TYPE_ALBEDO]: { textureLabel: "bricks" },
    [TexturedMaterial.TEXTURE_TYPE_BUMP]: {
      textureLabel: "texture2",
      extraUniforms: { uBumpScale: 100 },
    },
  });

  scene.addMaterial(bricks_albedo_only, "phong");
  scene.addMaterial(bricks_bump_only, "phong");
  scene.addMaterial(bricks_normal_only, "phong");
  scene.addMaterial(bricks_bump_albedo, "phong");
}

const MAT_CYCLE = [
  "bricks_albedo_only",
  "bricks_normal_only",
  "bricks_bump_only",
  "bricks_bump_albedo",
  "flat",
];

const cube = generateCubeObject("testCube", colors.gold);

function initSceneObjects(shader = "phong") {
  cube.materialLabel = "bricks_albedo_only";
  scene.addObject(cube, shader);
  cube.position = [0, 0, 0];
  cube.lightingRadius = 2;
}

/**
 * Update the scene
 * @param {*} dt
 */
function updateScene(dt) {
  cube.rotation[0] += (dt * Math.PI) / 10;
  cube.rotation[1] += (dt * Math.PI) / 10;
  cube.rotation[2] += (dt * Math.PI) / 10;

  cube.materialLabel =
    MAT_CYCLE[Math.floor(scene.time / 2000) % MAT_CYCLE.length];
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
  addLights();

  scene.createTexture("bricks", "./assets/brick.png");
  scene.createTexture("brick2", "./assets/brick2.png");
  scene.createTexture("texture2", "./assets/texture2.jpg");

  scene.setUpdateCB(updateScene);

  // refactored loading to be less annoying lol
  await scene.load();

  initSceneObjects();

  basicControls.setupMouseControls(scene);
  basicControls.setupKeyboardControls(scene);

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
