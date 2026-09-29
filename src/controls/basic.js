/**
 * Basic controls for movement based on the provided source from HW3
 */

/**
 * INitalize mouse interactions with the canvas
 * - basically drag calculations let us rotate the scene
 *
 * @param {*} canvas The canvas element
 */
export function setupMouseControls(scene) {
  const canvas = scene.canvas;
  // Mouse and keyboard interactions
  let mouseDown = false,
    lastX,
    lastY;

  canvas.addEventListener("mousedown", (e) => {
    mouseDown = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener("mouseup", () => (mouseDown = false));
  canvas.addEventListener("mouseleave", () => (mouseDown = false));
  canvas.addEventListener("mousemove", (e) => {
    if (!mouseDown) return;
    let dx = e.clientX - lastX;
    let dy = e.clientY - lastY;

    scene.rotationY += dx * 0.01;
    scene.rotationX += dy * 0.01;

    lastX = e.clientX;
    lastY = e.clientY;
  });
}

/**
 * Initalize keyboard controls
 * - w & s to move z
 * - arrows to move x & y
 */
export function setupKeyboardControls(scene) {
  document.addEventListener("keydown", (e) => {
    const step = 0.2;

    switch (e.key) {
      case "ArrowUp":
        scene.camera.move(0, -step, 0);
        break;

      case "ArrowDown":
        scene.camera.move(0, step, 0);
        break;

      case "ArrowLeft":
        scene.camera.move(step, 0, 0);
        break;

      case "ArrowRight":
        scene.camera.move(-step, 0, 0);
        break;

      case "w":
        scene.camera.move(0, 0, step);
        break;

      case "s":
        scene.camera.move(0, 0, -step);
        break;
    }
  });
}

export default {
  setupKeyboardControls,
  setupMouseControls,
};
