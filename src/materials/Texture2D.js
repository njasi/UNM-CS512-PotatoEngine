/** @module materials/Texture2D */

/**
 * Convenience representation of a 2D texture
 * @class
 * @alias module:materials/Texture2D
 *
 */
export default class Texture2D {
  /**
   * Create a new 2d texture...
   * @param {WebGL2RenderingContext} gl
   * @param {Object} [options={}]
   * @param {boolean} [options.flipY=true]
   * @param {boolean} [options.mipmaps=true]
   * @param {number} [options.blackMipmaps=0]
   * @param {*} [options.minFilter=gl.LINEAR_MIPMAP_LINEAR]
   * @param {*} [options.magFilter=gl.LINEAR]
   * @param {*} [options.wrapS=gl.REPEAT]
   * @param {*} [options.wrapT=gl.REPEAT]
   * @param {number[]} [options.placeholder=[128, 128, 255, 255]]
   * @param {*} [options.animated=false]
   */
  constructor(
    gl,
    {
      flipY = true,
      mipmaps = true,
      blackMipmaps = 0,
      minFilter = gl.LINEAR_MIPMAP_LINEAR,
      magFilter = gl.LINEAR,
      wrapS = gl.REPEAT,
      wrapT = gl.REPEAT,
      placeholder = [128, 128, 255, 255],
      animated = false,
    } = {},
  ) {
    this._gl = gl;
    this.flipY = flipY;
    this.mipmaps = mipmaps;
    this.blackMipmaps = blackMipmaps;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.wrapS = wrapS;
    this.wrapT = wrapT;
    this.animated = animated;

    this.texture = gl.createTexture();
    if (!this.texture) {
      throw new Error("Failed to create WebGL texture");
    }

    // filler 1x1 placeholder lets the texture be bound while an image loads.
    // note that 3d textures (2d texture array know the size from the start and)
    // dont need to do this, might be faster that way tbh, no reallocating size...
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(placeholder),
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);

    this.loaded = false;
  }

  /**
   * Load the image at the url into this texture
   * @param {string} url 
   */
  load(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        try {
          this.upload(image);
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
   * parse some valid source to the texture
   *
   * @param {TexImageSource} source
   * @param {WebGL2RenderingContext} [gl=this._gl] 
   */
  upload(source, gl = this._gl) {
    if (!!source) {
      this._source = source;
    } else {
      source = this._source;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    const previousFlipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);

    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
    } finally {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlipY);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrapT);

    if (this.mipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);

      if (this.blackMipmaps > 0) {
        const width = source.width ?? source.videoWidth ?? source.naturalWidth;
        const height =
          source.height ?? source.videoHeight ?? source.naturalHeight;

        if (!width || !height) {
          throw new Error(
            "Cannot determine texture dimensions for black mipmaps",
          );
        }

        const maxLevel = Math.floor(Math.log2(Math.max(width, height)));
        const firstBlackLevel = Math.max(1, maxLevel - this.blackMipmaps + 1);

        for (let level = firstBlackLevel; level <= maxLevel; level++) {
          const levelWidth = Math.max(1, Math.floor(width / 2 ** level));
          const levelHeight = Math.max(1, Math.floor(height / 2 ** level));
          const blackPixels = new Uint8Array(levelWidth * levelHeight * 4);

          for (let i = 3; i < blackPixels.length; i += 4) {
            blackPixels[i] = 255;
          }

          gl.texSubImage2D(
            gl.TEXTURE_2D,
            level,
            0,
            0,
            levelWidth,
            levelHeight,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            blackPixels,
          );
        }
      }

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
    }
  }

  /**
   * Refresh the texture from source if cached
   */
  _refresh() {
    if (!!this._source) {
      this.upload();
    }
  }

  /**
   * bind this texture to a texture unit
   * @param {number} [unit=0] the unit
   * @param {WebGL2RenderingContext} [gl=this._gl] 
   */
  bind(unit = 0, gl = this._gl) {
    // TODO can probably replace the refresh method
    //      with just directly uploading like in texarray.
    if (this.animated) {
      this._refresh();
    }
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  /**
   * Clean up the allocated things
   * @param {WebGL2RenderingContext} [gl=this._gl] 
   */
  dispose(gl = this._gl) {
    gl.deleteTexture(this.texture);
    this.texture = null;
  }
}
