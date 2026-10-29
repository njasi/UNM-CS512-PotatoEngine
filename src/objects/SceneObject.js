/**
 * Wrapper class to make animation and such simple.
 *
 * We will want this to hold
 * - vertices
 * - colors
 * - indices
 * (maybe multiples of the above)
 *
 * Later add for hierarchical models:
 * - children
 * - parent
 * - transformation matrix previously used?
 */

import {
  mat4Identity,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Scale,
  mat4Translate,
  matMul,
} from "../util/transformations";
import PrimitiveObject from "./PrimitiveObject";

export default class SceneObject {
  static DEFAULT_OPTIONS = {};

  /**
   * Make an scene object (basic object to render)
   * @param {string} label
   * @param {Float32Array} vertices
   * @param {Float32Array} colors
   * @param {Int16Array} indices
   * @param {Float32Array} normals
   * @param {*} options
   * @param {SceneObject} options.parent            the parent of this object (can be set through addChild instead)
   * @param {*} options.position                    initial position of the object
   * @param {*} options.rotation                    initial rotation of the object
   * @param {*} options.scale                       initial scale of the object
   * @param {boolean} options.shouldDraw            if this object should be drawn
   * @param {string} options.programLabel           the program to draw this object with
   * @param {string} options.materialLabel          the material to use with this object
   * @param {string} options.lightingCenter         the center of the object to calculate light culling with
   * @param {string} options.lightingRadius         the radius of the object to use when calculate light culling
   */
  constructor(
    label,
    vertices,
    colors,
    indices,
    normals,
    {
      parent = undefined,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = [1, 1, 1],
      shouldDraw = true,
      programLabel = undefined,
      materialLabel = undefined,
      lightingCenter = [0, 0, 0],
      lightingRadius = 1,
    } = {},
  ) {
    this.label = label;

    // basic input from model generation
    this.vertices = vertices;
    this.colors = colors;
    this.indices = indices;
    this.normals = normals;

    // TODO parent and children for hierarchy later
    this.parent = parent;
    this.children = [];

    this.lightingCenter = lightingCenter
    this.lightingRadius = lightingRadius

    // transformation matrix to track?
    this.M = undefined;

    // vertex buffer, colors buffer, indices buffer
    this.vbo = undefined;
    this.cbo = undefined;
    this.ibo = undefined;
    this.nbo = undefined;

    // attach update function here, such as an explosion growing
    this.updateCB = undefined;

    this.position = position;
    this.rotation = rotation;
    this.scale = scale;

    this.shouldDraw = shouldDraw;

    // attached in scene if not set at init
    this.programLabel = programLabel;
    this.materialLabel = materialLabel;
  }

  /**
   * Helper method, create a scene object from a primitive
   * @param {PrimitiveObject} prim
   * @param {string} label
   * @param {*} options
   * @param {SceneObject} options.parent
   * @param {*} options.position
   * @param {*} options.rotation
   * @param {*} options.scale
   * @param {boolean} options.shouldDraw
   * @param {string} options.programLabel
   * @param {string} options.materialLabel
   */
  static fromPrim(
    prim,
    label = prim.label,
    {
      parent = undefined,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = [1, 1, 1],
      shouldDraw = true,
      programLabel = undefined,
      materialLabel = undefined,
      lightingCenter = [0, 0, 0],
      lightingRadius = 1,
    } = {},
  ) {
    const { vertices, normals, colors, indices } = prim.toTypedArray();
    return new SceneObject(label, vertices, colors, indices, normals, {
      parent,
      position,
      rotation,
      scale,
      shouldDraw,
      programLabel,
      materialLabel,
      lightingCenter,
      lightingRadius
    });
  }

  /**
   * Load the vertices, colors, indices into the buffers
   *
   * @param {*} gl the webgl2 context from canvas
   */
  loadBuffers(gl) {
    if (!(this.vertices instanceof Float32Array)) {
      throw new Error("vertices must be a Float32Array");
    }

    if (!(this.colors instanceof Float32Array)) {
      throw new Error("colors must be a Float32Array");
    }

    if (!(this.indices instanceof Uint16Array)) {
      throw new Error("indices must be a Uint16Array");
    }

    if (!(this.normals instanceof Float32Array)) {
      throw new Error("normals must be a Float32Array");
    }

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    this.cbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    this.nbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
  }

  /**
   * Bind and setup buffers
   *
   * @param {*} gl the webgl2 context from canvas
   */
  bindBuffers(gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(this.posLoc);
    gl.vertexAttribPointer(this.posLoc, 4, gl.FLOAT, false, 0, 0);

    if (this.normalLoc !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
      gl.enableVertexAttribArray(this.normalLoc);
      gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.cbo);
    gl.enableVertexAttribArray(this.colorLoc);
    gl.vertexAttribPointer(this.colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
  }

  /**
   * Free the buffers of the object
   * @param {*} gl
   */
  cleanBuffers(gl) {
    for (const key of ["vbo", "cbo", "nbo", "ibo"]) {
      if (this[key]) {
        gl.deleteBuffer(this[key]);
        this[key] = undefined;
      }
    }
  }

  /**
   * Set object specific uniform / attribute locations.
   * Uniforms:
   * - position
   * - rotation
   * - scale
   * - world transformation
   *
   * Attributes:
   * - positions
   * - colors
   * - normals
   *
   * @param {Scene} scene the scene the object is in
   */
  setUniforms(scene) {
    const shader = scene.getProgram(this.programLabel);
    this.uPosLoc = scene.gl.getUniformLocation(shader.program, "uPosition");
    this.uRotLoc = scene.gl.getUniformLocation(shader.program, "uRotation");
    this.uScaleLoc = scene.gl.getUniformLocation(shader.program, "uScale");
    this.uWorldLoc = scene.gl.getUniformLocation(
      shader.program,
      "uWorldTransformationMatrix",
    );

    this.posLoc = scene.gl.getAttribLocation(shader.program, "aPosition");
    this.colorLoc = scene.gl.getAttribLocation(shader.program, "aColor");
    this.normalLoc = scene.gl.getAttribLocation(shader.program, "aNormal");
  }

  /**
   * Add a child to the children list
   *
   * @param {*} obj the object to add
   */
  addChild(obj) {
    this.children.push(obj);
    obj.parent = this;
  }

  /**
   * Remove a child from the children list
   *
   * TODO do we need special handling for if child deletes itself?
   * hmm the children should proabbly be a map too
   *
   * @param {*} label the label of the object to remove
   */
  removeChild(label) {
    this.children = this.children.filter((c) => c.label != label);
  }

  /**
   * Draw an object onto the canvas
   *
   * @param {*} gl the webgl2 context from canvas
   * @param {Scene} [scene=undefined]
   */
  draw(gl, scene = undefined) {
    if (!this.shouldDraw) {
      return;
    }
    this.bindBuffers(gl);

    gl.uniform3f(
      this.uPosLoc,
      this.position[0],
      this.position[1],
      this.position[2],
    );
    gl.uniform3f(
      this.uRotLoc,
      this.rotation[0],
      this.rotation[1],
      this.rotation[2],
    );
    gl.uniform3f(this.uScaleLoc, this.scale[0], this.scale[1], this.scale[2]);

    // if parent exists try to pass over its transformation matrix
    const parentM = !!this.parent?.M ? this.parent.M : mat4Identity();
    gl.uniformMatrix4fv(this.uWorldLoc, false, parentM);

    // draw the object by the index order
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    let prevMat = this.materialLabel;
    for (const child of this.children) {
      if (
        child.materialLabel &&
        (child.materialLabel != this.materialLabel ||
          child.materialLabel != prevMat)
      ) {
        prevMat = child.materialLabel;
        const mat = scene.getMaterial(child.materialLabel);
        scene.activeMaterial = child.materialLabel;
        mat.updateUniforms(gl);
      }
      child.draw(gl, scene);
    }
  }

  // attach this to the callback passed so we can reference the object
  setUpdateCB(cb) {
    this.updateCB = cb;
    this.updateCB = this.updateCB.bind(this);
  }

  /**
   * Update the transformation matrix that represents the world for children
   * components
   */
  updateWorldMatrix() {
    let M = this.parent ? this.parent.M : mat4Identity();

    // apply transformss one by one to calc world
    // for the children of this component
    M = mat4Translate(M, this.position);
    M = mat4RotateZ(M, this.rotation[2]);
    M = mat4RotateY(M, this.rotation[1]);
    M = mat4RotateX(M, this.rotation[0]);
    M = mat4Scale(M, this.scale);

    this.M = M;
  }

  /**
   * Update the object based on time change and
   * the updateCB function if set
   * @param {*} dt
   * @param {*} scene
   */
  update(dt, scene) {
    if (!!this.updateCB) {
      this.updateCB(dt, scene);
    }

    this.updateWorldMatrix();

    for (const child of this.children) {
      child.update(dt, scene);
    }
  }
}
