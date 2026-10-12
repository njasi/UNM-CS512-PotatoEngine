import SceneObject from "./SceneObject";

import { generateBarrel, generateBomb, generateCannon } from "./compositions";

import {
  generateCone,
  generateCylinder,
  generateGrid,
  generateNGonPrism,
  generateSphere,
  generateFillerColors,
  generateTorus,
} from "./primitives";

/**
 * Quick helper to translate rbga to webgl rgba
 *
 * ie 0-255 => 0-1
 *
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} a
 * @returns
 */
export const rgba = (r, g, b, a = undefined) => [
  r / 255,
  g / 255,
  b / 255,
  a == undefined ? 1 : a,
];

/**
 * Quick helper to translate rbg to webgl rgba
 *
 * ie 0-255 => 0-1
 *
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b
 * @param {Number} a
 * @returns
 */
export const rgb = (r, g, b) => {
  return rgba(r, g, b, 1);
};

/**
 * Parse a hexcode string into rgba to use
 * should be convient when start actually working with
 * color pallets like im supposed to later.
 *
 * @param {string} hexcode
 * @returns
 */
export const hex = (hexcode) => {
  hex = hexcode.replace("#", "");

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  let a = 1;
  if (hex.length == 8) {
    a = parseInt(hex.slice(6, 8), 16);
    a /= 255;
  }

  return rgba(r, g, b, a);
};

/**
 * Helper function that turns a primitive
 * generator into a SceneObject generator
 * @param {function} generatePrimitive
 * @returns {SceneObject}
 */
export function makeSceneObjectGenerator(generatePrimitive) {
  return function genericSceneObjectGenerator(objectName, color = undefined) {
    const prim = generatePrimitive(...[...arguments].slice(2));

    prim.colors =
      prim.colors == undefined || prim.colors.length == 0
        ? generateFillerColors(prim.vertexCount, color, true)
        : prim.colors;

    return new SceneObject(
      objectName,
      new Float32Array(prim.vertices),
      new Float32Array(prim.colors),
      new Uint16Array(prim.indices),
      new Float32Array(prim.normals)
    );
  };
}

/**
 * Generate a cannon object
 *
 * TODO cannon is more complicated since it has parts
 *      unless we make the whole things one part
 * @param {*} name the name of the object
 * @param {*} color the color the object should have
 */
export const generateCannonObject = makeSceneObjectGenerator(generateCannon);

/**
 * Generate a bomb object
 *
 * @param {*} name the name of the object
 * @param {*} color the color the object should have
 */
export const generateBombObject = makeSceneObjectGenerator(generateBomb);

/**
 * Generate a Parametric (kinda) Barrel
 * one cylinder as main body
 *  - the barrel body should be low to get the
 *    look of individual staves for free
 * 4 cylinders for the binding rings
 *
 * @param {*} name the name of the object
 * @param {*} color the color the object should have
 * @param {*} segments how many z-axis divisions there are
 * @param {*} r the radius of the base of the barrel
 * @param {*} h the height of the barrel
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @param {*} bulge the amount of bulge the barrel has
 * @returns
 */
export const generateBarrelObject = makeSceneObjectGenerator(generateBarrel);

/**
 * Generate a cone
 * @param {*} name the name of the object
 * @param {*} color the color the object should have
 * @param {*} segments how many divisions there are
 * @param {*} r the radius of the base of the cone
 * @param {*} h the height of the cone
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @param {*} solid if the bottom of the cone should be closed
 * @returns
 */
export const generateConeObject = makeSceneObjectGenerator(generateCone);

/**
 * Generate a sphere object
 * @param {*} segments how many divisions there are
 * @param {*} r the radius of the sphere
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @returns
 */
export const generateSphereObject = makeSceneObjectGenerator(generateSphere);

/**
 * Generate a "Cylinder" object
 * @param {*} name the name of the object
 * @param {*} color the color the object should have
 * @param {*} segments how many divisions there are
 * @param {*} r radius of the cylinder
 * @param {*} h height of the cylinder
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @param {*} bulge amount of "bulge" the cylinder should have
 * @param {*} solid if false, do not close the ends of the cylinder
 * @param {*} segments_h, how many divisions there are along the z axis
 * @returns
 */
export const generateCylinderObject =
  makeSceneObjectGenerator(generateCylinder);

/**
 * Generate a square grid centered on the origin
 * @param {*} name the name of the object
 * @param {*} color the color the object should have
 * @param {*} segments
 * @param {*} size
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 */
export const generateGridObject = makeSceneObjectGenerator(generateGrid);

/**
 * Generate a n-gon prism
 * @param {*} name the name of the object
 * @param {*} color the color the object should have
 * @param {*} n the amount of sides on the n-gon
 * @param {*} r the radius of the circle the n-gon can be inscribed in
 * @param {*} h the hight of the prism
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @returns
 */
export const generateNGonPrismObject =
  makeSceneObjectGenerator(generateNGonPrism);

/**
 * Generate a torus
 *
 * @param {*} name the name of the object
 * @param {*} color the color the object should have
 * @param {*} segments how many divisions there are
 * @param {*} R the big radius of the torus
 * @param {*} r the radius of the tube part of the torus
 * @param {*} x_c x coord of the center of the torus
 * @param {*} y_c y coord of the center of the torus
 * @param {*} z_c z coord of the center of the torus
 * @returns
 */
export const generateTorusObject = makeSceneObjectGenerator(generateTorus);

/**
 * Calculate the center of mass of an object given its vertices
 * @param {*} vertices
 */
export function calculateCenterOfMass(vertices) {
  // TODO
}
