import Scene from "../../src/Scene";
import { PhongShaderProgram, Shader } from "../../src/shaders";
import {
  cacheOBJ,
  generateConeObject,
  generateCylinderObject,
  generateGridObject,
  generateNGonPrismObject,
  generateOBJObject,
  generateSphereObject,
  generateTorusObject,
  rgb,
  rgba,
} from "../../src/objects";
import basicControls from "../../src/controls/basic";
import { common } from "../../src/materials";
import Light from "../../src/lights/Light";

const scene = new Scene("glcanvas");
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
    "phongFragment",
    scene.gl.FRAGMENT_SHADER,
    "",
    "/src/shaders/phong.frag",
  ),
);

const colors = {
  Random: undefined,
  Red: rgba(200, 0, 0, 1),
  Green: rgba(0, 200, 0, 1),
  Blue: rgba(0, 0, 200, 1),
  White: rgba(255, 255, 255, 1),
  Gray: rgba(128, 128, 128, 1),
  Black: rgba(0, 0, 0, 1),
  gold: rgb(255, 222, 33),
  glassy: rgb(32, 15, 158),
  wooden: rgb(132, 36, 12),
  plastic: rgb(10, 61, 19),
};

scene.addMaterial(
  common.vertColor("0.8ambient+0.2diffuse+0.2specular"),
  "phong",
);
scene.addMaterial(common.ambientOnly("ambientOnly"), "phong");
scene.addMaterial(common.diffuseOnly("diffuseOnly"), "phong");
scene.addMaterial(common.specularOnly("specularOnly"), "phong");
scene.addMaterial(common.metallic("gold", colors.gold), "phong");
scene.addMaterial(common.glass("glassy", colors.glassy), "phong");
scene.addMaterial(common.wood("wooden", colors.wooden), "phong");
scene.addMaterial(common.plastic("plastic", colors.plastic), "phong");

function setupLight(){
  const l = new Light("whitelight", [0,1000,0])
  scene.addLight(l)
}


let prims = [];
let doPrimSpin = true;
let noneSelected = true;
let prim_angle = 0;
let target_prim_angle = 0;
let prim_spin = 0;
/**
 * Add primitive of all types to test
 */
function initSceneObjects(
  segments = 16,
  color = undefined,
  shader = "basic",
  mat = "0.8ambient+0.2diffuse+0.2specular",
) {
  prims = [];

  scene.removeObject("testCylinder");
  const cyl = generateCylinderObject("testCylinder", color, segments, 1, 1);
  prims.push(cyl);
  scene.addObject(cyl, shader, mat);

  scene.removeObject("testBulgeCylinder");
  const cylBulge = generateCylinderObject(
    "testBulgeCylinder",
    color,
    segments,
    1,
    1,
    0,
    0,
    0,
    0.25,
    true,
    segments,
  );
  prims.push(cylBulge);
  scene.addObject(cylBulge, shader, mat);

  scene.removeObject("testSphere");
  const sphere = generateSphereObject("testSphere", color, segments, 1);
  prims.push(sphere);
  scene.addObject(sphere, shader, mat);

  scene.removeObject("testCone");
  const cone = generateConeObject("testCone", color, segments, 1, 1);
  prims.push(cone);
  scene.addObject(cone, shader, mat);

  scene.removeObject("testGrid");
  const grid = generateGridObject("testGrid", color, segments, 2);
  prims.push(grid);
  scene.addObject(grid, shader, mat);

  scene.removeObject("testHexPrism");
  const prism6 = generateNGonPrismObject("testHexPrism", color, 6, 1, 1);
  prims.push(prism6);
  scene.addObject(prism6, shader, mat);

  scene.removeObject("testQuadPrism");
  const prism4 = generateNGonPrismObject(
    "testQuadPrism",
    color,
    4,
    1,
    Math.sqrt(2),
  );
  prims.push(prism4);
  scene.addObject(prism4, shader, mat);

  scene.removeObject("testTriPrism");
  const prism3 = generateNGonPrismObject("testTriPrism", color, 3, 1, 1);
  prims.push(prism3);
  scene.addObject(prism3, shader, mat);

  scene.removeObject("testTorus");
  const torus = generateTorusObject("testTorus", color, segments, 1, 0.5);
  prims.push(torus);
  scene.addObject(torus, shader, mat);

  scene.removeObject("testTeapot");
  const teapot = generateOBJObject("teapot", color, "teapot");
  teapot.scale = [0.5, 0.5, 0.5];
  prims.push(teapot);
  scene.addObject(teapot, shader, mat);

  // // generateCube
  // scene.addObject(generateConeObject(), "basic");
  // scene.addObject(generateTorusObject(), "basic");
}

/**
 * Rotate the prims according to the selected primitive
 */
function setPrimsPositions() {
  const radius = prims.length;
  for (let i = 0; i < prims.length; i++) {
    const offset = (2 * Math.PI * i) / prims.length;

    prims[i].position[0] = radius * Math.sin(prim_angle + offset);
    prims[i].position[2] = radius * Math.cos(prim_angle + offset) - radius;

    prims[i].rotation[1] = prim_spin * 2 + offset;
    prims[i].rotation[0] = prim_spin * 2 + offset;
  }
}

/**
 * Populatr the primitive selectior html element
 */
function setupPrimSelector() {
  const primSelector = document.getElementById("primSelector");

  primSelector.addEventListener("input", (event) => {
    if (event.target.value == "none") {
      noneSelected = true;
      return;
    }

    noneSelected = false;

    target_prim_angle =
      2 * Math.PI * ((prims.length - event.target.value) / prims.length);
  });

  for (let i = 0; i < prims.length; i++) {
    primSelector.innerHTML += `<option value=${i}>${prims[i].label}</option>`;
  }
}

function setupInputControls() {
  setupPrimSelector();

  let primSegments = 16;
  let primColor = undefined;
  let shader = "basic";
  let mat = "0.8ambient+0.2diffuse+0.2specular";

  document.getElementById("primSpin").addEventListener("input", (event) => {
    doPrimSpin = event.target.checked;
  });

  document.getElementById("segmentRange").addEventListener("input", (event) => {
    primSegments = Number(event.target.value);
    initSceneObjects(primSegments, primColor, shader, mat);
  });

  document
    .getElementById("shaderSelector")
    .addEventListener("input", (event) => {
      shader = event.target.value;
      initSceneObjects(primSegments, primColor, shader, mat);
    });

  const matSel = document.getElementById("matSelector");

  scene.materials.forEach((mat) => {
    matSel.innerHTML += `<option value="${mat.label}">${mat.label}</option>`;
  });

  matSel.addEventListener("input", (event) => {
    mat = event.target.value;
    if (!!colors[mat]) {
      primColor = colors[mat];
      document.getElementById("colorSelector").value = mat;
    }
    initSceneObjects(primSegments, primColor, shader, mat);
  });

  // setup color selector, will be useful for lighting
  const colorSelector = document.getElementById("colorSelector");
  for (const key of Object.keys(colors)) {
    colorSelector.innerHTML += `<option value="${key}">${key}</option>`;
  }
  colorSelector.addEventListener("input", (event) => {
    primColor = colors[event.target.value];
    initSceneObjects(primSegments, primColor, shader, mat);
  });
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
  await scene.loadShaders();
  await cacheOBJ("./utah_teapot.obj", "teapot");

  scene.addProgram("basic", "basicVertex", "basicFragment");
  scene.addProgram("phong", "basicVertex", "phongFragment", PhongShaderProgram);

  scene.loadMaterials();

  setupLight()

  initSceneObjects();
  try {
    setupInputControls();
  } catch (error) {
    console.error(error);
  }

  scene.initBuffers();

  basicControls.setupMouseControls(scene);
  basicControls.setupKeyboardControls(scene);

  setInterval(() => {
    setPrimsPositions();
    if (
      noneSelected ||
      prim_angle + Math.PI / 90 < target_prim_angle ||
      prim_angle - Math.PI / 90 >= target_prim_angle
    ) {
      prim_angle += Math.PI / (noneSelected ? 180 : 90);
      prim_angle %= 2 * Math.PI;
    }

    if (doPrimSpin) {
      prim_spin += Math.PI / 180;
    }
    scene.render();
  }, 30);
}

main();
