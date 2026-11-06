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
 */
export async function cacheOBJ(url, id) {
  const response = await fetch(url);
  const text = await response.text();

  const vertices = [];
  const normals = [];
  const indices = [];
  const texCoords = [];

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // split on whitespace
    const data = line.trim().split(/\s+/);
    const type = data[0];

    switch (type) {
      case "v":
        vertices.push(...data.slice(1, 4).map(toNum), 0);
        break;

      case "vn":
        normals.push(...data.slice(1, 4).map(toNum));
        break;

      case "vt":
        texCoords.push(...data.slice(1, 4).map(toNum));
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

  // slap into loaded objects so we dont need to reload them ever
  // would make sense to have the scene handle these tbh
  LOADED_OBJECTS[id] = {
    vertices,
    indices,
    normals,
    texCoords,
  };
}

/**
 * Load an object from the cache by id
 * @param {string} id of the cached object file
 * @returns {PrimitiveObject}
 */
export function loadOBJ(id) {
  const { vertices, indices, normals, texCoords } = structuredClone(
    LOADED_OBJECTS[id],
  );
  return new PrimitiveObject(vertices, {
    normals,
    indices,
    texCoords,
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
