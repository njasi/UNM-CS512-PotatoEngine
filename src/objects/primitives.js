import PrimitiveObject from "./PrimitiveObject";

/**
 * Helper to normalize a vector
 * @param {*} x
 * @param {*} y
 * @param {*} z
 * @returns
 */
function normalizeV3(x, y, z) {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}

export function generateCube() {
  // cube
  const positions = [
    -1,
    -1,
    -1, // 0
    1,
    1,
    -1,
    -1, // 1
    1,
    1,
    1,
    -1, // 2
    1,
    -1,
    1,
    -1, // 3
    1,
    -1,
    -1,
    1, // 4
    1,
    1,
    -1,
    1, // 5
    1,
    1,
    1,
    1, // 6
    1,
    -1,
    1,
    1, // 7
    1,
  ];

  // faces
  const indices = [
    // Front
    4, 5, 6, 4, 6, 7,
    // Back
    1, 0, 3, 1, 3, 2,
    // Top
    3, 7, 6, 3, 6, 2,
    // Bottom
    0, 1, 5, 0, 5, 4,
    // Right
    1, 2, 6, 1, 6, 5,
    // Left
    0, 4, 7, 0, 7, 3,
  ];

  // sharp normals on cube will be annoying come back to this
  return new PrimitiveObject(positions, { indices });
}

/**
 * Generate a sphere
 * @param {*} segments how many divisions there are
 * @param {*} r the radius of the sphere
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @returns
 */
export function generateSphere(segments, r, x_c = 0, y_c = 0, z_c = 0) {
  const vertices = [];
  const normals = [];
  const indices = [];

  for (let v = 0; v <= segments; v++) {
    const vRad = (Math.PI * v) / segments;

    const vertZ = z_c + r * Math.cos(vRad);
    for (let u = 0; u <= segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const vertX = x_c + r * Math.sin(vRad) * Math.sin(uRad);
      const vertY = y_c + r * Math.sin(vRad) * Math.cos(uRad);
      vertices.push(vertX, vertY, vertZ, 1);

      const nx = Math.sin(vRad) * Math.sin(uRad);
      const ny = Math.sin(vRad) * Math.cos(uRad);
      const nz = Math.cos(vRad);
      normals.push(nx, ny, nz);
    }
  }

  for (let v = 0; v < segments; v++) {
    for (let u = 0; u < segments; u++) {
      const i_0 = v * (segments + 1) + u;
      const i_1 = i_0 + 1;
      const i_2 = i_0 + segments + 1;
      const i_3 = i_2 + 1;

      // push the two triangle faces
      indices.push(i_0, i_2, i_1, i_1, i_2, i_3);
    }
  }

  // package it for the buffers
  return new PrimitiveObject(vertices, { indices });
}

/**
 * Generate a cone
 * @param {*} segments how many divisions there are
 * @param {*} r the radius of the base of the cone
 * @param {*} h the hright of the cone
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @param {*} solid if the bottom of the cone should be closed
 * @returns
 */
export function generateCone(segments, r, h, x_c, y_c, z_c, solid = true) {
  const vertices = [];
  const normals = [];
  const indices = [];

  for (let v = 0; v <= segments; v++) {
    const vFrac = v / segments;

    const vertZ = z_c + vFrac * h;
    for (let u = 0; u <= segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const vertX = x_c + r * (1 - vFrac) * Math.cos(uRad);
      const vertY = y_c + r * (1 - vFrac) * Math.sin(uRad);
      vertices.push(vertX, vertY, vertZ, 1);

      const nx = (h * Math.cos(uRad)) / (h * h + r * r);
      const ny = (h * Math.sin(uRad)) / (h * h + r * r);
      const nz = r / (h * h + r * r);
      normals.push(nx, ny, nz);
    }
  }

  for (let v = 0; v < segments; v++) {
    for (let u = 0; u < segments; u++) {
      const i_0 = v * (segments + 1) + u;
      const i_1 = i_0 + 1;
      const i_2 = i_0 + segments + 1;
      const i_3 = i_2 + 1;

      // push the two triangle faces
      indices.push(i_0, i_2, i_1, i_1, i_2, i_3);
    }
  }

  if (solid) {
    const bottomCenterIndex = vertices.length / 4;

    vertices.push(x_c, y_c, z_c, 1);
    normals.push(0, 0, -1);

    for (let u = 0; u < segments; u++) {
      const current = u;
      const next = u + 1;

      indices.push(bottomCenterIndex, next, current);
    }
  }

  // package it for the buffers
  return new PrimitiveObject(vertices, { indices });
}

/**
 * Generate a n-gon prism
 * @param {*} n the amount of sides on the n-gon
 * @param {*} r the radius of the circle the n-gon can be inscribed in
 * @param {*} h the hight of the prism
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @returns
 */
export function generateNGonPrism(n, r, h, x_c, y_c, z_c) {
  return generateCylinder(n, r, h, x_c, y_c, z_c, 0, true, 2);
}

/**
 * Generate a "Cylinder"
 *
 * @param {*} segments how many divisions there are
 * @param {*} r radius of the cylinder
 * @param {*} h height of the cylinder
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 * @param {*} bulge amount of "bulge" the cylinder should have
 * @param {*} solid if false, do not close the ends of the cylinder
 * @param {*} segments_h default 2 how many divisions there are along the z axis
 * @returns
 */
export function generateCylinder(
  segments,
  r,
  h,
  x_c = 0,
  y_c = 0,
  z_c = 0,
  bulge = 0,
  solid = true,
  segments_h = 2,
) {
  const vertices = [];
  const normals = [];
  const indices = [];

  segments_h = segments_h == undefined ? segments : segments_h;

  for (let v = 0; v <= segments_h; v++) {
    const vFrac = v / segments_h;
    const vertZ = z_c - h / 2 + vFrac * h;
    const bulgeAmt = 1 + bulge * Math.sin(vFrac * Math.PI);

    const trueRadius = r * bulgeAmt;

    let dRadius = 0;
    if (h !== 0) {
      dRadius = (r * bulge * Math.PI * Math.cos(vFrac * Math.PI)) / h;
    }

    for (let u = 0; u <= segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const vertX = x_c + trueRadius * Math.cos(uRad);
      const vertY = y_c + trueRadius * Math.sin(uRad);

      vertices.push(vertX, vertY, vertZ, 1);

      // NOTE: unsure if dRadius should be - or + based on this winding order
      normals.push(...normalizeV3(Math.cos(uRad), Math.sin(uRad), dRadius));
    }
  }

  for (let v = 0; v < segments_h; v++) {
    for (let u = 0; u < segments; u++) {
      const i_0 = v * (segments + 1) + u;
      const i_1 = i_0 + 1;
      const i_2 = i_0 + segments + 1;
      const i_3 = i_2 + 1;

      // fixed to counter clockwise winding
      // push the two triangle faces
      indices.push(i_0, i_1, i_2, i_1, i_3, i_2);
    }
  }

  /**
   * Helper function to generate the cap since its getting
   * complicated...
   *
   * TODO how to handle the sharp angles from top
   *      & bottom cap? extra verts?
   *      - extra verts at same positon as bottom top ring, inbetween center
   *        vert and the side verts
   * @param {*} z z value to use
   * @param {*} nz normal value to use for the entire cap
   * @param {*} top
   */
  function generateCap(z, nz, top) {
    const centerIndex = vertices.length / 4;
    vertices.push(x_c, y_c, z_c - h / 2, 1);

    const capStart = vertices.length / 4;
    for (let u = 0; u < segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const vertX = x_c + r * Math.cos(uRad);
      const vertY = y_c + r * Math.sin(uRad);

      vertices.push(vertX, vertY, z, 1);
      normals.push(0, 0, nz);
    }

    for (let u = 0; u < segments; u++) {
      let current = capStart + u;
      const next = current + 1;

      if (top) {
        indices.push(centerIndex, next, current);
      } else {
        indices.push(centerIndex, current, next);
      }
    }
  }

  if (solid) {
    generateCap(z_c - h / 2, -1, true);
    generateCap(z_c + h / 2, 1, false);
  }

  // package it for the buffers
  return new PrimitiveObject(vertices, { indices, normals });
}

/**
 * Generate a torus
 * 
 * 
 * Torus/Donut
  x = (R + r cos v)cos u
  y = (R + r cos v)sin u
  z = r sin v
 * @param {*} segments how many divisions there are
 * @param {*} r the radius of the sphere
 * @param {*} x_c x coord of the center of the torus
 * @param {*} y_c y coord of the center of the torus
 * @param {*} z_c z coord of the center of the torus
 * @returns
 */
export function generateTorus(segments, R, r, x_c, y_c, z_c) {
  const vertices = [];
  const normals = [];
  const indices = [];

  for (let v = 0; v <= segments; v++) {
    const vRad = (2 * Math.PI * v) / segments;

    const vertZ = z_c + r * Math.sin(vRad);
    for (let u = 0; u <= segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const vertX = x_c + (R + r * Math.cos(vRad)) * Math.cos(uRad);
      const vertY = y_c + (R + r * Math.cos(vRad)) * Math.sin(uRad);
      vertices.push(vertX, vertY, vertZ, 1);

      const nx = Math.cos(vRad) * Math.cos(uRad);
      const ny = Math.cos(vRad) * Math.sin(uRad);
      const nz = Math.sin(vRad);
      normals.push(nx, ny, nz);
    }
  }

  for (let v = 0; v < segments; v++) {
    for (let u = 0; u < segments; u++) {
      const i_0 = v * (segments + 1) + u;
      const i_1 = i_0 + 1;
      const i_2 = i_0 + segments + 1;
      const i_3 = i_2 + 1;

      // push the two triangle faces
      indices.push(i_0, i_2, i_1, i_1, i_2, i_3);
    }
  }

  // package it for the buffers
  return new PrimitiveObject(vertices, { indices, normals });
}

/**
 * Generate a square grid centered on the origin
 * @param {*} segments
 * @param {*} size
 * @param {*} x_c x coord of the center of the grid
 * @param {*} y_c y coord of the center of the grid
 * @param {*} z_c z coord of the center of the grid
 */
export function generateGrid(segments, size, x_c = 0, y_c = 0, z_c = 0) {
  const vertices = [];
  const normals = [];
  const indices = [];

  // iterate over depth
  for (let z = 0; z <= segments; z++) {
    const vertZ = (z / segments - 0.5) * size + z_c;
    // iterate side to side
    for (let x = 0; x <= segments; x++) {
      const vertX = (x / segments - 0.5) * size + x_c;
      vertices.push(vertX, y_c, vertZ, 1);
      normals.push(0, 1, 0);
    }
  }

  // create face indices
  for (let z = 0; z < segments; z++) {
    for (let x = 0; x < segments; x++) {
      const i_0 = z * (segments + 1) + x;
      // shift relative to first point to select the other nearby points
      const i_1 = i_0 + 1;
      // shift all the way to the next row of points
      const i_2 = i_0 + segments + 1;
      const i_3 = i_2 + 1;

      // push the two triangle faces
      indices.push(i_0, i_2, i_1, i_1, i_2, i_3);
    }
  }

  // package it for the buffers
  return new PrimitiveObject(vertices, { indices, normals });
}

/**
 * Generate a filler color array for an object
 * @param {*} vertCount
 * @param {*} color
 * @param {*} alpha
 * @returns number array of colors
 */
export function generateFillerColors(
  vertCount,
  color = undefined,
  alpha = true,
) {
  const colors = [];

  for (let i = 0; i < vertCount; i++) {
    if (color != undefined) {
      colors.push(...color);
      continue;
    }

    // if no color defined just make a random one.
    colors.push(Math.random(), Math.random(), Math.random());
    if (alpha) {
      colors.push(1);
    }
  }

  return colors;
}
