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
  generateCube,
} from "./primitives";

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
      new Float32Array(prim.normals),
    );
  };
}

/**
 * Generate a cannon object
 *
 * TODO cannon is more complicated since it has parts
 *      unless we make the whole things one part
 * @param {string} name the name of the object
 * @param {*} color the color the object should have
 */
export const generateCannonObject = makeSceneObjectGenerator(generateCannon);

/**
 * Generate a bomb object
 *
 * @param {string} name the name of the object
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
 * @param {string} name the name of the object
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
 * @param {string} name the name of the object
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
 * @param {string} name the name of the object
 * @param {*} color the color the object should have
 * @param {*} segments how many divisions there are
 * @param {*} r radius of the cylinder
 * @param {*} h height of the cylinder
 * @param {*} options
 * @param {*} options.x_c x coord of the center of the cylinder
 * @param {*} options.y_c y coord of the center of the cylinder
 * @param {*} options.z_c z coord of the center of the cylinder
 * @param {*} options.bulge amount of "bulge" the cylinder should have
 * @param {*} options.solid if false, do not close the ends of the cylinder
 * @param {*} options.segments_h default 2 how many divisions there are along the z axis
 * @param {*} options.prism, if true make the vertical segments have distinct normals from eachother
 * @returns
 */
export const generateCylinderObject =
  makeSceneObjectGenerator(generateCylinder);

/**
 * Generate a square grid centered on the origin
 * @param {string} name the name of the object
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
 * @param {string} name the name of the object
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
 * @param {string} name the name of the object
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
 * Generate a cube scene object.
 *
 * - for now none of the options do anything
 *   cause they are boring
 * @param {string} name the name of the object
 * @param {*} color the color the object should have
 * @param {*} options
 * @param {number} options.x_c x coord center of the cube
 * @param {number} options.y_c y coord center of the cube
 * @param {number} options.z_c z coord center of the cube
 * @param {number} options.l length of cube (z)
 * @param {number} options.w width of cube (x)
 * @param {number} options.h height of cube (y)
 * @returns
 */
export const generateCubeObject = makeSceneObjectGenerator(generateCube);

/**
 * Calculate the center of mass of an object given its vertices
 * @param {*} vertices
 */
export function calculateCenterOfMass(vertices) {
  // TODO
}
