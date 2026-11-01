/**
 * @module objects/PrimitiveObject
 */

import { generateFillerColors } from "./primitives";
import SceneObject from "./SceneObject";

/**
 * Wrapper class to make primitive handling standardized.
 *
 * We will want this to hold
 * - vertices
 * - colors
 * - indices
 * - tangents
 * - texCoords
 * - vertex normals
 * - vertex count
 *
 * @class
 * @alias module:objects/PrimitiveObject
 */
export default class PrimitiveObject {
  /**
   * Create a new PrimitiveObject
   * @param {*} vertices
   * @param {Object} [options]
   * @param {*} [options.normals]
   * @param {*} [options.colors]
   * @param {*} [options.indices]
   * @param {*} [options.tangents]
   * @param {*} [options.texCoords]
   * @param {*} [options.vertexCount]
   * @param {*} [options.indexCount]
   */
  constructor(
    vertices,
    {
      normals = [],
      colors = [],
      indices = [],
      tangents = [],
      texCoords = [],
      vertexCount = vertices.length / 4,
      indexCount = indices.length,
    } = {},
  ) {
    this.vertices = vertices;
    this.normals = normals;
    this.colors = colors;
    this.indices = indices;
    this.tangents = tangents;
    this.texCoords = texCoords;
    this.vertexCount = vertexCount;
    this.indexCount = indexCount;
  }

  /**
   * Generate filler colors for the primitive
   * based off of the vertex count
   *
   * @param {*} colors
   * @param {*} alpha
   */
  generateColors(colors, alpha = false) {
    this.colors = generateFillerColors(this.vertexCount, colors, alpha);
  }

  /**
   * Convert primitive properties to respective typed arrays
   * and return them in a dict
   *
   * - vertices, normals, colors, tangents, texCoords : Float32Array
   * - indices: Uint16Array
   * @returns {*}
   */
  toTypedArray() {
    return {
      vertices: new Float32Array(this.vertices),
      normals: new Float32Array(this.normals),
      colors: new Float32Array(this.colors),
      indices: new Uint16Array(this.indices),
      tangents: new Float32Array(this.tangents),
      texCoords: new Float32Array(this.texCoords),
    };
  }

  /**
   * Convert the primitive directly to a scene object.
   *
   * the options are inherited from whatever sceneobject you're creating
   * the base SceneObject options are noted below
   *
   * @param {string} label the label to use for this object
   * @param {SceneObject} [sceneObjectType=SceneObject]
   * @param {*} options
   * @param {SceneObject} options.parent            the parent of this object (can be set through addChild instead)
   * @param {number[]} options.position             initial position of the object
   * @param {number[]} options.rotation             initial rotation of the object
   * @param {number[]} options.scale                initial scale of the object
   * @param {boolean} options.shouldDraw            if this object should be drawn
   * @param {string} options.programLabel           the program to draw this object with
   * @param {string} options.materialLabel          the material to use with this object
   * @param {string} options.lightingCenter         the center of the object to calculate light culling with
   * @param {string} options.lightingRadius         the radius of the object to use when calculate light culling
   * @param {string} options.child                  if the object is a child
   * @param {string} options.passes                 the renderpasses to render this object with
   * @param {string} options.tangents
   * @param {string} options.texCoords
   *
   */
  toSceneObject(label, sceneObjectType = SceneObject, options = {}) {
    const { vertices, normals, colors, indices, tangents, texCoords } =
      this.toTypedArray();

    return new sceneObjectType(label, vertices, colors, indices, normals, {
      tangents,
      texCoords,
      ...options,
    });
  }
}
