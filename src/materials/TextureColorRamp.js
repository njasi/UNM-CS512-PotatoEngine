/** @module materials/TextureColorRamp */
import Texture2D from "./Texture2D";

/**
 * Texture color ramp class made for ease of color remapping textures
 * - makes a 1 by <width> strip eased between colorStart to colorEnd
 *
 * @class
 * @alias module:materials/TextureColorRamp
 */
export default class TextureColorRamp extends Texture2D {
  /**
   * Create a new TextureColorRamp
   * @param {WebGL2RenderingContext} gl
   * @param {rgb()} colorStart color on the far left of the ramp
   * @param {rgb()} colorEnd color on the far right of the ramp
   * @param {Object} [options={}]
   * @param {boolean} [options.flipY=true]
   * @param {boolean} [options.mipmaps=true]
   * @param {*} [options.minFilter=gl.LINEAR_MIPMAP_LINEAR]
   * @param {*} [options.magFilter=gl.LINEAR]
   * @param {*} [options.wrapS=gl.REPEAT]
   * @param {*} [options.wrapT=gl.REPEAT]
   * @param {number[]} [options.placeholder=[128, 128, 255, 255]]
   * @param {boolean} [options.animated=false]
   */
  constructor(
    gl,
    colorStart,
    colorEnd,
    {
      label = undefined,
      width = 255,
      flipY = true,
      mipmaps = true,
      minFilter = gl.LINEAR_MIPMAP_LINEAR,
      magFilter = gl.LINEAR,
      wrapS = gl.CLAMP_TO_EDGE,
      wrapT = gl.REPEAT,
      placeholder = [128, 128, 255, 255],
      animated = false,
    } = {},
  ) {
    super(gl, {
      flipY,
      mipmaps,
      minFilter,
      magFilter,
      wrapS,
      wrapT,
      placeholder,
      animated,
    });

    this.label = label;
    this.width = width;
    this.colorStart = colorStart;
    this.colorEnd = colorEnd;
    this.colorsDirty = false;

    this.load();
  }

  /**
   * Create and bind the texture based on the color ramp start and end settings
   */
  load() {
    const gl = this._gl;

    // dont overwrite texture state...
    // this was very annoying to find im so tired
    const activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
    const previousBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);

    const pixels = new Uint8Array(this.width * 4);

    for (let i = 0; i < this.width; i++) {
      const ratio = i / (this.width - 1);

      for (let channel = 0; channel < 3; channel++) {
        // colors are ints here so gotta multiply by 255 after
        pixels[i * 4 + channel] = Math.round(
          255 *
            (this.colorStart[channel] +
              (this.colorEnd[channel] - this.colorStart[channel]) * ratio),
        );
      }

      pixels[i * 4 + 3] = 255;
    }

    // extra binding of the texture i could technically avoid here
    // by caching the result until we actually call the texture.bind
    // not sure its worth it though...
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.width,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );

    if (this.mipmaps) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    // rebind the texture info 
    gl.bindTexture(gl.TEXTURE_2D, previousBinding);
    gl.activeTexture(activeTexture);
  }

  /**
   * bind this texture to a texture unit
   *
   * extended here to add behavior, checks if colors have changed
   * and automatically regenerates the map.
   *
   * @param {number} [unit=0] the unit
   *
   */
  bind(unit = 0) {
    if (this.colorsDirty) {
      this.load();
    }
    super.bind(unit);
    this.colorsDirty = false;
  }

  /**
   * Update the colors on the ends of the color ramp
   * texture will be updated in next bind call
   * @param {rgb()} colorStart
   * @param {rgb()} colorEnd
   */
  setColors(colorStart, colorEnd) {
    this.colorsDirty = true;
    this.colorStart = colorStart;
    this.colorEnd = colorEnd;
  }
}
