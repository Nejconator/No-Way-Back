struct VertexInput {
    @location(0) position: vec4f,
    @location(1) color: vec4f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

struct FragmentInput {
    @location(0) color: vec4f,
}

struct FragmentOutput {
    @location(0) color: vec4f,
}

@group(0) @binding(0) var<uniform> matrix: mat4x4f;

@vertex
fn vertex(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;

    output.position = matrix * input.position;
    output.color = input.color;

    return output;
}

@fragment
fn fragment(input: FragmentInput) -> FragmentOutput {
    var output: FragmentOutput;

    output.color = input.color;

    return output;
}
