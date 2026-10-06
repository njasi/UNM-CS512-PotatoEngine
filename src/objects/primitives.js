import PrimitiveObject from "./PrimitiveObject";

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
  
  return PrimitiveObject(vertices, { indices });
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
  const indices = [];

  for (let v = 0; v <= segments; v++) {
    const vRad = (Math.PI * v) / segments;

    const vertZ = z_c + r * Math.cos(vRad);
    for (let u = 0; u <= segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const vertX = x_c + r * Math.sin(vRad) * Math.sin(uRad);
      const vertY = y_c + r * Math.sin(vRad) * Math.cos(uRad);

      vertices.push(vertX, vertY, vertZ, 1);
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
  return PrimitiveObject(vertices, { indices });
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
  const indices = [];

  for (let v = 0; v <= segments; v++) {
    const vFrac = v / segments;

    const vertZ = z_c + vFrac * h;
    for (let u = 0; u <= segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const vertX = x_c + r * (1 - vFrac) * Math.cos(uRad);
      const vertY = y_c + r * (1 - vFrac) * Math.sin(uRad);

      vertices.push(vertX, vertY, vertZ, 1);
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

    for (let u = 0; u < segments; u++) {
      const current = u;
      const next = u + 1;

      indices.push(bottomCenterIndex, next, current);
    }
  }

  // package it for the buffers
  return PrimitiveObject(vertices, { indices });
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
  const indices = [];

  segments_h = segments_h == undefined ? segments : segments_h;

  for (let v = 0; v <= segments_h; v++) {
    const vFrac = v / segments_h;

    const vertZ = z_c - h / 2 + vFrac * h;
    for (let u = 0; u <= segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const bulgeAmt = 1 + bulge * Math.sin(vFrac * Math.PI);

      const vertX = x_c + r * bulgeAmt * Math.cos(uRad);
      const vertY = y_c + r * bulgeAmt * Math.sin(uRad);

      vertices.push(vertX, vertY, vertZ, 1);
    }
  }

  for (let v = 0; v < segments_h; v++) {
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

    vertices.push(x_c, y_c, z_c - h / 2, 1);

    for (let u = 0; u < segments; u++) {
      const current = u;
      const next = u + 1;

      indices.push(bottomCenterIndex, next, current);
    }

    const topCenterIndex = vertices.length / 4;
    vertices.push(x_c, y_c, z_c + h / 2, 1);

    const topStart = segments_h * (segments + 1);

    for (let u = 0; u < segments; u++) {
      const current = topStart + u;
      const next = current + 1;

      indices.push(topCenterIndex, current, next);
    }
  }

  // package it for the buffers
  return PrimitiveObject(vertices, { indices });
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
  const indices = [];

  for (let v = 0; v <= segments; v++) {
    const vRad = (2 * Math.PI * v) / segments;

    const vertZ = z_c + r * Math.sin(vRad);
    for (let u = 0; u <= segments; u++) {
      const uRad = (2 * Math.PI * u) / segments;

      const vertX = x_c + (R + r * Math.cos(vRad)) * Math.cos(uRad);
      const vertY = y_c + (R + r * Math.cos(vRad)) * Math.sin(uRad);

      vertices.push(vertX, vertY, vertZ, 1);
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
  return PrimitiveObject(vertices, { indices });
}

/**
 * Generate a square grid centered on the origin
 * @param {*} segments
 * @param {*} size
 * @param {*} x_c x coord of the center of the cylinder
 * @param {*} y_c y coord of the center of the cylinder
 * @param {*} z_c z coord of the center of the cylinder
 */
export function generateGrid(segments, size, x_c = 0, y_c = 0, z_c = 0) {
  const vertices = [];
  const indices = [];

  // iterate over depth
  for (let z = 0; z <= segments; z++) {
    const vertZ = (z / segments - 0.5) * size + z_c;
    // iterate side to side
    for (let x = 0; x <= segments; x++) {
      const vertX = (x / segments - 0.5) * size + x_c;
      vertices.push(vertX, y_c, vertZ, 1);
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
  return new PrimitiveObject(vertices, { indices });
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
