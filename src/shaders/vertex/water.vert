#version 300 es

in vec3 aPosition;
in vec3 aColor;

uniform float uTime; // time in sec
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelTransformationMatrix;

// object translation coords, not an actual
// translation matrix
uniform vec3 uPosition; 
uniform vec3 uRotation;
uniform vec3 uScale;

out vec3 vColor;
out vec3 vPosition;

// create a 3d scaling matrix
mat4 scaling3D(float xs, float ys, float zs){
  return mat4(
    xs , 0.0, 0.0, 0.0,
    0.0,  ys, 0.0, 0.0,
    0.0, 0.0,  zs, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

// rotate around the X acs
mat4 rotate3DX(float angle){
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, cos(angle), sin(angle), 0.0,
        0.0, -sin(angle), cos(angle), 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

// rotate arounf the y axis
mat4 rotate3DY(float angle){
    return mat4(
        cos(angle), 0.0, -sin(angle), 0.0,
        0.0, 1.0, 0.0, 0.0,
        sin(angle), 0.0, cos(angle), 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

// rotate around the z axis
mat4 rotate3DZ(float angle){
    return mat4(
        cos(angle), sin(angle), 0.0, 0.0,
        -sin(angle), cos(angle), 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
}

// rotate around all axis
mat4 rotate3D(float ax, float ay, float az){
    // TODO could probaby make more efficient by writing out the whole matrix
    //      but tbh thats what the X,Y,Z specific rotations are for anyway
    return rotate3DZ(az) * rotate3DY(ay) * rotate3DX(ax);
}

// create a 3d transformation matrix
mat4 translate3D(float tx, float ty, float tz){
    return mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0, 
        0.0, 0.0, 1.0, 0.0,
        tx , ty , tz , 1.0
    );
}


void main() {
  float yWave = uPosition.y + 0.4 * sin(uTime);
//   waves to figure out later they dont look right...
//   yWave += 0.3 * sin( dot(aPosition.xz,normalize(vec2(0.5,1))) * 2.0 * 3.14159 / 0.1 - uTime  );
//   yWave += 0.1 * sin( dot(aPosition.xz,normalize(vec2(.4,.3))) * 2.0 * 3.14159 / 1. - uTime  );


  mat4 T = translate3D(uPosition.x, yWave, uPosition.z);
  mat4 R = rotate3D(uRotation.x, uRotation.y, uRotation.z);
  mat4 S = scaling3D(uScale.x, uScale.y, uScale.z);


  gl_Position = uProjectionMatrix * uModelViewMatrix * uModelTransformationMatrix * T * R * S * vec4(aPosition, 1.0f);
  

  vPosition = aPosition;
  vColor = aColor;
}