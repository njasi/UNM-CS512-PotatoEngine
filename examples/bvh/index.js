import Scene from "../../src/Scene";
import { Shader } from "../../src/shaders";
import { rgba } from "../../src/util/color";
import basicControls from "../../src/controls/basic";
import {
  bandaiNamcoHideTail,
  cacheBVH,
  loadBVH,
  sceneAddBVH,
} from "../../src/objects/loaders";

const scene = new Scene("glcanvas");
scene.camera.move(0, -8, -25);
scene.rotationX += Math.PI / 6;

scene.addShader(
  new Shader(
    "basicVertex",
    scene.gl.VERTEX_SHADER,
    "../../src/shaders/vertex/vertex.vert",
  ),
);

scene.addShader(
  new Shader(
    "basicFragment",
    scene.gl.FRAGMENT_SHADER,
    "../../src/shaders/fragment/fragment.frag",
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
  scene.addProgram("basic", "basicVertex", "basicFragment");

  await scene.load(async () => {
    await cacheBVH("./dance.bvh", "dance");
  });

  const skeleton = bandaiNamcoHideTail(
    loadBVH("dance", 3, 16, rgba(0, 0, 0, 1), "dance"),
  );
  skeleton.scale = [0.1, 0.1, 0.1];

  sceneAddBVH(scene, skeleton, "basic");

  basicControls.setupMouseControls(scene);
  basicControls.setupKeyboardControls(scene);

  setInterval(() => {
    scene.render();
  }, 30);
}

main();
