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

/**
 * Generate a cube prim.
 *
 * - for now none of the options do anything
 *   cause they are boring
 * @param {*} options
 * @param {number} options.x_c x coord center of the cube
 * @param {number} options.y_c y coord center of the cube
 * @param {number} options.z_c z coord center of the cube
 * @param {number} options.l length of cube (z)
 * @param {number} options.w width of cube (x)
 * @param {number} options.h height of cube (y)
 * @returns
 */
export function generateCube({
  x_c = 0,
  y_c = 0,
  z_c = 0,
  l = 1,
  h = 1,
  w = 1,
} = {}) {
  const positions = [
    -1,
    -1,
    1,
    0,
    1,
    -1,
    1,
    0,
    1,
    1,
    1,
    0,
    -1,
    1,
    1,
    0, // front
    1,
    -1,
    -1,
    0,
    -1,
    -1,
    -1,
    0,
    -1,
    1,
    -1,
    0,
    1,
    1,
    -1,
    0, // back
    -1,
    1,
    1,
    0,
    1,
    1,
    1,
    0,
    1,
    1,
    -1,
    0,
    -1,
    1,
    -1,
    0, // top
    -1,
    -1,
    -1,
    0,
    1,
    -1,
    -1,
    0,
    1,
    -1,
    1,
    0,
    -1,
    -1,
    1,
    0, // bottom
    1,
    -1,
    1,
    0,
    1,
    -1,
    -1,
    0,
    1,
    1,
    -1,
    0,
    1,
    1,
    1,
    0, // right
    -1,
    -1,
    -1,
    0,
    -1,
    -1,
    1,
    0,
    -1,
    1,
    1,
    0,
    -1,
    1,
    -1,
    0, // left
  ];

  const faceNormals = [
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
  ];
  const normals = faceNormals.flatMap((n) => [...n, ...n, ...n, ...n]);

  const indices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];

  return new PrimitiveObject(positions, { normals, indices });
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
  return new PrimitiveObject(vertices, { indices, normals });
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
export function generateCone(
  segments,
  r,
  h,
  x_c = 0,
  y_c = 0,
  z_c = 0,
  solid = true,
) {
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

    const capStart = vertices.length / 4;

    for (let u = 0; u < segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;
      vertices.push(x_c + r * Math.cos(uRad), y_c + r * Math.sin(uRad), z_c, 1);
      normals.push(0, 0, -1);
    }

    for (let u = 0; u < segments; u++) {
      const current = capStart + u;
      const next = capStart + ((u + 1) % segments);
      indices.push(bottomCenterIndex, next, current);
    }
  }

  // package it for the buffers
  return new PrimitiveObject(vertices, { indices, normals });
}

/**
 * Generate a n-gon prism
 * @param {*} n the amount of sides on the n-gon
 * @param {*} r the radius of the circle the n-gon can be inscribed in
 * @param {*} h the hight of the prism
 * @param {*} options
 * @param {*} options.x_c x coord of the center of the cylinder
 * @param {*} options.y_c y coord of the center of the cylinder
 * @param {*} options.z_c z coord of the center of the cylinder
 * @returns
 */
export function generateNGonPrism(n, r, h, { x_c = 0, y_c = 0, z_c = 0 } = {}) {
  return generateCylinder(n, r, h, {
    x_c,
    y_c,
    z_c,
    segments_h: 2,
    prism: true,
  });
}

/**
 * Generate a "Cylinder"
 *
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
export function generateCylinder(
  segments,
  r,
  h,
  {
    x_c = 0,
    y_c = 0,
    z_c = 0,
    bulge = 0,
    solid = true,
    segments_h = 2,
    prism = false,
  } = {},
) {
  const vertices = [];
  const normals = [];
  const indices = [];

  segments_h = segments_h == undefined ? segments : segments_h;

  if (prism) {
    // generate 2 verts at once wth the same normals
    // next set of verts overlaps, etc
    // is just the same thing as the normal generation
    for (let v = 0; v < segments_h; v++) {
      const vFrac = v / segments_h;
      const vFrac1 = (v + 1) / segments_h;
      const vertZ0 = z_c - h / 2 + vFrac * h;
      const vertZ1 = z_c - h / 2 + vFrac1 * h;
      const bulgeAmt0 = 1 + bulge * Math.sin(vFrac * Math.PI);
      const bulgeAmt1 = 1 + bulge * Math.sin(vFrac1 * Math.PI);
      const trueRadius0 = bulgeAmt0 * r;
      const trueRadius1 = bulgeAmt1 * r;

      for (let u = 0; u < segments; u++) {
        const uRad0 = (2 * Math.PI * u) / segments;
        const uRad1 = (2 * Math.PI * (u + 1)) / segments;
        const uRadMiddle = (uRad0 + uRad1) / 2;
        const panelStart = vertices.length / 4;

        let dRadius0 = 0;
        let dRadius1 = 0;
        if (h !== 0) {
          dRadius0 = (r * bulge * Math.PI * Math.cos(vFrac * Math.PI)) / h;
          dRadius1 = (r * bulge * Math.PI * Math.cos(vFrac1 * Math.PI)) / h;
        }

        const n0 = normalizeV3(
          Math.cos(uRadMiddle),
          Math.sin(uRadMiddle),
          -dRadius0,
        );
        const n1 = normalizeV3(
          Math.cos(uRadMiddle),
          Math.sin(uRadMiddle),
          -dRadius1,
        );

        for (const [radius, angle, z, normal] of [
          [trueRadius0, uRad0, vertZ0, n0],
          [trueRadius0, uRad1, vertZ0, n0],
          [trueRadius1, uRad0, vertZ1, n1],
          [trueRadius1, uRad1, vertZ1, n1],
        ]) {
          vertices.push(
            x_c + radius * Math.cos(angle),
            y_c + radius * Math.sin(angle),
            z,
            1,
          );
          normals.push(...normal);
        }

        indices.push(
          panelStart,
          panelStart + 1,
          panelStart + 2,
          panelStart + 1,
          panelStart + 3,
          panelStart + 2,
        );
      }
    }
  } else {
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
        normals.push(...normalizeV3(Math.cos(uRad), Math.sin(uRad), -dRadius));
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
    vertices.push(x_c, y_c, z, 1);
    normals.push(0, 0, nz);

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
      const next = capStart + ((u + 1) % segments);

      // are these in the right order for counter clock wise?
      // unsure....
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

  // console.log("vert len:", vertices.length / 4);
  // console.log(
  //   "max indc:",
  //   indices.reduce((prev, curr) => Math.max(prev, curr), 0),
  // );

  // package it for the buffers
  return new PrimitiveObject(vertices, {
    indices,
    normals,
    vertexCount: vertices.length / 4,
  });
}

/**
 * Generate a torus
 *
 * @param {*} segments how many divisions there are
 * @param {*} R the big radius of the torus
 * @param {*} r the radius of the tube part of the torus
 * @param {*} x_c x coord of the center of the torus
 * @param {*} y_c y coord of the center of the torus
 * @param {*} z_c z coord of the center of the torus
 * @returns
 */
export function generateTorus(segments, R, r, x_c = 0, y_c = 0, z_c = 0) {
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
