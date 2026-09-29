// TODO generate shapes from a composition of primitives

// raft
// bunch of cylinders horizontally as body
// rectangular prisms perpendicular to body logs as bindings?
// one cylinder mast
// one cylinder or prism crossbar
// rectangular prism sail

import {
  mat4Identity,
  mat4RotateX,
  mat4RotateY,
  mat4Translate,
  matMul,
  transformPrimitive,
  transformVertices,
} from "../transformations";
import { rgba } from "./helpers";
import {
  generateCylinder,
  generateFillerColors,
  generateSphere,
  generateTorus,
} from "./primitives";

/**
 * Combine vert & ind lists together
 */
export function combineParts(verts, inds, colors = undefined) {
  const resultVerts = [];
  const resultInds = [];
  const resultColors = [];

  for (let i = 0; i < verts.length; i++) {
    resultInds.push(...inds[i].map((ind) => ind + resultVerts.length / 4));
    resultVerts.push(...verts[i]);
    if (!!colors) {
      // if the prim already had color array we should use it
      if (!!colors[i] && Array.isArray(colors[i]) && colors[i].length > 4) {
        resultColors.push(...colors[i]);
        continue;
      }
      resultColors.push(
        ...generateFillerColors(verts[i].length / 4, colors[i]),
      );
    }
  }

  return [resultVerts, resultInds, resultColors];
}

/**
 * Higher level of combine, take the primitive dicts so can be cleaner
 *
 * if colors or colors[i] is undefined try to use color in prim[i]
 *
 * @param {*} prims list of primitives to combine
 * @param {*} colors colors to use for each primitive
 */
export function combine(prims, colors) {
  const verts = [];
  const inds = [];
  const cols = [];

  for (let i = 0; i < prims.length; i++) {
    verts.push(prims[i].vertices);
    inds.push(prims[i].indices);
    cols.push(!colors || !colors[i] ? prims[i].colors : colors[i]);
  }

  const [v, i, c] = combineParts(verts, inds, cols);

  return {
    indices: i,
    vertices: v,
    colors: c,
    vertexCount: v.length / 4,
  };
}

/**
 * Generate a Parametric (kinda) Barrel
 * one cylinder as main body
 *  - the barrel body should be low to get the
 *    look of individual staves for free
 * 4 cylinders for the binding rings
 *
 * @param {*} segments
 * @param {*} r
 * @param {*} h
 * @param {*} x_c
 * @param {*} y_c
 * @param {*} z_c
 * @param {*} bulge
 * @returns
 */
export function generateBarrel(
  segments,
  r,
  h,
  x_c,
  y_c,
  z_c,
  bulge = 0.4,
  staves = 10,
) {
  let body = generateCylinder(
    staves,
    r,
    h,
    x_c,
    y_c,
    z_c,
    bulge,
    true,
    segments,
  );
  body.colors = generateFillerColors(
    body.vertexCount,
    rgba(150, 111, 51, 1),
    true,
  );

  const bracePositions = [-0.449, -0.2, 0.2, 0.449];

  for (let i = 0; i < bracePositions.length; i++) {
    const brace_z = z_c + bracePositions[i] * h;
    const brace_r_angle = Math.PI * (bracePositions[i] + 0.5);

    const brace = generateCylinder(
      staves,
      r + r * (bulge + 0.07) * Math.sin(brace_r_angle),
      0.1 * h,
      x_c,
      y_c,
      brace_z,
      0,
      true,
      2,
    );

    body = combine([body, brace], [undefined, rgba(51, 51, 51, 1)]);
  }

  return body;
}

/**
 * Generate a spoked wheel
 * @param {*} segments
 * @param {*} R
 * @param {*} r
 * @param {*} spokeCount
 * @param {*} x_c
 * @param {*} y_c
 * @param {*} z_c
 * @returns
 */
export function generateWheel(segments, R, r, spokeCount, x_c, y_c, z_c) {
  const rim = generateTorus(segments, R, r, x_c, y_c, z_c);

  let spokes = {
    vertices: [],
    indices: [],
  };

  for (let i = 0; i < spokeCount; i++) {
    // TODO wtf is goin on here with the transformations
    // why does setting z_c make the cylinders fly in every direction
    let spoketmp = generateCylinder(
      segments,
      r / 2,
      R * 2,
      -z_c,
      y_c,
      0, //z_c
      0,
      false,
      2,
    );

    // rotate the spoke
    const id = mat4Identity();
    const ry = mat4RotateY(id, Math.PI / 2);
    const rx = mat4RotateX(id, (Math.PI * i) / spokeCount);

    const M = matMul(ry, rx);
    spoketmp = transformPrimitive(spoketmp, M);

    spokes = combine([spokes, spoketmp]);
  }

  const wheel = combine([rim, spokes]);
  return wheel;
}

/**
 * Generate a cannon object
 */
export function generateCannon(barrelLength = 3) {
  // generate all the individual parts
  const shaft = generateCylinder(
    20,
    1,
    barrelLength,
    0,
    0,
    -barrelLength / 2,
    0,
    true,
    2,
  );
  const end = generateSphere(20, 1, 0, 0, 0);
  let fuseHolder = generateCylinder(16, 0.2, 0.2);
  let fuse = generateCylinder(10, 0.1, 0.4);
  let axel = generateCylinder(16, 0.15, 2.5);
  const wheel1 = generateWheel(40, 1.15, 0.15, 4, 0, 0, -1.15);
  const wheel2 = generateWheel(40, 1.15, 0.15, 4, 0, 0, 1.15);

  let wheels = combine([wheel1, wheel2]);

  // transformations to place the parts
  const id = mat4Identity();
  const wheelRot = mat4RotateY(id, Math.PI / 2);

  const fuseRot = mat4RotateX(id, Math.PI / 2);
  const fuseTrans = mat4Translate(id, [0, 1, 0]);
  const fuseM = matMul(fuseTrans, fuseRot);

  fuse = transformPrimitive(fuse, fuseM);
  fuseHolder = transformPrimitive(fuseHolder, fuseM);
  wheels = transformPrimitive(wheels, wheelRot);
  axel = transformPrimitive(axel, wheelRot);

  // combine the things all together now
  const cannon = combine(
    [shaft, end, axel, fuse, fuseHolder, wheels],
    [
      rgba(34, 34, 34, 1),
      rgba(34, 34, 34, 1),
      rgba(34, 34, 34, 1),
      rgba(150, 111, 51, 1),
      rgba(124, 124, 124, 1),
      rgba(150, 111, 51, 1),
    ],
  );

  return cannon;
}

/**
 * Generate a simple bomb
 * @returns
 */
export function generateBomb(r) {
  const body = generateSphere(20, r, 0, 0, 0);
  let fuseHolder = generateCylinder(16, r / 5, r / 5);
  let fuse = generateCylinder(10, r / 10, r / 2.5);

  // transformations to place the parts
  const id = mat4Identity();

  const fuseRot = mat4RotateX(id, Math.PI / 2);
  const fuseTrans = mat4Translate(id, [0, r, 0]);
  const fuseM = matMul(fuseTrans, fuseRot);

  fuse = transformPrimitive(fuse, fuseM);
  fuseHolder = transformPrimitive(fuseHolder, fuseM);

  // combine the things all together now
  const bomb = combine(
    [body, fuse, fuseHolder],
    [rgba(34, 34, 34, 1), rgba(150, 111, 51, 1), rgba(124, 124, 124, 1)],
  );

  return bomb;
}
