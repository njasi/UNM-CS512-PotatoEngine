/** @module materials/Texture2DArray */

/**
 * Convenience representation of a 2D texture array
 * 
 * @class
 * @alias module:materials/Texture2DArray
 */
export default class Texture2DArray {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {number} width
   * @param {number} height
   * @param {number} layers
   * @param {Object} [options]
   * @param {boolean} [options.flipY=true]
   * @param {boolean} [options.mipmaps=true]
   * @param {*} [options.minFilter=gl.LINEAR]
   * @param {*} [options.magFilter=gl.LINEAR]
   * @param {*} [options.wrapS=gl.REPEAT]
   * @param {*} [options.wrapT=gl.REPEAT]
   * @param {boolean} [options.animated=false]
   */
  constructor(
    gl,
    width,
    height,
    layers,
    {
      flipY = true,
      mipmaps = true,
      minFilter = gl.LINEAR,
      magFilter = gl.LINEAR,
      wrapS = gl.REPEAT,
      wrapT = gl.REPEAT,
      animated = false,
    } = {},
  ) {
    if (
      !Number.isInteger(width) ||
      width < 1 ||
      !Number.isInteger(height) ||
      height < 1 ||
      !Number.isInteger(layers) ||
      layers < 1
    ) {
      throw new Error("width, height, and layers must be positive integers");
    }

    this._gl = gl;
    this.width = width;
    this.height = height;
    this.layers = layers;
    this.flipY = flipY;
    this.mipmaps = mipmaps;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    this.animated = animated;
    this._sources = new Map();

    this.texture = gl.createTexture();
    if (!this.texture) {
      throw new Error("Failed to create WebGL texture array");
    }

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
    // 3D texture, empty layers start as 0s
    // in contrast to the normal 2d textures we rely on all
    // the layers being the same size so we dont start with a
    // filler 1x1 placeholder
    gl.texImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      gl.RGBA8,
      width,
      height,
      layers,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );

    gl.texParameteri(
      gl.TEXTURE_2D_ARRAY,
      gl.TEXTURE_MAG_FILTER,
      this.magFilter,
    );
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, this.wrapS);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, this.wrapT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    if (mipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    }
  }


  /**
   * Load the image at the url into this texture at the specified layer
   * @param {string} url 
   * @param {number} layer 
   */
  load(url, layer) {
    this._checkLayer(layer);

    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        try {
          this.upload(image, layer);
          this.loaded = true;
          resolve(this);
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
      image.src = url;
    });
  }


  /**
   * parse some valid source to the texture layer
   *  - dimensions must match the preset width and height...
   *  - could probably get around this by padding black or smth
   *    but should be fine working with it if i choose a reasonable
   *    size to use overall...
   * @param {TexImageSource} source
   * @param {number} layer
   * @param {WebGL2RenderingContext} [gl=this._gl] 
   */
  upload(source, layer, gl = this._gl) {
    this._checkLayer(layer);

    const size = this._sourceSize(source);
    if (size.width !== this.width || size.height !== this.height) {
      throw new Error(
        `Source must be ${this.width}x${this.height}; got ${size.width}x${size.height}`,
      );
    }

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);

    const previousFlipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);

    try {
      gl.texSubImage3D(
        gl.TEXTURE_2D_ARRAY,
        0,
        0,
        0,
        layer,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
    } finally {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlipY);
    }

    this._sources.set(layer, source);

    if (this.mipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      // note: leave out the black mipmaps, dont think
      //       ill need this feature. is in tex2d if smth comes up tho
    }
  }

  /**
   * Size helper since the attributes vary based on type
   * notably: images, video, html element
   * @param {TexImageSource} source 
   * @returns 
   */
  _sourceSize(source) {
    return {
      width: source.width ?? source.videoWidth ?? source.naturalWidth,
      height: source.height ?? source.videoHeight ?? source.naturalHeight,
    };
  }

  /**
   * Validate that a layer number is in range
   * @param {number} layer 
   */
  _checkLayer(layer) {
    if (!Number.isInteger(layer) || layer < 0 || layer >= this.layers) {
      throw new RangeError(
        `Layer must be an integer from 0 to ${this.layers - 1}`,
      );
    }
  }

  /**
   * bind this texture to a texture unit
   * @param {*} unit the unit
   * @param {WebGL2RenderingContext} [gl=this._gl] 
   */
  bind(unit = 0, gl = this._gl) {

    // TODO: come back here and allow indv layers to be animated
    //       rather than all of them being updated...
    if (this.animated) {
      for (const [layer, source] of this._sources) {
        this.upload(source, layer);
      }
    }

    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);
  }

  /**
   * Clean up the allocated things
   */
  dispose(gl = this._gl) {
    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = null;
      this._sources.clear();
    }
  }
}
