/** @module textures/DataTexture */
import { RayObject } from "../objects";

/**
 * wrapper around a texture, used for packing data
 * - object data
 * - TODO material data
 *
 * @class
 * @alias module:textures/DataTexture
 */
export default class DataTexture {
  static OBJECT_TEXELS = RayObject.OBJECT_TEXTURE_TEXELS;
  static OBJECT_FLOATS = RayObject.OBJECT_TEXTURE_FLOATS;
  static MATERIAL_TEXELS = 6;
  static MATERIAL_FLOATS = DataTexture.MATERIAL_TEXELS * 4;

  /**
   * Make a new data texture
   * @param {WebGL2RenderingContext} gl
   */
  constructor(gl) {
    this.texture = gl.createTexture();
    this.width = 0;
    this.height = 0;
    this.capacity = 0;
  }

  /**
   * upload objects into the data texture
   * @param {WebGL2RenderingContext} gl
   * @param {RayObject[]} objects
   * @param {*} materials
   * @param {number} textureUnit
   * @param {*} samplerLoc
   * @param {*} countLoc
   */
  uploadObjects(gl, objects, materials, textureUnit, samplerLoc, countLoc) {
    // figure out our size dimensions
    const required = Math.max(objects.length, 1);
    const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const texelsNeeded = required * DataTexture.OBJECT_TEXELS;
    const width = Math.min(
      maxSize,
      2 **
        Math.ceil(Math.log2(Math.max(1, Math.ceil(Math.sqrt(texelsNeeded))))),
    );
    const height = Math.ceil(texelsNeeded / width);

    const resized = this.width !== width || this.height !== height;
    if (resized) {
      this.width = width;
      this.height = height;
      this.capacity = Math.floor((width * height) / DataTexture.OBJECT_TEXELS);
    }

    // make float array and shove the data in
    // can probably cache the data in the obj tbh
    // although this is pretty fast anyway
    const floats = new Float32Array(this.width * this.height * 4);
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      object.materialIndex =
        materials.get(object.materialLabel) ?? object.materialIndex;

      object.packTextureData(floats, i * DataTexture.OBJECT_FLOATS);
    }

    this.uploadData(gl, floats, textureUnit, resized);

    gl.uniform1i(samplerLoc, textureUnit);
    gl.uniform1i(countLoc, objects.length);
  }

  /**
   * upload materials into the data texture
   *
   * @param {WebGL2RenderingContext} gl
   * @param {Map<string, RayMaterial>} materials
   * @param {number} textureUnit
   * @param {*} samplerLoc
   * @param {*} countLoc
   * @param {*} widthLoc
   */
  uploadMaterials(gl, materials, textureUnit, samplerLoc, countLoc, widthLoc) {
    const materialList = [...materials.values()];
    const required = Math.max(materialList.length, 1);
    const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const texelsNeeded = required * DataTexture.MATERIAL_TEXELS;
    const width = Math.min(
      maxSize,
      2 **
        Math.ceil(Math.log2(Math.max(1, Math.ceil(Math.sqrt(texelsNeeded))))),
    );
    const height = Math.ceil(texelsNeeded / width);

    const resized = this.width !== width || this.height !== height;
    if (resized) {
      this.width = width;
      this.height = height;
      this.capacity = Math.floor(
        (width * height) / DataTexture.MATERIAL_TEXELS,
      );
    }

    // make float array and shove the data in
    // can probably cache the data in the obj tbh
    // although this is pretty fast anyway
    const floats = new Float32Array(this.width * this.height * 4);
    for (let i = 0; i < materialList.length; i++) {
      const material = materialList[i];
      material.materialIndex = i;
      material.packTextureData(floats, i * DataTexture.MATERIAL_FLOATS);
    }

    this.uploadData(gl, floats, textureUnit, resized);

    gl.uniform1i(samplerLoc, textureUnit);
    gl.uniform1i(countLoc, materialList.length);
    gl.uniform1i(widthLoc, this.width);
  }

  /**
   * upload float data into texture
   * @param {WebGL2RenderingContext} gl
   * @param {Float32Array} floats
   * @param {number} textureUnit
   * @param {bool} resized
   */
  uploadData(gl, floats, textureUnit, resized) {
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    if (resized) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32F,
        this.width,
        this.height,
        0,
        gl.RGBA,
        gl.FLOAT,
        floats,
      );
    } else {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        this.width,
        this.height,
        gl.RGBA,
        gl.FLOAT,
        floats,
      );
    }
  }
}
