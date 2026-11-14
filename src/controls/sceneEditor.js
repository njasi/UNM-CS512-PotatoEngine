// Generalized interface to allow editing properties
// of stuff in the scene on the fly.

// TODO: objects of interest:
//       - sceneobject
//       - materials
//       - light
//       - shaderprograms?
//       - textures?
//       - camera

const TYPE_MATERIAL_SELECTOR = "material_selector";
const TYPE_PROGRAM_SELECTOR = "program_selector";
const TYPE_OBJECT_SELECTOR = "object_selector";
const TYPE_3TUPLE_SELECTOR = "3tuple_selector";
const TYPE_COLOR_SELECTOR = "color_selector";

// set of property types that cannot be inferred from
// the type of the value in the object (or that im too lazy to check for)
const PROPERTY_TYPES = {
  materialLabel: TYPE_MATERIAL_SELECTOR,
  materialLabelSecondary: TYPE_MATERIAL_SELECTOR,
  parent: TYPE_OBJECT_SELECTOR,
};

// current target of the editor panel
// could be an object, material, etc
let activeTarget;

/**
 * Generate a function to update the property noted in the target
 * object...
 * @param {*} target
 * @param {*} property
 * @param {*} secondaryProperty
 * @param {*} cast casting function
 * @returns
 */
function updatePropertyHandler(
  target,
  property,
  secondaryProperty = undefined,
  cast = undefined,
) {
  return function (event) {
    let val =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    if (cast) {
      val = cast(val);
    }

    if (!!secondaryProperty) {
      target[property][secondaryProperty] = val;
    } else {
      target[property] = val;
    }
  };
}

/**
 * Parse the properties given into a usable format
 * - should attach this information to the classes so we can
 *   just chuck it in as needed
 *
 * @param {*} properties
 */
function parseProperties(properties) {
  if (Array.isArray(properties)) {
    return properties.map((item) => {
      // pack property string into object
      return typeof item == "string" ? { name: item } : item;
    });
  }

  return Object.entries(properties).map(([name, config]) => {
    return typeof config == "string"
      ? { name, type: config }
      : { name, ...config };
  });
}

/**
 * Figure out the property type from the target
 * @param {*} target 
 * @param {string} property 
 */
function parsePropertyType(target, property) {}

/**
 * Iterate through the properties noted for the target object
 * and make a panel interface that can update the values and
 * is updated by changes to the object.
 *
 * expected property types & what to make (these should all come with labels):
 * - string => make a text input to change it
 * - number => text input to change with number cast function attached
 * - bool => checkbox
 * - TYPE_MATERIAL_SELECTOR => query the materials in the scene and create a select input (scene.materials (map) & materials have .label attribute)
 * - TYPE_OBJECT_SELECTOR => query the objects in the scene and create a select input (scene.objects  (map) & objects have .label attribute)
 * - TYPE_PROGRAM_SELECTOR => query the programs in the scene and create a select input (scene.program  (map) & program have .label attribute)
 * - TYPE_3TUPLE_SELECTOR => make a grouped set of 3 inputs (use the secondary property for array index)
 * - TYPE_COLOR_SELECTOR => color selector
 *
 * @param {*} target
 * @param {*} properties
 * @param {*} scene
 */
function createPanel(target, properties, scene) {
  const panel = document.getElementById("editor-panel-body");
  if (!panel) {
    throw new Error("Expected #editor-panel-body");
  }
  panel.innerHTML = "";

  for (const config of parseProperties(properties)) {
  }
}

function syncProperties(target) {
  if (target !== activeTarget) {
    return;
  }

  // TODO: figure out a clean way to bind sync functions to every input
  //       maybe a map of inpud id and sync functions? youd make them as
  //       you go in createPanel above
}
