// todo load obj file? should be fairly doable
// https://en.wikipedia.org/wiki/Wavefront_.obj_file

import { makeSceneObjectGenerator } from "./helpers";

// TODO probably do something more reasonable than this
const LOADED_OBJECTS = {};

const toNum = (x) => parseFloat(x);

export async function cacheOBJ(url, id) {
  const response = await fetch(url);
  const text = await response.text();

  const vertices = [];
  const normals = [];
  const indices = [];

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

      case "f":
        // assume faces are already triangulated
        const faceVerts = data.slice(1);
        for (let j = 0; j < faceVerts.length; j++) {
          const [positionIdx, _, normalIdx] = faceVerts[j].split("/").map(toNum);
          indices.push(positionIdx - 1);
        }
        break;
    }
  }


  // slap into loaded objects so we dont need to reload them ever
  // would make sense to have the scene handle these tbh
  LOADED_OBJECTS[id] = {
    vertices: vertices,
    indices: indices,
    vertexCount: vertices.length / 3,
    indexCount: indices.length,
  };
}

export function loadOBJ(id) {
  return LOADED_OBJECTS[id];
}

/**
 * Load a cached obj file into a scene object
 * @param {*} name
 * @param {*} color
 * @param {*} id id of the cached object file
 */
export const generateOBJObject = makeSceneObjectGenerator(loadOBJ);
