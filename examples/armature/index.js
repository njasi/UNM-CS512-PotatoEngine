import Scene from "../../src/Scene";
import { PhongShaderProgram } from "../../src/shaders";
import { common } from "../../src/materials";
import Light, { LIGHT_DIRECTIONAL, LIGHT_SPOT } from "../../src/lights/Light";
import { rgb, rgba, hsv, hsvrad } from "../../src/util/color";
import flight from "../../src/controls/flight";
import { Armature } from "../../src/objects/armature";

const scene = new Scene("glcanvas");
scene.camera.move(0, 0, 0);

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

let armature;
/**
 * Setup the basic armature
 */
function initArmatureStructure() {
  armature = new Armature("testArmature");
  const j0 = armature.addJoint("rootJoint", { restPosition: [0, 0, 0] });
  const j1 = armature.addJoint("secondJoint", { restPosition: [0, 1, 0] });
  const j2 = armature.addJoint("thirdJoint", { restPosition: [0, 1, 0] });

  armature.addBone("root-second", { headJointId: j0.id, tailJointId: j1.id });
  armature.addBone("second-third", { headJointId: j1.id, tailJointId: j2.id });
}
initArmatureStructure();

let armatureObject;
/**
 * Setup the scene
 * @param {string} shader which shader to use
 */
function initSceneObjects(shader = "phong") {
  scene.removeObject("armatureObject", { removeChildren: true });

  // TODO setup armature structure
  armatureObject = armature.generateArmatureObject();

  armatureObject.materialLabel = "flat";
  scene.addObject(armatureObject, shader, "flat", { addChildren: true });
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

  armature.getJoint(1).rotation[0] = scene.time / 5000
  armature.getJoint(1).rotation[1] = scene.time / 5000
  armature.getJoint(1).rotation[2] = scene.time / 5000

  // console.log(arma)

  // console.log(armature.getJoint(1).rotation)
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
