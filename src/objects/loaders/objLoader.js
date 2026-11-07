/**
 * @module objects/loaders/objLoader
 * @description
 * simple setup to allow loading an obj file:
 * https://en.wikipedia.org/wiki/Wavefront_.obj_file
 */
import { makeSceneObjectGenerator } from "../helpers";
import PrimitiveObject from "../PrimitiveObject";

// TODO probably do something more reasonable than this
const LOADED_OBJECTS = {};

const toNum = (x) => parseFloat(x);

/**
 * Parse an .obj file into the cache by url
 *
 * Note that this currently assumes the faces are already triangulated
 *
 * @param {string} url source url to load the obj from
 * @param {string} id id to reference the cached object by later
 * @param {Object} [options={}]
 * @param {boolean} [options.calculateNormals=true]
 */
export async function cacheOBJ(url, id, { calculateNormals = true } = {}) {
  const response = await fetch(url);
  const text = await response.text();

  const vertices = [];
  let normals = [];
  const indices = [];
  const texCoords = [];
  const tangents = [];

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // split on whitespace
    const data = line.trim().split(/\s+/);
    const type = data[0];

    switch (type) {
      case "v":
        vertices.push(...data.slice(1, 4).map(toNum), 0);
        // just filler tangents, not sure thats information in an obj file and i
        // dont really want to look and or calculate it rn
        tangents.push(0, 0, 0);
        break;

      case "vn":
        normals.push(...data.slice(1, 4).map(toNum));
        break;

      case "vt":
        texCoords.push(...data.slice(1, 3).map(toNum));
        break;

      case "f":
        // assume faces are already triangulated
        const faceVerts = data.slice(1);
        for (let j = 0; j < faceVerts.length; j++) {
          const [positionIdx, _, normalIdx] = faceVerts[j]
            .split("/")
            .map(toNum);
          indices.push(positionIdx - 1);
        }
        break;
    }
  }

  if (calculateNormals) {
    normals = calculateVertexNormals(vertices, indices);
  }

  // slap into loaded objects so we dont need to reload them ever
  // would make sense to have the scene handle these tbh
  LOADED_OBJECTS[id] = {
    vertices,
    indices,
    normals,
    texCoords,
    tangents,
  };
}

/**
 * calculate vertex normals for the given triangulated geometry.
 *
 * this is incorrct for the most part, as it will basically smooth shade the object,
 * but this is the backup method so dont worrrrry about it
 *
 */
function calculateVertexNormals(vertices, indices) {
  const normals = new Array((vertices.length / 4) * 3).fill(0);

  for (let i = 0; i + 2 < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];

    const abx = vertices[b * 4] - vertices[a * 4];
    const aby = vertices[b * 4 + 1] - vertices[a * 4 + 1];
    const abz = vertices[b * 4 + 2] - vertices[a * 4 + 2];

    const acx = vertices[c * 4] - vertices[a * 4];
    const acy = vertices[c * 4 + 1] - vertices[a * 4 + 1];
    const acz = vertices[c * 4 + 2] - vertices[a * 4 + 2];

    // cross prod,,,,  should really make a standard vec 3 file with things like this
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    for (const vertexIndex of [a, b, c]) {
      const normalOffset = vertexIndex * 3;
      normals[normalOffset] += nx;
      normals[normalOffset + 1] += ny;
      normals[normalOffset + 2] += nz;
    }
  }

  // normalize... again vec3 util file would be nice
  // although the vec4 normalize might work anyway.
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);

    if (length > 0) {
      normals[i] /= length;
      normals[i + 1] /= length;
      normals[i + 2] /= length;
    }
  }

  return normals;
}

/**
 * Load an object from the cache by id
 * @param {string} id of the cached object file
 * @returns {PrimitiveObject}
 */
export function loadOBJ(id) {
  const { vertices, indices, normals, texCoords, tangents } = structuredClone(
    LOADED_OBJECTS[id],
  );
  return new PrimitiveObject(vertices, {
    normals,
    indices,
    texCoords,
    tangents,
  });
}

/**
 * Load a cached obj file into a scene object
 * @param {string} label label of the new object
 * @param {rgb()} color color to use
 * @param {string} id id of the cached object file
 * @returns {SceneObject}
 */
export const generateOBJObject = makeSceneObjectGenerator(loadOBJ);
