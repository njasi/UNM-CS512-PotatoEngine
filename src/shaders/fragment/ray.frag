#version 300 es
precision highp float;

// calculated from the max possible with the object struct in a block
// ie  
//   - min guaranteed buffer block = 16384 bytes
//     - most machines should have 65536 bytes
//     - check with => gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE);
//     - if we need more objects we have options 
//       - optimize object struct
//       - add another obj buffer
//       - use texture as data buffer (guaranteed 4096x4096 so ~16MiB i think?)
//   - object struct byte size = 16 + 16 + 16 + 64 = 112 bytes
//   - so max objects = 
//     - 65536 / 112 = 585.14...
//     - 16384 / 112 = 146.29... 
#define MAX_OBJECTS 585 
#define MAX_LIGHTS 585
// mat struct bytes = 64, 16384 / 64 = 256
#define MAX_MATERIALS 256
// materials not provided by js, but rather defined in this shader
// see materials section below
#define INTERNAL_MATERIALS 1

uniform float u_time;
uniform vec2 u_resolution;
uniform int u_maxBounces;
uniform float u_ambientStrength; // Ambient fill light for better visual
uniform vec2 u_cameraOrbit;
uniform vec3 u_target; // essentially camera position

// track the sizes of buffers, since you cant 
// really check the buffer itself for this info
// well you kinda can but not worth it when can just set a uniform
uniform int u_objectCount;
uniform int u_lightCount;
uniform int u_materialCount;

out vec4 fragColor;

// holdouts to replace from the provided code
// we dont need to hardcode stuff we are better than that smh
const float LIGHT_POWER = 3.0f;
const float FLOOR_Y = -2.0f;
const float CHECKER_SIZE = 3.0f;
const float GLASS_IOR = 1.5f;  // refractive index of the glass sphere

/////////////////////
// MATERIAL CONFIG //
/////////////////////

// struct to pack material data into so objects
// dont have to store all of this
struct Material {
  vec4 ka; // w unused
  vec4 kd; // w unused
  vec4 ks; // w unused
  vec4 optics; // specular, refractiveIndex, reflectivity
  // textures? => maybe shove texuture ids into the unused ws?
  // albedo (with transparency), 
  // => this could be an emission map if the object is in the light block
  // normals or bump map?, 
  // specular map?
};

// should allow materials calculated in the shader as well
// perhaps use negative value in obj.meta.y to signal to the shader? 
layout(std140) uniform materialBlock {
  Material materials[MAX_MATERIALS];
};

// materials defined inside the shader rather than provided by js
// should allow me some flexibility, can probably do something similar with the objects
// although objects that are very advanced might make more sense in a second renderpass?
// internal default mat, just a solid grey (id = -1)
const Material _01_default = Material(vec4(0.6f, 0, 0, 0), vec4(0.8f, 0, 0, 0), vec4(0.2f), vec4(0.f));
const Material shaderMaterials[INTERNAL_MATERIALS] = Material[INTERNAL_MATERIALS](_01_default);

// get a material by its id
Material getMaterial(int matId) {
  if(matId < 0) {
    return shaderMaterials[-1 * (matId + 1)];
  } else {
    return materials[matId];
  }
}

// check if a material id is valid
bool isValidMatId(int matId) {
  return (matId < 0 && matId < -INTERNAL_MATERIALS) || matId >= MAX_MATERIALS;
}

//////////////////
// OBJECT SETUP //
//////////////////

// Convenience layout of a sphere
struct Sphere {
  int material;
  vec3 center;
  float radius;
  mat4 transform;
};

// Convenience layout of a cube
struct Cube {
  int material;
  vec3 center;
  float halfSize;
  mat4 transform;
};

// Convenience layout of a cone
struct Cone {
  int material;
  vec3 center;
  float r;
  float h;
  mat4 transform;
};

// Convenience layout of a torus
struct Torus {
  int material;
  vec3 center;
  float R;
  float r;
  mat4 transform;
};

// Convenience layout of a cylinder
struct Cylinder {
  int material;
  vec3 center;
  float r;
  float h;
  float bulge;
  bool faceted;
  int faces;
  mat4 transform;
};

// Convenience layout of a plane
struct Plane {
  int material;
  vec3 center;
  float width;
  float depth;
  mat4 transform;
};

// type flags used in the general object struct below
const int OBJECT_TYPE_SPHERE = 0;
const int OBJECT_TYPE_CUBE = 1;
const int OBJECT_TYPE_CONE = 2;
const int OBJECT_TYPE_TORUS = 3;
const int OBJECT_TYPE_CYLINDER = 4;
const int OBJECT_TYPE_PLANE = 5;

// honestly i could or more information into a 
// single int since object type probably < 10, 
// but we arent that desperate

// all encompassing object layout passed from js.
struct Object {
  ivec4 meta;         // x    => type;    y => material?; z=> cyl: faceted (could actually be for all) ; w => cyl: faces (prism) ; 
  vec4 centerRadius;  // xyz  => center;  w => cone, sphere, cyl: r, cube: half-size, torus: R, plane: width
  vec4 options;       // x    => cyl, cone: height, torus:r, plane:depth;     y=> cyl: bulge 
  mat4 transform;     // overall transformation to apply 
};

// block of objects we use to receive information from the
// js end 
layout(std140) uniform objectBlock {
  Object objects[MAX_OBJECTS];
};

///////////////////
// LIGHT CONFIG  //
///////////////////

// block of lights we use to receive information from the
// js end, for now we say they are all objects, see below
layout(std140) uniform lightBlock {
  Object lights[MAX_LIGHTS];
};

// NOTE: i guess lights are objects in this basic representation?
//       for now use a lightblock of objects, could use the same 
//       object array but then you lose information space
//       of either lower cap of objects overall, or using a byte to
//       signal its a light, although could shove into meta.x with 
//       a bitshift for free basically

// NOTE: old light block layout from phong shaders
//       adding this back in some capacity would be nice
//       since directional & spotlights are cool

// const int LIGHT_POINT = 0;
// const int LIGHT_SPOT = 1;
// const int LIGHT_DIRECTIONAL = 2;

// layout(std140) uniform LightBlock {
//   // x, y, z, type
//   vec4 positionType[MAX_LIGHTS];
//   // r, g, b, intensity
//   vec4 colorIntensity[MAX_LIGHTS];
//   // attA, attB, attC, cutoff
//   vec4 attenuationCutoff[MAX_LIGHTS];
//   // dirX, dirY, dirZ, spotExponent
//   vec4 directionExponent[MAX_LIGHTS];
// };

///////////////////////////
// RAY TRACING STRUCTURE //
///////////////////////////

// basic structure of a ray
struct Ray {
  vec3 origin;
  vec3 direction;
};

// wrapper around hit information
struct HitData {
  bool hit;
  float t;
  vec3 point;
  vec3 normal;
  vec3 color;
  float reflectivity;
  bool isLight;
  bool isGlass;
};

///////////
// SETUP //
///////////

const Sphere lightSphere = Sphere(-1, vec3(0.f), 0.3f, mat4(0));
Sphere sphere;
Sphere glassSphere;
Cube cube;

///////////////////////////////
// INTERSECTION CALCULATIONS //
///////////////////////////////

// basic sphere intersection
bool intersectSphere(Sphere s, Ray ray, out float t) {
  vec3 oc = ray.origin - s.center;
  float b = dot(oc, ray.direction);
  float d = b * b - dot(oc, oc) + s.radius * s.radius;
  if(d < 0.0f)
    return false;

  t = -b - sqrt(d);
  if(t < 0.001f)
    t = -b + sqrt(d);  // ray starts inside
  return t > 0.001f;
}

// cube intersection
// Slab test 
bool intersectCube(Cube cube, Ray ray, out float t, out vec3 normal) {
  vec3 t0s = (cube.center - cube.halfSize - ray.origin) / ray.direction;
  vec3 t1s = (cube.center + cube.halfSize - ray.origin) / ray.direction;
  vec3 tmin = min(t0s, t1s);
  vec3 tmax = max(t0s, t1s);
  float t0 = max(max(tmin.x, tmin.y), tmin.z);
  float t1 = min(min(tmax.x, tmax.y), tmax.z);
  if(t1 < 0.0f || t0 > t1)
    return false;

  t = t0 > 0.001f ? t0 : t1;
  if(t < 0.001f)
    return false;

  vec3 local = ray.origin + ray.direction * t - cube.center;
  vec3 a = abs(local);
  if(a.x > a.y && a.x > a.z)
    normal = vec3(sign(local.x), 0.0f, 0.0f);
  else if(a.y > a.z)
    normal = vec3(0.0f, sign(local.y), 0.0f);
  else
    normal = vec3(0.0f, 0.0f, sign(local.z));
  return true;
}

// bool intersectPlane(Plane p, Ray ray, out float t) {
//   if(abs(ray.direction.y) < 0.0001f)
//     return false;
//   t = (p.center.y - ray.origin.y) / ray.direction.y;
//   return t > 0.001f;
// }

bool intersectPlane(Plane p, Ray ray, out float t, out vec3 n) {
  if(abs(ray.direction.y) < 0.0001f)
    return false;

  t = (p.center.y - ray.origin.y) / ray.direction.y;
  if(t <= 0.001f)
    return false;

  vec3 point = ray.origin + ray.direction * t;

  // negative width/depth means an infinite plane in that direction
  if(p.width > 0.0f && abs(point.x - p.center.x) > 0.5f * p.width)
    return false;
  if(p.depth > 0.0f && abs(point.z - p.center.z) > 0.5f * p.depth)
    return false;

  n = vec3(0.0f, 1.0f, 0.0f);
  if(dot(n, ray.direction) > 0.0f)
    n = -n;

  return true;
}

// TODO
Ray toObjectSpace(Ray r, mat4 transform) {
  return r;
}

// switch on the object type and select the correct one from above
// apply the transform before to put the light ray in the correct space
// Replace the original intersectObject with this version.
bool intersectObject(Object obj, Ray worldRay, out float t, out vec3 worldNormal) {

  // TODO transform ray to local object space...
  Ray localRay = toObjectSpace(worldRay, obj.transform);

  float localT;
  vec3 localNormal;
  bool didHit = false;

  if(obj.meta.x == OBJECT_TYPE_SPHERE) {
    Sphere s = Sphere(obj.meta.y, obj.centerRadius.xyz, obj.centerRadius.w, obj.transform);
    // s.radius = 5.0;
    didHit = intersectSphere(s, localRay, localT);
    if(didHit) {
      vec3 p = localRay.origin + localRay.direction * localT;
      localNormal = normalize((p - s.center) / s.radius);
    }
  } else if(obj.meta.x == OBJECT_TYPE_CUBE) {
    Cube c = Cube(obj.meta.y, obj.centerRadius.xyz, obj.centerRadius.w, obj.transform);

    didHit = intersectCube(c, localRay, localT, localNormal);
  } else if(obj.meta.x == OBJECT_TYPE_PLANE) {
    Plane p = Plane(obj.meta.y, obj.centerRadius.xyz, obj.centerRadius.w, obj.options.x, obj.transform);

    didHit = intersectPlane(p, localRay, localT, localNormal);
  } else if(obj.meta.x == OBJECT_TYPE_CONE) {
    // TODO
  } else if(obj.meta.x == OBJECT_TYPE_TORUS) {
    // TODO
  } else if(obj.meta.x == OBJECT_TYPE_CYLINDER) {
    // TODO
  }

  if(!didHit)
    return false;

  t = localT;
  worldNormal = localNormal;

  return true;
}

// calculate hitdata for a hit on a object
HitData calculateHit(Object obj, Ray ray) {
  HitData result = HitData(false, 1e10f, vec3(0.0f), vec3(0.0f), vec3(0.0f), 0.0f, false, false);

  // if the material is out of range then we ignore
  // - if less than 0, ensure it is in range of the internal materials
  // - check if above max material count
  if(isValidMatId(obj.meta.y)) {
    return result;
  }

  float t;
  vec3 normal;
  Material mat;

  if(!intersectObject(obj, ray, t, normal)) {
    return result;
  }

  if(obj.meta.y < 0) {
    mat = shaderMaterials[-1 * (obj.meta.y + 1)];
  } else {
    mat = materials[obj.meta.y];
  }

  float ior = mat.optics.y;
  float reflectivity = mat.optics.z;

  result.hit = true;
  result.t = t;
  result.point = ray.origin + ray.direction * t;
  result.normal = normal;
  result.color = mat.kd.rgb;
  result.reflectivity = reflectivity;
  result.isLight = false;
  result.isGlass = false;

  return result;
}

//////////////////////
// CALCULATION TIME //
//////////////////////

void initScene(float time) {
  // float a = time * 2.f;
  // sphere = Sphere(vec3(cos(a) * 2.5f, sin(a * 1.3f) * 0.8f, -6.0f + sin(a) * 0.5f), 1.0f, vec3(1.0f, 0.3f, 0.3f));

  // float b = time * 2.f;
  // cube = Cube(vec3(sin(b) * 2.0f, cos(b * 1.5f) + 0.5f, -9.0f + cos(b * 0.7f)), 0.8f, vec3(0.3f, 0.8f, 0.3f), 0.85f);
}

//eta = n1 / n2
//vec3 refraction(vec3 I, vec3 N, float eta) {
//    <!-- insert your code here -->
//}

// Schlick approximation
//float schlick(float cosine, float ref_idx) {
//    <!-- insert your code here -->
//}

HitData traceScene(Ray ray, bool includeLight) {
  HitData hit;
  hit.hit = false;
  hit.t = 1e10f;
  float t;
  vec3 n;

  // if(includeLight && intersectSphere(ray, lightSphere, t) && t < hit.t) {
  //   hit = HitData(true, t, ray.origin + ray.direction * t, vec3(0.0f), lightSphere.color, 0.0f, true, false);
  // }

  if(includeLight) {
    for(int i = 0; i < u_lightCount; ++i) {
      HitData candidate = calculateHit(lights[i], ray);
      candidate.normal = vec3(0.0f);
      candidate.isLight = true;
      if(candidate.hit && candidate.t < hit.t)
        hit = candidate;
    }
  }

  // keep the closest hit in the scene 
  // wonder if we can depth sort objects to make faster?
  for(int i = 0; i < u_objectCount; ++i) {
    HitData candidate = calculateHit(objects[i], ray);
    if(candidate.hit && candidate.t < hit.t)
      hit = candidate;
  }

  // if(intersectPlane(ray, t) && t < hit.t) {
  //   vec3 p = ray.origin + ray.direction * t;
  //   vec2 cell = floor(p.xz / CHECKER_SIZE);
  //   vec3 color = mod(cell.x + cell.y, 2.0f) < 1.0f ? vec3(1.0f) : vec3(0.05f);
  //   hit = HitData(true, t, p, vec3(0.0f, 1.0f, 0.0f), color, 0.0f, false, false);
  // }

  // if(intersectCube(ray, t, n) && t < hit.t) {
  //   hit = HitData(true, t, ray.origin + ray.direction * t, n, cube.color, cube.reflectivity, false, false);
  // }

  // if(intersectSphere(ray, sphere, t) && t < hit.t) {
  //   vec3 p = ray.origin + ray.direction * t;
  //   hit = HitData(true, t, p, (p - sphere.center) / sphere.radius, sphere.color, 0.0f, false, false);
  // }

  return hit;
}

vec3 trace(Ray ray) {
  vec3 color = vec3(0.0f);
  vec3 attenuation = vec3(1.0f);

  // use loop to simulate the recursive process as GLSL doesn't support recursions
  for(int bounce = 0; bounce < u_maxBounces; bounce++) {
    HitData hit = traceScene(ray, true);

    if(!hit.hit) {
      float t = 0.5f * (ray.direction.y + 1.0f);
      color += attenuation * mix(vec3(0.09f, 0.12f, 0.18f), vec3(0.18f, 0.21f, 0.27f), t);  // sky
      break;
    }

    // if(hit.isLight) {
    //   color += attenuation * lightSphere.color * LIGHT_POWER;
    //   break;
    // }

    // Refraction: (option 1)either reflects or refracts the ray, whichever Schlick says is stronger
    // (option 2): finalColor = hit.color * (F * reflectionColor + (1.0 - F) * refractionColor)
    // (option 3): Monte Carlo Sampling (multiple rays per pixel), reflect with probability F (random() < schlick_value), else refract, and average many samples per pixel
    //<!-- if (hit.isGlass) {
    //    <!-- insert your code here -->

    //    vec3 direction;
    //    if (total_internal_reflection || schlick_value > 0.5) {
            //direction = reflection ray
    //        <!-- insert your code here -->
    //    } else {
            //direction = refraction ray
    //        <!-- insert your code here -->
    //    }

    //    ray = Ray(hit.point + direction * 0.001, direction);
    ////Use Schlick approximation to determine contributions from reflection and refraction
    //    attenuation *= hit.color;
    //    continue;
    //}


    // TODO: multi light scene instead of hard coded light
    //       should just be a for loop casting shadow rays

    vec3 toLight = lightSphere.center - hit.point;
    float lightDist = length(toLight);
    vec3 lightDir = toLight / lightDist;

    HitData blocker = traceScene(Ray(hit.point + hit.normal * 0.001f, lightDir), false);
    float visible = blocker.hit && blocker.t < lightDist ? 0.0f : 1.0f;
    float diff = max(dot(hit.normal, lightDir), 0.0f);
    float falloff = 1.0f / (1.0f + 0.1f * lightDist * lightDist);

    //  (optional) Ambient fill light approximates indirect light we don't trace.
    vec3 shading = hit.color * (LIGHT_POWER * diff * falloff * visible + u_ambientStrength);
    color += attenuation * shading * (1.0f - hit.reflectivity);

    if(hit.reflectivity == 0.0f)
      break;
    attenuation *= hit.reflectivity;
    ray = Ray(hit.point + hit.normal * 0.001f, reflect(ray.direction, hit.normal));
  }

  return color;
}

void main() {
  initScene(u_time);

  // Orbit camera around the scene center
  float cp = cos(u_cameraOrbit.x), sp = sin(u_cameraOrbit.x);
  float cy = cos(u_cameraOrbit.y), sy = sin(u_cameraOrbit.y);
  mat3 rotX = mat3(1.0f, 0.0f, 0.0f, 0.0f, cp, -sp, 0.0f, sp, cp);
  mat3 rotY = mat3(cy, 0.0f, -sy, 0.0f, 1.0f, 0.0f, sy, 0.0f, cy);
  mat3 camera = rotY * rotX;

  vec2 uv = (gl_FragCoord.xy - 0.5f * u_resolution) / u_resolution.y;
  Ray ray = Ray(u_target + camera * vec3(0.0f, 0.0f, 7.0f), camera * normalize(vec3(uv, -1.5f)));

  fragColor = vec4(pow(trace(ray), vec3(1.0f / 2.2f)), 1.0f);  // gamma correction
}