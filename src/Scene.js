/**
 * @module Scene
 */
import Camera from "./Camera";
import { rgba } from "./util/color";
import SceneObject from "./objects/SceneObject";
import Shader from "./shaders/Shader";
import ShaderProgram from "./shaders/ShaderProgram";
import {
  multiplyMat4,
  mat4Identity,
  mat4RotateY,
  mat4RotateX,
} from "./util/transformations";
import RenderPass from "./renderers/RenderPass";
import { renderers } from ".";
import { Texture2D, Material } from "./materials";

/**
 * Overall state management for a scene
 *
 * Helps track:
 * - Objects
 * - Shaders / Programs
 * - Materials
 * - Textures
 * - Lights
 * - RenderPasses
 *
 * @class
 * @alias module:Scene
 */
export default class Scene {
  /**
   * Create a new scene using the provided canvas as the context
   * @param {string} canvasID the id of the canvas element
   */
  constructor(canvasID) {
    this.canvas = document.getElementById(canvasID);
    this.gl = this.canvas.getContext("webgl2");

    if (!this.gl) {
      alert("WebGL2 not supported");
    }

    this.loader = undefined;
    this.loaderMessage = undefined;
    try {
      this.loader = document.getElementById("loader-wrapper");
      this.loaderMessage = document.getElementById("spinner-text");
    } catch {}

    // things present in the scene
    this.objects = new Map();
    this.updateList = new Map();
    this.lights = new Map();
    this.shaders = new Map();
    this.materials = new Map();
    this.textures = new Map();
    this.passes = new Map();

    // background color of the scene
    // TODO skybox
    this.background = rgba(64, 112, 255, 1);

    // start time and time elapsed
    this.startTime = Date.now();
    this.time = 0;

    // use to check if we actually need to switch shaders / materials
    this.activeProgram = undefined;
    this.activeMaterial = undefined;
    // Map<string, ShaderProgram>
    this.programs = new Map();

    this.rotationX = 0;
    this.rotationY = 0;

    // TODO add better camera settings...
    this.camera = new Camera(this.canvas.width / this.canvas.height);

    this.updateCB = undefined;
    // bind this to the renderer so we dont have context issues
    this.render = this.render.bind(this);

    // baisc render passes
    renderers.addBasicRenderPass(this);
    renderers.addTransparentRenderPass(this);
  }

  ///////////////////////
  // OBJECT MANAGEMENT //
  ///////////////////////

  /**
   * Add an object to the scene.
   *
   * - need an additional call to SceneObject.loadBuffers
   *   when adding, not sure if that is something
   *   that should live in here though. Added for now...
   *
   * @param {SceneObject} obj the object to add
   * @param {string} programLabel the label for the shader program to use with this object
   * @param {string} materialLabel the label for the object's material
   * @param {boolean} options.child if the object is a child, if so is not added to scenes render list, the parent renders it
   * @param {string[]} options.passes the render passes to use this object in (default ["basic"])
   * @param {boolean} options.addChildren if true, adds children to the scene
   */
  addObject(
    obj,
    programLabel = obj.programLabel,
    materialLabel = obj.materialLabel,
    {
      child = obj.child,
      passes = obj.passes || ["basic"],
      addChildren = false,
    } = {},
  ) {
    if (!programLabel) {
      throw new Error(
        `Object "${obj.label ?? "unknown"}" does not have a shader program`,
      );
    }

    obj.programLabel = programLabel;
    obj.materialLabel = materialLabel;
    obj.child = child;

    // rendering handled by the render passes now,
    // we just use this to track updates now
    if (!child) {
      this.updateList.set(obj.label, obj);
    }

    this.objects.set(obj.label, obj);

    // TODO: dont forget to remove objects from passes when we remove from scene
    for (const passLabel of passes) {
      this.getRenderPass(passLabel).addObject(obj);
    }

    obj.loadBuffers(this.gl);

    // setUniforms is standard now, but leaving the check just in case
    if (!!obj.setUniforms) {
      obj.setUniforms(this);
    }

    if (addChildren) {
      for (const child of obj.children) {
        this.addObject(
          child,
          programLabel,
          child.materialLabel || materialLabel,
          {
            child: true,
            passes: child.passes || passes,
            addChildren,
          },
        );
      }
    }
  }

  /**
   * Get an object by its label
   *
   * @param {string} label the label of the object
   */
  getObject(label) {
    return this.objects.get(label);
  }

  /**
   * Removes the object from all renderpasses in the scene as well.
   * Additionally cleans up the buffers related to the object
   * @param {string} label the label of the object to remove
   * @param {Object} [options]
   * @param {boolean} [options.removeChildren=false] if true will remove children as well
   */
  removeObject(label, { removeChildren = false } = {}) {
    const obj = this.getObject(label);

    if (!obj) {
      return;
    }

    this.objects.delete(label);
    this.updateList.delete(label);

    for (const pass of this.passes.values()) {
      pass.removeObject(obj);
    }

    if (removeChildren) {
      for (const child of obj.children) {
        this.removeObject(child.label, { removeChildren });
      }
    }

    obj.cleanBuffers(this.gl);
  }

  /**
   * Updated the passes that this object belongs to
   * @param {SceneObject} obj the object we want to update the passes of
   * @param {string[]} passLabels the passes to render this object in
   */
  setObjectPasses(obj, passLabels) {
    for (const pass of this.passes.values()) {
      pass.removeObject(obj);
    }

    for (const label of passLabels) {
      this.getRenderPass(label).addObject(obj);
    }
  }

  ///////////////////////
  // SHADER MANAGEMENT //
  ///////////////////////

  /**
   * Load our shaders and setup, called internally by load()
   * only use if doing something weird
   */
  async loadShaders() {
    await Promise.all([...this.shaders].map(([key, shader]) => shader.load()));

    this.shaders.forEach((shader) => {
      shader.init(this.gl);
    });
  }

  /**
   * Add a shader to the scene
   * @param {Shader} shader the shader to add
   */
  addShader(shader) {
    this.shaders.set(shader.label, shader);
  }

  /**
   * Get a shader by its label
   * @param {string} label the label of the shader to find
   * @returns {Shader}
   */
  getShader(label) {
    const shader = this.shaders.get(label);

    if (!shader) {
      throw new Error(`Shader "${label}" was not found`);
    }

    return shader;
  }

  ///////////////////////////////
  // SHADER PROGRAM MANAGEMENT //
  ///////////////////////////////

  /**
   * Create a new shader program. To create a shader program
   * of a type other than the default ShaderProgram class,
   * provide a class to the wrapperClass argument. For example
   * the PhoneSgaderProgram class...
   *
   * @param {string} label the label of the shader program being created
   * @param {string} vertexShaderLabel the label of the vertex shader to use while creating the program
   * @param {string} fragmentShaderLabel the label of the fragment shader to use while creating the program
   * @param {ShaderProgram} [wrapperClass=ShaderProgram] The shader program class to use while creating it.
   */
  addProgram(
    label,
    vertexShaderLabel,
    fragmentShaderLabel,
    wrapperClass = ShaderProgram,
  ) {
    const vertexShader = this.getShader(vertexShaderLabel);
    const fragmentShader = this.getShader(fragmentShaderLabel);

    const shaderProgram = new wrapperClass(label, vertexShader, fragmentShader);

    this.programs.set(label, shaderProgram);
  }

  /**
   * Get a shader program by its label
   * @param {string} label
   * @returns ShaderProgram
   */
  getProgram(label) {
    const shaderProgram = this.programs.get(label);

    if (!shaderProgram) {
      throw new Error(`Shader program "${label}" was not found`);
    }

    return shaderProgram;
  }

  loadPrograms() {
    this.programs.forEach((program) => {
      program.load(this.gl);
    });
  }

  /////////////////////////
  // MATERIAL MANAGEMENT //
  /////////////////////////

  /**
   * Add a material to the scene
   * - setup its uniforms when we init shaders later
   *
   * @param {Material} material the material wrapper
   * @param {string} program the label of the shader program to use this material in
   */
  addMaterial(material, program) {
    material.programLabel = program;
    this.materials.set(material.label, material);
  }

  /**
   * Get a material by its label
   * @param {string} label
   * @returns {Material}
   */
  getMaterial(label) {
    const material = this.materials.get(label);

    if (!material) {
      throw new Error(`Material "${label}" was not found`);
    }

    return material;
  }

  /**
   * Initialize the uniforms locatoions for all the materials currently
   * added into the scene. Note that this must happen after the shader
   * programs have been compiled.
   *
   * This is called internally by load so do not call unless doing something weird
   */
  loadMaterials() {
    // attach materials
    this.materials.forEach((mat) => {
      try {
        const shaderProg = this.getProgram(mat.programLabel);
        mat.initUniforms(this.gl, shaderProg);
      } catch (error) {
        console.error(mat);
        console.error(
          `Error initializing uniforms for material ${mat.label} in shader program ${mat.programLabel}`,
        );
        console.error(error);
      }
    });
  }

  //////////////////////
  // LIGHT MANAGEMENT //
  //////////////////////

  /**
   * Add a light to the scene
   * @param {Light} light light to add to the scene
   */
  addLight(light) {
    this.lights.set(light.label, light);
  }

  /**
   * Remove a light from the scene by its label
   * @param {string} label the label of the light
   * @returns {Light} the removed Light
   */
  removeLight(label) {
    return this.lights.delete(label);
  }

  /**
   * Get a light by its label
   * @param {string} label
   * @returns {Light} the light
   */
  getLight(label) {
    const light = this.lights.get(label);

    if (!light) {
      throw new Error(`Light "${label}" was not found`);
    }

    return light;
  }

  ///////////////////////////
  // RENDERPASS MANAGEMENT //
  ///////////////////////////

  /**
   * Add a renderpass to the scene
   * @param {RenderPass} pass the RenderPass to add
   */
  addRenderPass(pass) {
    if (this.passes.has(pass.label)) {
      throw new Error(`Render pass "${pass.label}" already exists`);
    }

    this.passes.set(pass.label, pass);
  }

  /**
   * Get a renderpass from the scene by its label
   * @param {string} label the label of the renderpass
   * @returns {RenderPass}
   */
  getRenderPass(label) {
    const pass = this.passes.get(label);
    if (!pass) throw new Error(`Render pass "${label}" was not found`);
    return pass;
  }

  /**
   * Remove a renderpass from the scene by its label
   * @param {string} label the label of the renderpass
   * @returns {RenderPass} the removed renderpass
   */
  removeRenderPass(label) {
    return this.passes.delete(label);
  }

  ////////////////////////
  // TEXTURE MANAGEMENT //
  ////////////////////////

  /**
   * Create and start loading a texture.
   *
   * NOTE: ensure that you call load or loadTextures to finish the loading process
   * @param {string} label the label to use for this texture
   * @param {string} url the source url of this texture
   * @param {*} options
   * @returns {Texture2D}
   */
  createTexture(label, url, options = {}) {
    if (this.textures.has(label)) {
      throw new Error(`Texture "${label}" already exists`);
    }

    const texture = new Texture2D(this.gl, options);
    texture.label = label;
    texture.ready = texture.load(url);

    this.textures.set(label, texture);
    return texture;
  }

  /**
   * Get a texture by its label
   * @param {string} label
   * @returns {Texture2D}
   */
  getTexture(label) {
    const texture = this.textures.get(label);

    if (!texture) {
      throw new Error(`Texture "${label}" was not found`);
    }

    return texture;
  }

  /**
   * Load all the textures from their source urls. this is called
   * internally in scene.load so dont call unless youre doing something
   * weird
   */
  async loadTextures() {
    await Promise.all(
      [...this.textures.values()].map((texture) => texture.ready),
    );
  }

  /**
   * Remove a texture from the scene by its label. returns
   * true if it was removed.
   * @param {string} label
   * @returns {bool}
   */
  removeTexture(label) {
    const texture = this.textures.get(label);

    if (!texture) {
      return false;
    }

    texture.dispose();
    return this.textures.delete(label);
  }

  /////////////////////////////
  // SCENE UPDATE MANAGEMENT //
  /////////////////////////////

  /**
   * attach a callback function to the scene to be run before every
   * render.
   * @param {function} cb
   */
  setUpdateCB(cb) {
    this.updateCB = cb;
    this.updateCB = this.updateCB.bind(this);
  }

  /**
   * Update the state of the scene
   * @param {number} dt timestep in seconds
   */
  update(dt) {
    if (!!this.updateCB) {
      this.updateCB(dt);
    }
    this.updateList.forEach((obj) => {
      if (!obj.child) {
        obj.update(dt, this);
      }
    });
  }

  _updateShaderLights(shaderProgram, lightTransformation) {
    // iterate over our lights if shader program has them
    // we only do this at shader switch since the lights
    // wont move in a single call

    // honestly this could be a per object thing depending
    // on how lights fall off.
    if (shaderProgram.hasLight) {
      const lights = [...this.lights.values()];
      shaderProgram.updateLights(this.gl, lightTransformation, lights);
      shaderProgram.setLightCount(this.gl, this.lights.size);
    }
  }

  /**
   * Update the general uniform values such as time, view, projection etc
   * @param {ShaderProgram} shaderProgram
   * @param {Float32Array} projectionMatrix
   * @param {Float32Array} modelViewMatrix
   * @param {Float32Array} modelTransformationMatrix
   */
  _updateShaderGeneralLocs(
    shaderProgram,
    projectionMatrix,
    modelViewMatrix,
    modelTransformationMatrix,
  ) {
    // set time in seconds
    if (shaderProgram.timeLoc !== null) {
      this.gl.uniform1f(shaderProgram.timeLoc, this.time / 1000);
    }

    // set projection, view, transform matrices (scene rotation)
    if (shaderProgram.uPM !== null) {
      this.gl.uniformMatrix4fv(shaderProgram.uPM, false, projectionMatrix);
    }
    if (shaderProgram.uMVM !== null) {
      this.gl.uniformMatrix4fv(shaderProgram.uMVM, false, modelViewMatrix);
    }
    if (shaderProgram.uMTM !== null) {
      this.gl.uniformMatrix4fv(
        shaderProgram.uMTM,
        false,
        modelTransformationMatrix,
      );
    }
  }

  ////////////////////////////////
  // SCENE RENDERING MANAGEMENT //
  ////////////////////////////////

  /**
   * Set the scene rotation.
   *
   * NOTE this is not camera rotation,
   *      it is full rotation of the objects in the scene
   * @param {number} x
   * @param {number} y
   */
  setRotation(x, y) {
    this.rotationX = x;
    this.rotationY = y;
  }

  /**
   * Cleanup the active material and set it to undefined
   */
  _clearActiveMaterial() {
    if (this.activeMaterial !== undefined) {
      this.getMaterial(this.activeMaterial).cleanup();
      this.activeMaterial = undefined;
    }
  }

  /**
   * view, projection, scene transform
   *
   * might need these in render passes so sectioning out...
   */
  _calculateMatrices() {
    let sceneRotation = mat4RotateX(
      mat4RotateY(mat4Identity(), this.rotationY),
      this.rotationX,
    );

    // get projection & model view info from camera
    const viewTransform = this.camera.getViewMatrix();
    const projectionTransform = this.camera.getProjectionMatrix();
    let sceneTransform = sceneRotation;

    return { viewTransform, projectionTransform, sceneTransform };
  }

  /**
   * Render a set of objects using a given RenderPass
   * @param {RenderPass} pass the renderpass to use
   * @param {*} matrices the scene transformation matricies, projection, rotation etc
   */
  _renderPass(pass, matrices) {
    const objects = pass.getObjects();
    const lights = [...this.lights.values()];
    for (const obj of objects) {
      const shaderProgram = this.getProgram(obj.programLabel);

      // if we are rendering with a new program switch over
      if (obj.programLabel != this.activeProgram) {
        this._clearActiveMaterial();

        shaderProgram.use(this.gl);

        // TODO: I should really move these functions into the shader class
        //       like the material class with its updateUniforms call
        this._updateShaderGeneralLocs(
          shaderProgram,
          matrices.projectionTransform,
          matrices.viewTransform,
          matrices.sceneTransform,
        );

        // transformation needed to correct light positions to correct space
        // this will probably conflict if I ever want to attach a light to an object
        // TODO these probably get moved into the shader passes?
        const lightTransformation = multiplyMat4(
          matrices.viewTransform,
          matrices.sceneTransform,
        );
        this._updateShaderLights(shaderProgram, lightTransformation);

        //
        this.activeProgram = obj.programLabel;
      }
      const nextMaterial = shaderProgram.hasMaterial
        ? obj.materialLabel
        : undefined;

      // if shader uses mats and the active material is not this
      // one then update it
      if (nextMaterial !== this.activeMaterial) {
        this._clearActiveMaterial();
        if (nextMaterial !== undefined) {
          this.getMaterial(nextMaterial).updateUniforms(this.gl, this);
          this.activeMaterial = nextMaterial;
        }
      }

      if (shaderProgram.hasLight) {
        shaderProgram.updateLightMask(this.gl, obj, lights);
      }

      obj.draw(this.gl, this);
    }
  }

  /**
   * Render the scene
   */
  render() {
    const nextTime = Date.now() - this.startTime;

    const dt = nextTime - this.time;
    this.update(dt / 1000);

    this.time = nextTime;

    // delta time since start in ms

    if (!this.gl) {
      console.error("Scene has no WebGL context");
      return;
    }

    const matrices = this._calculateMatrices();

    for (const [label, pass] of this.passes) {
      pass.attach(this);

      // reset switch flags
      // NOTE: if end up in a situation with only one program
      // can remove the flag. might be worth a dynamic check
      // this.activeMaterial = undefined;
      this.activeProgram = undefined;

      this._renderPass(pass, matrices);

      pass.detach(this);
    }

    // unbind the framebuffer if we end with one
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  ////////////////////////////////
  // CONVENIENCE LOADER HELPERS //
  ////////////////////////////////

  /**
   * Set the message inside the loading spinner
   * @param {string} message
   */
  setLoadingMessage(message) {
    if (!this.loaderMessage) {
      return;
    }
    this.loaderMessage.innerText = message;
  }

  /**
   * Set the loading status of the scene (ie display spinner)
   * @param {boolean} loading
   */
  setLoading(loading) {
    if (!this.loader) {
      return;
    }
    if (loading) {
      this.loader.classList.add("show");
    } else {
      this.loader.classList.remove("show");
    }
  }

  /**
   * Load the assets in the scene, call this after you have setup shaders, shaderprograms and materials
   * @param {function} loadAssets Additional loading callback function, consider loading obj file etc
   */
  async load(loadAssets = undefined) {
    this.setLoading(true);
    this.setLoadingMessage("Loading Shaders");
    await this.loadShaders();
    this.loadPrograms();

    this.setLoadingMessage("Loading Materials");
    await this.loadTextures();
    this.loadMaterials();

    if (loadAssets) {
      this.setLoadingMessage("Loading Assets");
      await loadAssets(this);
    }

    this.setLoading(false);
  }
}
