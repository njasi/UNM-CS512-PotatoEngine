/**
 * @module controls/flight
 * @description Flight like controls for camera movement to examine a scene easier
 */

import { Scene } from "..";

/**
 * Initialize mouse interactions with the canvas
 * - basically drag calculations let us rotate the scene
 * - this one is nearly identical to the basic controls except that
 *   it changes yaw and pitch of the camera instead of scene rotation
 *
 * @param {Scene} scene The scene to attach the controls to
 * @param {Object} [options={}]
 * @param {number} [options.sensitivity=0.005]
 */
export function setupMouseControls(scene, { sensitivity = 0.005 } = {}) {
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

    // TODO: yaw and pitch arent perfect since pitch doesnt always make you look
    //       downwards, as it depends on your yaw alignment. i dont really want to
    //       do that math rn but it should actually be a simple correction
    scene.camera.rotate(dx * sensitivity, dy * sensitivity);

    lastX = e.clientX;
    lastY = e.clientY;
  });
}

/**
 * Setup smooth flight keyboard controls.
 *
 * Attach the returned function to the scene's updateCB or call it
 * in the update function + pass it the dt in seconds
 *
 * @param {Scene} scene
 * @param {Object} [options={}]
 * @param {number} [options.speed=5]
 * @param {number} [options.response=0.15]
 * @returns {Function}
 */
export function setupKeyboardControls(
  scene,
  { speed = 5, response = 0.15 } = {},
) {
  const pressed = new Set();
  const velocity = [0, 0, 0];
  let orthographic = false;

  function normalizeKey(key) {
    return key === " " ? key : key.toLowerCase();
  }

  const handledKeys = new Set([
    "w",
    "a",
    "s",
    "d",
    " ",
    "shift",
    "alt",
    "0",
    "-",
    "=",
    "o",
    "p",
  ]);

  /**
   * key down listener, add key to set
   * @param {*} event
   */
  function handleKeyDown(event) {
    const key = normalizeKey(event.key);

    if (key == "o") {
      orthographic = true;
    } else if (key == "p") {
      orthographic = false;
    }

    if (!handledKeys.has(key)) return;
    event.preventDefault();
    pressed.add(key);
  }

  /**
   * key up listener, remove key from set
   * @param {*} event
   */
  function handleKeyUp(event) {
    const key = normalizeKey(event.key);
    if (!handledKeys.has(key)) return;
    event.preventDefault();
    pressed.delete(key);
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  window.addEventListener("blur", () => {
    pressed.clear();
  });

  /**
   * Smooth movement update function, call this in your scene update handler
   * @param {number} dt time in seconds since last frame
   */
  function moveCameraUpdate(dt) {
    if (pressed.has("0")) {
      scene.camera.fov = Math.PI / 4;
      scene.camera.usePerspective();
    }

    dt = Math.min(Math.max(dt, 0), 0.05);

    const yaw = scene.camera.yaw ?? 0;

    const zoom = Number(pressed.has("=")) - Number(pressed.has("-"));
    const strafe = Number(pressed.has("a")) - Number(pressed.has("d"));
    const forward = Number(pressed.has("w")) - Number(pressed.has("s"));
    const vertical = Number(pressed.has("shift")) - Number(pressed.has(" "));

    // transform with yaw so movement makes logical sense
    let x = strafe * Math.cos(yaw) + forward * Math.sin(yaw);
    let y = vertical;
    let z = -strafe * Math.sin(yaw) + forward * Math.cos(yaw);


    let adjustedSpeed = pressed.has("alt") ? speed * 2 : speed;
    const target = [x * adjustedSpeed, y * adjustedSpeed, z * adjustedSpeed];
    const expSmoothing = 1 - Math.exp(-dt / response);

    for (let i = 0; i < 3; i++) {
      velocity[i] += (target[i] - velocity[i]) * expSmoothing;
    }

    scene.camera.move(velocity[0] * dt, velocity[1] * dt, velocity[2] * dt);
    scene.camera.fov += dt * zoom;
    if (orthographic) {
      scene.camera.useOrthographic();
    } else {
      scene.camera.usePerspective();
    }
  }

  return moveCameraUpdate;
}

export default {
  setupKeyboardControls,
  setupMouseControls,
};
