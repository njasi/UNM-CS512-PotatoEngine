import Camera from "./Camera";
import Material from "./materials/Material";
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

export default class Scene {
  constructor(canvasID) {
    this.canvas = document.getElementById(canvasID);
    this.gl = this.canvas.getContext("webgl2");

    if (!this.gl) {
      alert("WebGL2 not supported");
    }

    // things present in the scene
    this.objects = new Map();
    this.renderList = new Map();
    this.lights = new Map();
    this.shaders = new Map();
    this.materials = new Map();
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

  /**
   * Load our shaders and setup
   */
  async loadShaders() {
    await Promise.all(
      [...this.shaders].map(([key, shader]) => shader.loadRemote()),
    );

    this.shaders.forEach((shader) => {
      shader.create(this.gl);
    });
  }

  /**
   * initialize the uniforms locators for all the materials
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

  /**
   * create the shaders and combined gl shader program
   *
   * @param {*} vertexShader
   * @param {*} fragmentShader
   * @returns
   */
  createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();

    this.gl.attachShader(program, vertexShader.shader);
    this.gl.attachShader(program, fragmentShader.shader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      this.gl.deleteProgram(program);
      throw new Error(
        `Failed to link shader program: ${this.gl.getProgramInfoLog(program)}`,
      );
    }

    return program;
  }

  /**
   * Add a shader to the scene
   * @param {Shader} shader
   */
  addShader(shader) {
    this.shaders.set(shader.label, shader);
  }

  /**
   * Get a shader by its label
   * @param {*} label
   * @returns
   */
  getShader(label) {
    const shader = this.shaders.get(label);

    if (!shader) {
      throw new Error(`Shader "${label}" was not found`);
    }

    return shader;
  }

  /**
   * Add a material to the scene
   * - setup its uniforms when we init shaders later
   *
   * @param {Material} material the material wrapper
   * @param {ShaderProgram} shader the shader program to use this material in
   */
  addMaterial(material, program) {
    material.programLabel = program;
    this.materials.set(material.label, material);
  }

  /**
   * Get a shader by its label
   * @param {*} label
   * @returns
   */
  getMaterial(label) {
    const material = this.materials.get(label);

    if (!material) {
      throw new Error(`Material "${label}" was not found`);
    }

    return material;
  }

  /**
   * Add a light to the scene
   * @param {Light} light
   */
  addLight(light) {
    this.lights.set(light.label, light);
  }

  /**
   * Remove a light from the scene by its label
   * @param {string} label the label of the light
   * @returns
   */
  removeLight(label) {
    return this.lights.delete(label);
  }

  /**
   * Get a light by its label
   * @param {string} label
   * @returns
   */
  getLight(label) {
    const light = this.lights.get(label);

    if (!light) {
      throw new Error(`Light "${label}" was not found`);
    }

    return light;
  }

  /**
   * Create a new shader program
   * @param {*} label
   * @param {*} vertexShaderLabel
   * @param {*} fragmentShaderLabel
   * @param {typeof ShaderProgram} [wrapperClass=ShaderProgram]
   * @returns
   */
  addProgram(
    label,
    vertexShaderLabel,
    fragmentShaderLabel,
    wrapperClass = ShaderProgram,
  ) {
    const vertexShader = this.getShader(vertexShaderLabel);
    const fragmentShader = this.getShader(fragmentShaderLabel);

    if (!vertexShader.shader || !fragmentShader.shader) {
      throw new Error(
        `Shaders for program "${label}" must be compiled before creating the program`,
      );
    }

    const program = this.createProgram(vertexShader, fragmentShader);
    const shaderProgram = new wrapperClass(label, program, this.gl);

    this.programs.set(label, shaderProgram);

    return shaderProgram;
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

  /**
   * Add a renderpass to the scene
   * @param {*} pass
   * @returns
   */
  addRenderPass(pass) {
    if (this.passes.has(pass.label)) {
      throw new Error(`Render pass "${pass.label}" already exists`);
    }

    this.passes.set(pass.label, pass);
    return pass;
  }

  /**
   * Get a renderpass from the scene by its label
   * @param {string} label the label of the renderpass
   * @returns
   */
  getRenderPass(label) {
    const pass = this.passes.get(label);
    if (!pass) throw new Error(`Render pass "${label}" was not found`);
    return pass;
  }

  /**
   * Remove a renderpass from the scene by its label
   * @param {string} label the label of the renderpass
   * @returns
   */
  removeRenderPass(label) {
    return this.passes.delete(label);
  }

  /**
   * Initialize the buffers for every SceneObject
   */
  initBuffers() {
    this.objects.forEach((obj) => {
      obj.loadBuffers(this.gl);
    });
  }

  /**
   * Add an object to the scene
   *
   * - need an additional call to SceneObject.loadBuffers
   *   when adding, not sure if that is something
   *   that should live in here though. Added for now
   * @param {SceneObject} obj the object to add
   * @param {string} programLabel the label for the shader program to use with this object
   * @param {string} materialLabel the label for the object's material
   * @param {boolean} options.child if the object is a child, if so is not added to scenes render list, the parent renders it
   * @param {string[]} options.passes the render passes to use this object in (default ["basic"])
   * @param {string[]} options.addChildren if true, adds children to the scene
   */
  addObject(
    obj,
    programLabel = obj.programLabel,
    materialLabel = obj.materialLabel,
    { child = false, passes = ["basic"], addChildren = false } = {},
  ) {
    if (!programLabel) {
      throw new Error(
        `Object "${obj.label ?? "unknown"}" does not have a shader program`,
      );
    }

    obj.programLabel = programLabel;
    obj.materialLabel = materialLabel;

    // children are rendered by their parent, this didnt cause any issue previously
    // but it might cause issues with render passes?
    if (!child) {
      this.renderList.set(obj.label, obj);

      // TODO: dont forget to remove objects from passes when we remove from scene
      for (const passLabel of passes) {
        this.getRenderPass(passLabel).addObject(obj);
      }
    }
    this.objects.set(obj.label, obj);
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
            child,
            passes,
            addChildren,
          },
        );
      }
    }
  }

  /**
   * Get an object by its label
   *
   * TODO: should really update the objects colleciton to a map instead of a list
   * @param {string} label
   */
  getObject(label) {
    return this.objects.get(label);
  }

  /**
   * TODO probably some unbinding or something?
   * TODO remove all of the children objects
   *
   * Removes the object from all renderpasses in the scene as well
   * @param {*} label
   * @param {Object} [options]
   * @param {boolean} [options.removeChildren=false] if true will remove children as well
   */
  removeObject(label, { removeChildren = false } = {}) {
    const obj = this.getObject(label);

    if (!obj) {
      return;
    }

    this.objects.delete(label);
    this.renderList.delete(label);

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
   * @param {*} obj
   * @param {*} passLabels
   */
  setObjectPasses(obj, passLabels) {
    for (const pass of this.passes.values()) {
      pass.removeObject(obj);
    }

    for (const label of passLabels) {
      this.getRenderPass(label).addObject(obj);
    }
  }

  /**
   * Set the scene rotation.
   *
   * NOTE this is not camera rotation,
   *      it is full rotation of the objects in the scene
   * @param {*} x
   * @param {*} y
   */
  setRotation(x, y) {
    this.rotationX = x;
    this.rotationY = y;
  }

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
   * @param {*} dt timestep in seconds
   */
  update(dt) {
    if (!!this.updateCB) {
      this.updateCB(dt);
    }
    this.renderList.forEach((obj) => {
      obj.update(dt, this);
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
   * Render a set of objects
   * @param {*} objects
   * @param {*} pass
   * @param {*} matrices
   */
  _renderPass(pass, matrices) {
    const objects = pass.getObjects();
    const lights = [...this.lights.values()];
    for (const obj of objects) {
      const shaderProgram = this.getProgram(obj.programLabel);

      // if we are rendering with a new program switch over
      if (obj.programLabel != this.activeProgram) {
        // console.log("loading");

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
        this.activeMaterial = undefined;
      }

      // if shader uses mats and the active material is not this
      // one then update it
      if (
        shaderProgram.hasMaterial &&
        obj.materialLabel != this.activeMaterial &&
        obj.materialLabel != undefined
      ) {
        this.getMaterial(obj.materialLabel).updateUniforms(this.gl);
        this.activeMaterial = obj.materialLabel;
      }

      shaderProgram.updateLightMask(this.gl, obj, lights);

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

    // TODO figure out how to move into pass & pass.begin etc
    // this.gl.enable(this.gl.DEPTH_TEST);
    // this.gl.clearColor(...this.background);
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const matrices = this._calculateMatrices();

    for (const [label, pass] of this.passes) {
      pass.attach(this);

      // reset switch flags
      // NOTE: if end up in a situation with only one program
      // can remove the flag. might be worth a dynamic check
      this.activeMaterial = undefined;
      this.activeProgram = undefined;

      this._renderPass(pass, matrices);

      pass.detach(this);
    }

    // unbind the framebuffer if we end with one
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
