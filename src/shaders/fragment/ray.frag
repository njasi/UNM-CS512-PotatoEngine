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
#define INTERNAL_MATERIALS 3

uniform float u_time;
uniform vec2 u_resolution;
uniform int u_maxBounces;
uniform float u_ambientStrength; // Ambient fill light for better visual
uniform vec2 u_cameraOrbit;
uniform vec3 u_target; // essentially camera position
uniform int u_raySamples;
uniform int u_glassMode;
uniform int u_maxShadowLayers;
uniform bool u_tirShadow;

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

const int GLASS_MODE_DOMINANT = 0;
const int GLASS_MODE_CONTRIBUTION = 1;
const int GLASS_MODE_SAMPLE = 2;
const int GLASS_MODE_NONE = 3;

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
const Material _01_default = Material(vec4(0.6f), vec4(0.8f), vec4(0.2f), vec4(0.f));
const Material _02_reflect = Material(vec4(1.f), vec4(0.8f), vec4(0.2f), vec4(0.f, 0.f, .8f, 0.f));
const Material _03_diamond_green = Material(vec4(0.f, 0.8f, 0.f, 0.f), vec4(0.f, 0.8f, 0, 0), vec4(0.2f), vec4(0.f, 2.42f, 0.f, 0.f));
const Material shaderMaterials[INTERNAL_MATERIALS] = Material[INTERNAL_MATERIALS](_01_default, _02_reflect, _03_diamond_green);

const Material NOTHING_MATERIAL = Material(vec4(0), vec4(0), vec4(0), vec4(0));

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
  return !((matId < 0 && matId < -INTERNAL_MATERIALS) || matId >= u_materialCount);
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
  vec4 options;       // x    => cyl, cone: height, torus:r, plane:depth;     y=> cyl: bulge,   w => light: power;
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
  float ior;
  bool isLight;
  bool isGlass;
  Material mat;
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
  HitData result = HitData(false, 1e10f, vec3(0.0f), vec3(0.0f), vec3(0.f), 0.0f, 0.0f, false, false, NOTHING_MATERIAL);

  // if the material is out of range then we ignore
  // - if less than 0, ensure it is in range of the internal materials
  // - check if above max material count
  if(!isValidMatId(obj.meta.y)) {
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
  result.ior = mat.optics.y;
  result.isLight = false;
  result.isGlass = mat.optics.y > 1.001f;
  result.mat = mat;

  return result;
}

////////////////
// RANDOMNESS //
////////////////

// basic bad random, consts from book of shaders https://thebookofshaders.com/10/
float randomValue(vec2 seed) {
  return fract(sin(dot(seed, vec2(12.9898f, 78.233f))) * 43758.5453123f);
}

// slightly better random, easier to reason about bounce & sample num influence
float randomValue2(vec2 pixel, int sampleNum, int bounce) {
  vec4 seed = vec4(pixel.x, pixel.y, float(sampleNum), float(bounce));
  return fract(sin(dot(seed, vec4(12.9898f, 78.233f, 37.934f, 17.193f))) * 43758.5453123f);
}

// TODO hash random? might look a little better and less spatially correlated...

// based on the sample count select from a different strata within the same pixel
vec2 stratifiedSampleVec2(int sampleNum, int sampleCount) {
  float n = float(sampleCount);

  float x = (float(sampleNum) +
    randomValue2(gl_FragCoord.xy, sampleNum, sampleCount * 10)) / n;

  float yIndex = mod(float(sampleNum) * 0.61803398875f, 1.0f) * n;

  float y = (yIndex +
    randomValue2(gl_FragCoord.yx, sampleNum, (sampleCount + 1) * 10)) / n;

  return vec2(x, y);
}

//////////////////////
// CALCULATION TIME //
//////////////////////

float schlick(float cosine, float n1, float n2) {
  float r0 = (n1 - n2) / (n1 + n2);
  r0 *= r0;
  return r0 + (1.0f - r0) * pow(1.0f - cosine, 5.0f);
}

HitData traceScene(Ray ray, bool includeLight) {
  HitData hit;
  hit.hit = false;
  hit.t = 1e10f;
  float t;
  vec3 n;

  if(includeLight) {
    for(int i = 0; i < u_lightCount; ++i) {
      HitData candidate = calculateHit(lights[i], ray);
      candidate.normal = vec3(0.0f);
      candidate.isLight = true;
      // add power in
      candidate.color += lights[i].options.w;
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

  return hit;
}

vec3 reflectGlass(vec3 I, vec3 N) {
  return normalize(reflect(I, N));
}

vec3 refractGlass(vec3 I, vec3 N, float eta, float cosThetaI, float etaSin2I) {
  return normalize(eta * I + (eta * cosThetaI - sqrt(1.0f - etaSin2I)) * N);
}

// trace the shadow path and account for glassy objects
// ie transmittance
vec3 traceShadow(HitData hit, Object light) {
  vec3 position = hit.point + hit.normal * 0.001f;
  vec3 toLight = light.centerRadius.xyz - position;
  float lightDist = length(toLight);
  vec3 lightDir = toLight / lightDist;

  vec3 transmittance = vec3(1.f);

  if(u_maxShadowLayers == 0) {
    return vec3(0.f);
  }

  // we could possibly pass through many layers of glass
  for(int layer = 0; layer < u_maxShadowLayers; layer++) {
    Ray shadow = Ray(position, lightDir);
    HitData blocker = traceScene(shadow, false);

    if(!blocker.hit || blocker.t > lightDist) {
      break;
    }

    if(!blocker.isGlass) {
      return vec3(0.f);
    }

    // NOTE: this is all pretty much copied from 
    //       the below refraction code, should it be made into a function?
    //       so i can avoid duplication?
    vec3 N = normalize(blocker.normal);
    vec3 I = lightDir;

    float n1 = 1.0f;
    float n2 = blocker.ior;
    float cosThetaI = dot(-I, N);
    bool exit = cosThetaI < 0.0f;
    if(exit) {
      N = -N;
      cosThetaI = dot(-I, N);
      n1 = blocker.ior;
      n2 = 1.0f;
    }

    float eta = n1 / n2;
    float etaSin2I = eta * eta * (1.0f - cosThetaI * cosThetaI);

    bool TIR = etaSin2I >= 1.0f;

    // TIR => no light make it through => no color shadow
    // technically it could refract/reflect multiple times and eventually make it out
    // but im not going to think about that here...
    if(TIR) {
      if(u_tirShadow) {
        // These look ok but idk if correct...
        // really weird effects on sphere probably best to avoid by default
        lightDir = reflectGlass(I, N);
        position = blocker.point + N * 0.001f;
        // continue;
      } else {
        return vec3(0.f);
      }
    }

    float F = schlick(cosThetaI, n1, n2);
    transmittance *= (1.f - F);

    // NOTE: only apply the color on entry into the material
    // only on exit doesnt look right, unsure what the difference is
    // will have to look inito later
    if(!exit) {
      transmittance *= blocker.color;
    }

    // if getting dim just give up and return the transmittince early
    if(max(transmittance.r, max(transmittance.g, transmittance.b)) < 0.01f) {
      break;
    }

    lightDist -= blocker.t + 0.001f;
    position = blocker.point + lightDir * 0.001f;
  }

  float diff = max(dot(hit.normal, lightDir), 0.0f);
  float falloff = 1.0f / (1.0f + 0.1f * lightDist * lightDist);

  return transmittance * (diff * falloff);
}

vec3 trace(Ray ray, int sampleNum) {
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

    // added this in the light hit section, since we dont know what light we hit, 
    // except without the attenuation term, maybe hitdata should be able to have a 
    // light struct in it to look at the info or pass attenuation down to 
    // if(hit.isLight) {
    //   color += attenuation * lightSphere.color * LIGHT_POWER;
    //   break;
    // }

    // Monte Carlo Sampling (& multiple rays per pixel), reflect with probability 
    // F (random() < schlick_value), else refract, and average many samples per pixel
    if(hit.isGlass) {
      vec3 I = normalize(ray.direction);
      vec3 N = normalize(hit.normal);

      // entering or exiting the glass?
      float n1 = 1.0f;
      float n2 = hit.ior;
      float cosThetaI = dot(-I, N);
      if(cosThetaI < 0.0f) {
        N = -N;
        cosThetaI = dot(-I, N);
        n1 = hit.ior;
        n2 = 1.0f;
      }

      // eta = n1 / n2
      float eta = n1 / n2;
      float etaSin2I = eta * eta * (1.0f - cosThetaI * cosThetaI);

      bool TIR = etaSin2I >= 1.0f;

      // value schlick to check against
      float F = TIR ? 1.0f : schlick(cosThetaI, n1, n2);

      if(u_glassMode == GLASS_MODE_DOMINANT) {
        if(TIR || F > 0.5f) {
          ray = Ray(hit.point + N * 0.001f, reflectGlass(I, N));
        } else {
          ray = Ray(hit.point - N * 0.001f, refractGlass(I, N, eta, cosThetaI, etaSin2I));
          attenuation *= hit.color;
        }

        continue;
      } else if(u_glassMode == GLASS_MODE_CONTRIBUTION) {
        // TODO: this one requires recusion emulation
        // probably make a stack of rays to evaluate

        // essentially the following:
        // vec3 reflectionColor = trace(Ray(hit.point + N * 0.001f, reflectGlass(I, N)), sampleNum);
        // vec3 refractionColor = trace(Ray(hit.point - N * 0.001f, refractGlass(I, N, eta, cosThetaI, etaSin2I)), sampleNum);
        // color += attenuation * (F * reflectionColor + (1.0f - F) * refractionColor);
        // break;

        // Hmmm now that I think about it option2 is extremely expensive... if my computer struggles
        // on option 3 i should probably not even consider this one lol...

      } else if(u_glassMode == GLASS_MODE_SAMPLE) {
        // throw a bunch of stuff in to make more "random"
        // when we cast multiple rays will sdadd the ray number into the mix
        // float choice = randomValue(gl_FragCoord.xy + float(sampleNum + 1) * vec2(float(bounce) * 17.f, u_time * 31.f));
        // float choice = randomValue2(gl_FragCoord.xy, sampleNum, bounce);

        // stratify the random by factoring in the full sample count and divide by 
        // the total samples
        float choice = (float(sampleNum) +
          randomValue2(gl_FragCoord.xy, sampleNum, bounce)) / float(u_raySamples);

        vec3 direction;
        vec3 point;
        if(TIR || choice < F) {
          // reflection
          direction = reflectGlass(I, N);
          point = hit.point + N * 0.001f;
        } else {
          // refraction
          direction = refractGlass(I, N, eta, cosThetaI, etaSin2I);
          point = hit.point - N * 0.001f;
          // NOTE: tint from passing through or reflecting off
          // maybe reflect and refract should have diff color influence?
          // we have mat.kd and mat.ks to work with, reflect could make sense as ks...
          attenuation *= hit.color;
        }
        ray = Ray(point, direction);

        continue;
      }
    }

    // TODO cast colored shadow ray if we're encountering glassy material?
    // right now we either block or not with out shadow rays, will have to make it check
    // isglass and then the color of the hit... will also need to deal with refraction 
    // direction... may get combined into above somehow?
    vec3 directLightColor = vec3(0.f);

    for(int i = 0; i < u_lightCount; i++) {
      Object light = lights[i];

      vec3 shadowColor = traceShadow(hit, light);

      vec3 lightColor = vec3(1.f);
      if(isValidMatId(light.meta.y)) {
            // for now let us say ka is the color of light,
            // later we probably change this
        lightColor = getMaterial(light.meta.y).ka.xyz;
      }

      directLightColor += shadowColor * lightColor * light.options.w;
    }

    //  (optional) Ambient fill light approximates indirect light we don't trace.
    vec3 shading = hit.color * (directLightColor + u_ambientStrength);
    color += attenuation * shading * (1.0f - hit.reflectivity);

    if(hit.reflectivity == 0.0f) {
      break;
    }

    attenuation *= hit.reflectivity * hit.mat.ka.xyz;
    ray = Ray(hit.point + hit.normal * 0.001f, reflect(ray.direction, hit.normal));
  }

  return color;
}

void main() {
  // Orbit camera around the scene center
  float cp = cos(u_cameraOrbit.x), sp = sin(u_cameraOrbit.x);
  float cy = cos(u_cameraOrbit.y), sy = sin(u_cameraOrbit.y);
  mat3 rotX = mat3(1.0f, 0.0f, 0.0f, 0.0f, cp, -sp, 0.0f, sp, cp);
  mat3 rotY = mat3(cy, 0.0f, -sy, 0.0f, 1.0f, 0.0f, sy, 0.0f, cy);
  mat3 camera = rotY * rotX;

  // NOTE: single exact pixel ray sample 
  // vec2 uv = (gl_FragCoord.xy - 0.5f * u_resolution) / u_resolution.y;
  // Ray ray = Ray(u_target + camera * vec3(0.0f, 0.0f, 7.0f), camera * normalize(vec3(uv, -1.5f)));

  // trace avg
  vec3 traceColor = vec3(0);
  for(int i = 0; i < u_raySamples; i++) {
    // random subpixel sampling
    vec2 samp = stratifiedSampleVec2(i, u_raySamples) - 0.5f;
    vec2 sampleUV = (gl_FragCoord.xy + samp - 0.5f * u_resolution) / u_resolution.y;

    Ray ray = Ray(u_target + camera * vec3(0.0f, 0.0f, 7.0f), camera * normalize(vec3(sampleUV, -1.5f)));

    traceColor += trace(ray, i);
  }

  traceColor *= 1.f / float(u_raySamples);

  // gamma correction
  fragColor = vec4(pow(traceColor, vec3(1.0f / 2.2f)), 1.0f);
}