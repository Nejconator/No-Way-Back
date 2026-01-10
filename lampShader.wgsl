struct Uniforms {
  mvp : mat4x4f,
  color : vec4f, // rgb + alpha
};

@group(0) @binding(0) var<uniform> U : Uniforms;

@vertex
fn vertex(@location(0) position : vec4f) -> @builtin(position) vec4f {
  return U.mvp * position;
}

@fragment
fn fragment() -> @location(0) vec4f {
  return U.color;
}
