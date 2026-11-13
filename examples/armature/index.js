import Scene from "../../src/Scene";
import { PhongShaderProgram } from "../../src/shaders";
import { common } from "../../src/materials";
import Light, { LIGHT_DIRECTIONAL, LIGHT_SPOT } from "../../src/lights/Light";
import { rgb, rgba, hsv, hsvrad } from "../../src/util/color";
import flight from "../../src/controls/flight";

const scene = new Scene("glcanvas");
scene.camera.move(0, 0, 0);
scene.rotationX += Math.PI / 6;

/**
 * Add lights to the scene
 */
function addLights() {
  const globalLight = new Light("directionalLight", [0, 0, 0], {
    type: LIGHT_DIRECTIONAL,
    direction: [1, -1, 0],
    intensity: 1,
  });
  const spotLight = new Light("spotLight", [0, 10, 0], {
    type: LIGHT_DIRECTIONAL,
    direction: [0, -1, 0],
    intensity: 1,
  });

  scene.addLight(globalLight);
  scene.addLight(spotLight);
}

/**
 * Create the shader program
 */
function addShaders() {
  scene.createProgram(
    "phong",
    "../../src/shaders/vertex/phongTextured.vert",
    "../../src/shaders/fragment/phongTextured.frag",
    PhongShaderProgram,
  );
}

const colors = {
  white: rgb(255, 255, 255),
  black: rgb(0, 0, 0),
  gold: rgb(255, 222, 33),
  floor: rgb(107, 107, 107),
};

/**
 * Create basic materials
 */
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

let armatureObject;
/**
 * Setup the scene
 * @param {string} object which object type to use, cube|sphere
 * @param {string} shader which shader to use
 */
function initSceneObjects(object = "cube", shader = "phong") {
  scene.removeObject("armatureObject", { removeChildren: true });

  // TODO setup armature structure

  armatureObject = armatureObject.materialLabel = "bricks_albedo_only";
  armatureObject.materialLabelSecondary = selected_secondary_mat;
  scene.addObject(armatureObject, shader);
  armatureObject.position = [0, 0, 0];
  armatureObject.lightingRadius = 10;
}

const cameraCB = flight.setupKeyboardControls(scene);

/**
 * Update the scene
 * @param {*} dt
 */
function updateScene(dt) {
  cameraCB(dt);
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

  scene.setUpdateCB(updateScene);

  // refactored loading to be less annoying lol
  await scene.load();

  initSceneObjects();

  flight.setupMouseControls(scene);

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
