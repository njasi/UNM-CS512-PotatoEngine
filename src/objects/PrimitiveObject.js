import { generateFillerColors } from "./primitives";

/**
 * Wrapper class to make primitive handling standardized.
 *
 * We will want this to hold
 * - vertices
 * - colors
 * - indices
 * - vertex normals
 * - vertex count
 */
export default class PrimitiveObject {
  /**
   * Create a new PrimitiveObject
   * @param {*} vertices
   * @param {Object} [options]
   * @param {*} [options.normals]
   * @param {*} [options.colors]
   * @param {*} [options.indices]
   * @param {*} [options.vertexCount]
   */
  constructor(
    vertices,
    {
      normals = [],
      colors = [],
      indices = [],
      vertexCount = vertices.length / 4,
      indexCount = indices.length,
    } = {},
  ) {
    this.vertices = vertices;
    this.normals = normals;
    this.colors = colors;
    this.indices = indices;
    this.vertexCount = vertexCount;
    this.indexCount = indexCount
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
   * - vertices, normals, colors : Float32Array
   * - indices: Uint16Array
   * @returns
   */
  toTypedArray() {
    return {
      vertices: new Float32Array(this.vertices),
      normals: new Float32Array(this.normals),
      colors: new Float32Array(this.colors),
      indices: new Uint16Array(this.indices),
    };
  }
}
