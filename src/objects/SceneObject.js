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
} from "../transformations";

export default class SceneObject {
  constructor(label, vertices, colors, indices, parent = undefined) {
    this.label = label;

    // basic input from model generation
    this.vertices = vertices;
    this.colors = colors;
    this.indices = indices;

    // TODO parent and children for hierarchy later
    this.parent = parent;
    this.children = [];

    // transformation matrix to track?
    this.M = undefined;

    // vertex buffer, colors buffer, indices buffer
    this.vbo = undefined;
    this.nbo = undefined;
    this.ibo = undefined;

    // attach update function here, such as an explosion growing
    this.updateCB = undefined;

    this.position = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.scale = [1, 1, 1];

    // attached in scene
    this.programLabel;
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

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

    this.nbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

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

    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
    gl.enableVertexAttribArray(this.colorLoc);
    gl.vertexAttribPointer(this.colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
  }

  /**
   * Set object specific uniforms.
   * In this case positon and rotation
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
   */
  draw(gl) {
    this.bindBuffers(gl)

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
    for (const child of this.children) {
      child.draw(gl);
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
