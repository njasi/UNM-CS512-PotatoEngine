#version 300 es

in vec3 aPosition;
in vec3 aColor;
in vec3 aNormal;
in vec3 aTangent;
in vec2 aTexCoord;

uniform float uTime; // time in sec
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelTransformationMatrix;
uniform mat4 uLightSpaceMatrix;

// TODO calculate this properly
out vec4 vPositionLightSpace;

// transformation applied to the world ie parent component
uniform mat4 uWorldTransformationMatrix;

// object translation coords, not an actual
// translation matrix
uniform vec3 uPosition;
uniform vec3 uRotation;
uniform vec3 uScale;

// if rotation should be applied in bvh order
uniform int uBVH;

out vec3 vColor;
out vec3 vPosition;
out vec3 vNormal;
out vec3 vTangent;
out vec2 vTexCoord;

// create a 2d scaling matrix
mat3 scaling2D(float xs, float ys) {
    return mat3(xs, 0.0f, 0.0f, 0.0f, ys, 0.0f, 0.0f, 0.0f, 1.0f);
}

// create a 3d scaling matrix
mat4 scaling3D(float xs, float ys, float zs) {
    return mat4(xs, 0.0f, 0.0f, 0.0f, 0.0f, ys, 0.0f, 0.0f, 0.0f, 0.0f, zs, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f);
}

// create a 2d rotation matrix
mat3 rotate2D(float angle) {
    return mat3(cos(angle), sin(angle), 0.0f, -1.0f * sin(angle), cos(angle), 0.0f, 0.0f, 0.0f, 1.0f);
}

// rotate around the X acs
mat4 rotate3DX(float angle) {
    return mat4(1.0f, 0.0f, 0.0f, 0.0f, 0.0f, cos(angle), sin(angle), 0.0f, 0.0f, -sin(angle), cos(angle), 0.0f, 0.0f, 0.0f, 0.0f, 1.0f);
}

// rotate arounf the y axis
mat4 rotate3DY(float angle) {
    return mat4(cos(angle), 0.0f, -sin(angle), 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, sin(angle), 0.0f, cos(angle), 0.0f, 0.0f, 0.0f, 0.0f, 1.0f);
}

// rotate around the z axis
mat4 rotate3DZ(float angle) {
    return mat4(cos(angle), sin(angle), 0.0f, 0.0f, -sin(angle), cos(angle), 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f);
}

// include all orders to handle bvh probably a smarter way to do this...
mat4 rotateXYZ(float ax, float ay, float az) {
    return rotate3DZ(az) * rotate3DY(ay) * rotate3DX(ax);
}

mat4 rotateXZY(float ax, float ay, float az) {
    return rotate3DY(ay) * rotate3DZ(az) * rotate3DX(ax);
}

mat4 rotateYXZ(float ax, float ay, float az) {
    return rotate3DZ(az) * rotate3DX(ax) * rotate3DY(ay);
}

mat4 rotateYZX(float ax, float ay, float az) {
    return rotate3DX(ax) * rotate3DZ(az) * rotate3DY(ay);
}

mat4 rotateZXY(float ax, float ay, float az) {
    return rotate3DY(ay) * rotate3DX(ax) * rotate3DZ(az);
}

mat4 rotateZYX(float ax, float ay, float az) {
    return rotate3DX(ax) * rotate3DY(ay) * rotate3DZ(az);
}

// rotate around all axis in default order
mat4 rotate3D(float ax, float ay, float az) {
    // TODO could probaby make more efficient by writing out the whole matrix
    //      but tbh thats what the X,Y,Z specific rotations are for anyway
    return rotateXYZ(ax, ay, az);
}

// get rotation matrix based on the rotation order
// order values:
// XYZ: 0
// XZY: 1
// YXZ: 2
// YZX: 3
// ZXY: 4
// ZYX: 5
mat4 getBVHRotation(
    float x,
    float y,
    float z,
    int order
) {
    if(order == 0) {
        return rotateXYZ(x, y, z);
    }
    if(order == 1) {
        return rotateXZY(x, y, z);
    }
    if(order == 2) {
        return rotateYXZ(x, y, z);
    }
    if(order == 3) {
        return rotateYZX(x, y, z);
    }
    if(order == 4) {
        return rotateZXY(x, y, z);
    }

    return rotateZYX(x, y, z);
}

// create a 2d shear matrix
// to shear in only x/y leave the other param = 0
mat3 shear2D(float xs, float ys) {
    return mat3(1.0f, ys, 0.0f, xs, 1.0f, 0.0f, 0.0f, 0.0f, 1.0f);
}

// create 3d shear matrix... this one looks kinida annoying to use
// wonder if theres a simpler way...
mat4 shear3d(float xy, float xz, float yx, float yz, float zx, float zy) {
    return mat4(1.0f, yx, zx, 0.0f, xy, 1.0f, zy, 0.0f, xz, yz, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f);
}

// create a 2d mirror matrix
// to mirror across X angle = 1/2 pi rad, 3/2 pi rad etc
// to mirror across Y angle = 0 rad, pi rad etc
mat3 mirror2D(float angle) {
    return mat3(cos(2.0f * angle), sin(2.0f * angle), 0.0f, sin(2.0f * angle), -1.0f * cos(2.0f * angle), 0.0f, 0.0f, 0.0f, 1.0f);
}

// Mirror along a vector that passes through the origin
// 
// couldnt find mirroring in the slides; shear was simple enough
// to derive but mirroring is more complicated.
// https://en.wikipedia.org/wiki/Transformation_matrix#Reflection
mat4 mirror3D(float lx, float ly, float lz) {
    float lx2 = lx * lx;
    float ly2 = ly * ly;
    float lz2 = lz * lz;

    return mat4(ly2 + lz2 - lx2, 2.0f * lx * ly, 2.0f * lx * lz, 0, 2.0f * ly * lx, lx2 + lz2 - ly2, 2.0f * ly * lz, 0, 2.0f * lz * lx, 2.0f * lz * ly, lx2 + ly2 - lz2, 0, 0, 0, 0, 1);
}

// create a 2d translation matrix
mat3 translate2D(float tx, float ty) {
    return mat3(1.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, tx, ty, 1.0f);
}

// create a 3d transformation matrix
mat4 translate3D(float tx, float ty, float tz) {
    return mat4(1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, tx, ty, tz, 1.0f);
}

void main() {
    mat4 T = translate3D(uPosition.x, uPosition.y, uPosition.z);
    mat4 S = scaling3D(uScale.x, uScale.y, uScale.z);
    mat4 R;
    if(uBVH == 0) {
        R = rotate3D(uRotation.x, uRotation.y, uRotation.z);
    } else {
        R = getBVHRotation(uRotation.x, uRotation.y, uRotation.z, uBVH);
    }

    // pure world matrix separated from camera transforms
    mat4 worldMatrix = uWorldTransformationMatrix * uModelTransformationMatrix * T * R * S;
    mat4 M = uModelViewMatrix * worldMatrix;
    mat3 mv = mat3(M);

    // calculate all the things...
    vPositionLightSpace = uLightSpaceMatrix * worldMatrix * vec4(aPosition, 1.0f);
    vPosition = (M * vec4(aPosition, 1.0f)).xyz;
    vNormal = transpose(inverse(mv)) * aNormal;
    vTangent = mv * aTangent;
    vColor = aColor;
    vTexCoord = aTexCoord;

    gl_Position = uProjectionMatrix * vec4(vPosition, 1.0f);
}