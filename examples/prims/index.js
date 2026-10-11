import Scene from "../../src/Scene";
import Shader from "../../src/Shader";
import {
  generateConeObject,
  generateCylinderObject,
  generateGridObject,
  generateNGonPrismObject,
  generateSphereObject,
  generateTorusObject,
  rgba,
} from "../../src/objects";
import basicControls from "../../src/controls/basic";

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

let prims = [];
let doPrimSpin = true;
let noneSelected = true;
let prim_angle = 0;
let target_prim_angle = 0;
let prim_spin = 0;
/**
 * Add primitive of all types to test
 */
function initSceneObjects(segments = 16, color = undefined) {
  console.log(segments);
  console.log(typeof segments);
  prims = [];

  scene.removeObject("testCylinder");
  const cyl = generateCylinderObject("testCylinder", color, segments, 1, 1);
  prims.push(cyl);
  scene.addObject(cyl, "basic");

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
  scene.addObject(cylBulge, "basic");

  scene.removeObject("testSphere");
  const sphere = generateSphereObject("testSphere", color, segments, 1);
  prims.push(sphere);
  scene.addObject(sphere, "basic");

  scene.removeObject("testCone");
  const cone = generateConeObject("testCone", color, segments, 1, 1);
  prims.push(cone);
  scene.addObject(cone, "basic");

  scene.removeObject("testGrid");
  const grid = generateGridObject("testGrid", color, segments, 2);
  prims.push(grid);
  scene.addObject(grid, "basic");

  scene.removeObject("testHexPrism");
  const prism6 = generateNGonPrismObject("testHexPrism", color, 6, 1, 1);
  prims.push(prism6);
  scene.addObject(prism6, "basic");

  scene.removeObject("testQuadPrism");
  const prism4 = generateNGonPrismObject(
    "testQuadPrism",
    color,
    4,
    1,
    Math.sqrt(2),
  );
  prims.push(prism4);
  scene.addObject(prism4, "basic");

  scene.removeObject("testTriPrism");
  const prism3 = generateNGonPrismObject("testTriPrism", color, 3, 1, 1);
  prims.push(prism3);
  scene.addObject(prism3, "basic");

  scene.removeObject("testTorus");
  const torus = generateTorusObject("testTorus", color, segments, 1, 0.5);
  prims.push(torus);
  scene.addObject(torus, "basic");

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

  document.getElementById("primSpin").addEventListener("input", (event) => {
    doPrimSpin = event.target.checked;
  });

  document.getElementById("segmentRange").addEventListener("input", (event) => {
    primSegments = Number(event.target.value);
    initSceneObjects(primSegments, primColor);
  });

  // setup color selector, will be useful for lighting 
  const colors = {
    Random: undefined,
    Red: rgba(200, 0, 0, 1),
    Green: rgba(0, 200, 0, 1),
    Blue: rgba(0, 0, 200, 1),
    White: rgba(255, 255, 255, 1),
    Gray: rgba(128, 128, 128, 1),
    Black: rgba(0, 0, 0, 1),
  };
  const colorSelector = document.getElementById("colorSelector");
  for (const key of Object.keys(colors)) {
    colorSelector.innerHTML += `<option value="${key}">${key}</option>`;
  }
  colorSelector.addEventListener("input", (event) => {
    primColor = colors[event.target.value];
    initSceneObjects(primSegments, primColor);
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
  scene.addProgram("basic", "basicVertex", "basicFragment");

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
