const MAX_POINT_LIGHTS: u32 = 16u;

struct VertexInput {
  @location(0) position : vec4f,
  @location(1) texcoords : vec2f,
};

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) worldPos : vec3f,
  @location(1) texcoords : vec2f,
};

struct FragmentOutput {
  @location(0) color : vec4f,
};

struct Uniforms {
  mvp : mat4x4f,
  model : mat4x4f,

  // cameraPos.xyz, cameraPos.w = pointLightCount
  cameraPos_pointCount : vec4f,

  // dirDir.xyz (direction "from light"), dirDir.w = dirIntensity
  dirDir_intensity : vec4f,

  // dirColor.xyz, dirColor.w = ambientStrength
  dirColor_ambient : vec4f,

  // pointPos.xyz, pointPos.w = intensity
  pointPosIntensity : array<vec4f, MAX_POINT_LIGHTS>,

  // pointColor.xyz, pointColor.w = range
  pointColorRange : array<vec4f, MAX_POINT_LIGHTS>,
};

@group(0) @binding(0) var<uniform> U : Uniforms;
@group(0) @binding(1) var baseTexture : texture_2d<f32>;
@group(0) @binding(2) var baseSampler : sampler;

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
  var out : VertexOutput;

  let world = U.model * input.position;
  out.worldPos = world.xyz;
  out.position = U.mvp * input.position;
  out.texcoords = input.texcoords;

  return out;
}

@fragment
fn fragment(input: VertexOutput) -> FragmentOutput {
  var out : FragmentOutput;

  // Albedo from texture
  let albedo = textureSample(baseTexture, baseSampler, input.texcoords).rgb;

  // Flat normal from screen-space derivatives of world position
  var N = normalize(cross(dpdx(input.worldPos), dpdy(input.worldPos)));

  // View direction
  let camPos = U.cameraPos_pointCount.xyz;
  let V = normalize(camPos - input.worldPos);

  // Make normal face camera (prevents “dark backfaces” when winding varies)
  N = faceForward(N, -V, N);

  // Ambient
  let ambient = U.dirColor_ambient.w;
  var lightSum = vec3f(ambient);

  // Directional light (Lambert)
  let Ld = normalize(-U.dirDir_intensity.xyz);
  let NdL = max(dot(N, Ld), 0.0);
  lightSum += NdL * U.dirColor_ambient.xyz * U.dirDir_intensity.w;

  // Point lights
  let count = u32(U.cameraPos_pointCount.w);
  for (var i: u32 = 0u; i < MAX_POINT_LIGHTS; i = i + 1u) {
    if (i >= count) { break; }

    let posI = U.pointPosIntensity[i];
    let colR = U.pointColorRange[i];

    let Lvec = posI.xyz - input.worldPos;
    let dist = length(Lvec);
    let L = Lvec / max(dist, 0.0001);

    // attenuation using range
    let range = max(colR.w, 0.001);
    let att = clamp(1.0 - (dist / range), 0.0, 1.0);
    let diff = max(dot(N, L), 0.0);

    lightSum += diff * colR.xyz * posI.w * att;
  }

  let lit = albedo * lightSum;
  out.color = vec4f(lit, 1.0);
  return out;
}
