import Scene from "../../src/Scene";
import Shader from "../../src/Shader";
import {
  bandaiNamcoHideTail,
  cacheBVH,
  loadBVH,
  rgba,
  sceneAddBVH,
} from "../../src/objects";
import basicControls from "../../src/controls/basic";

const scene = new Scene("glcanvas");
scene.camera.move(0, -8, -25);
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

/**
 * Main init function
 * - load the scene shaders
 * - init all objects
 * - initialize buffers
 * - attach keyboard, mouse, input listeners
 * - start animation loop
 */
async function main() {
  // try bvh from https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset
  await cacheBVH("./dance.bvh", "dance");

  await scene.loadShaders();
  scene.addProgram("basic", "basicVertex", "basicFragment");

  const skeleton = bandaiNamcoHideTail(
    loadBVH("dance", 3, 16, rgba(0, 0, 0, 1), "dance"),
  );
  skeleton.scale = [0.1, 0.1, 0.1];

  sceneAddBVH(scene, skeleton, "basic");
  scene.initBuffers();

  basicControls.setupMouseControls(scene);
  basicControls.setupKeyboardControls(scene);

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
