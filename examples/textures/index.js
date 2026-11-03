import Scene from "../../src/Scene";
import { PhongShaderProgram, Shader } from "../../src/shaders";
import {
  generateConeObject,
  generateCubeObject,
  generateGridObject,
  generateSphereObject,
  generateTorusObject,
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
      "../../src/shaders/vertex/phongTextured.vert",
    ),
  );

  scene.addShader(
    new Shader(
      "phongFragment",
      scene.gl.FRAGMENT_SHADER,
      "../../src/shaders/fragment/phongTextured.frag",
    ),
  );

  scene.addProgram("phong", "basicVertex", "phongFragment", PhongShaderProgram);
}

const colors = {
  white: rgb(255, 255, 255),
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

  const video_tex = new TexturedMaterial("video_tex", {
    [TexturedMaterial.TEXTURE_TYPE_ALBEDO]: { textureLabel: "video" },
  });

  scene.addMaterial(bricks_albedo_only, "phong");
  scene.addMaterial(bricks_bump_only, "phong");
  scene.addMaterial(bricks_normal_only, "phong");
  scene.addMaterial(bricks_bump_albedo, "phong");
  scene.addMaterial(video_tex, "phong");
}

const MAT_CYCLE = [
  "video_tex",
  "bricks_albedo_only",
  "bricks_normal_only",
  "bricks_bump_only",
  "bricks_bump_albedo",
  "flat",
];

/**
 * Add the texture structs to the scene
 */
function addTextures() {
  scene.createTexture("bricks", "./assets/brick.png");
  scene.createTexture("brick2", "./assets/brick2.png");
  scene.createTexture("texture2", "./assets/texture2.jpg");
  if (window.location.host == "localhost:8080") {
    document.getElementById("test-video-texture").src =
      "./assets/hw4-preview.mp4";
  }
  scene.createTexture("video", document.getElementById("test-video-texture"), {
    upload: true,
    animated: true,
  });
}

let texturedObject;
/**
 * Setup the scene
 * @param {string} object which object type to use, cube|sphere
 * @param {string} shader which shader to use
 */
function initSceneObjects(object = "cube", shader = "phong") {
  scene.removeObject("texturedObject");

  switch (object) {
    case "cube":
      texturedObject = generateCubeObject("texturedObject", colors.white);
      break;
    case "cone":
      texturedObject = generateConeObject(
        "texturedObject",
        colors.white,
        32,
        1,
        2,
      );
      break;
    case "torus":
      texturedObject = generateTorusObject(
        "texturedObject",
        colors.white,
        32,
        1,
        0.25,
      );

      break;
    case "sphere":
    default:
      texturedObject = generateSphereObject(
        "texturedObject",
        colors.white,
        32,
        1,
      );
      break;
  }

  texturedObject.materialLabel = "bricks_albedo_only";
  scene.addObject(texturedObject, shader);
  texturedObject.position = [0, 0, 0];
  texturedObject.lightingRadius = 2;
}

function attachListeners() {
  document
    .getElementById("prim-selector")
    .addEventListener("input", (event) => {
      initSceneObjects(event.target.value);
    });
}

/**
 * Update the scene
 * @param {*} dt
 */
function updateScene(dt) {
  texturedObject.rotation[0] += (dt * Math.PI) / 10;
  texturedObject.rotation[1] += (dt * Math.PI) / 10;
  texturedObject.rotation[2] += (dt * Math.PI) / 10;

  texturedObject.materialLabel =
    MAT_CYCLE[Math.floor(scene.time / 2000) % MAT_CYCLE.length];

  scene
    .getMaterial("bricks_bump_only")
    .setTextureExtraUniform(
      TexturedMaterial.TEXTURE_TYPE_BUMP,
      "uBumpScale",
      Math.sin(scene.time / 100) * 10,
    );
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
  addTextures();

  scene.setUpdateCB(updateScene);

  // refactored loading to be less annoying lol
  await scene.load();

  initSceneObjects();

  basicControls.setupMouseControls(scene);
  basicControls.setupKeyboardControls(scene);
  attachListeners();

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
