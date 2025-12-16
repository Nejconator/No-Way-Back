import { quat, mat4 } from './glm.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { Node } from './Node.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from './SceneUtils.js';

// Initialize WebGPU
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const canvas = document.querySelector('canvas');
const context = canvas.getContext('webgpu');
const format = navigator.gpu.getPreferredCanvasFormat();
context.configure({ device, format });

// Create vertex buffer
const vertices = new Float32Array([
// positions         // colors         
    -10, 0, -10,  1,     0.2, 0.8, 0.2, 1,  // 0 - spredaj levo (zelena trava)
     10, 0, -10,  1,     0.2, 0.8, 0.2, 1,  // 1 - spredaj desno
    -10, 0,  10,  1,     0.1, 0.6, 0.1, 1,  // 2 - zadaj levo (temnejša)
     10, 0,  10,  1,     0.1, 0.6, 0.1, 1,  // 3 - zadaj desno
]);

const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);

// Create index buffer
const indices = new Uint32Array([
    0, 1, 2,    // Prvi trikotnik
    2, 1, 3,    // Drugi trikotnik
]);

const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(indexBuffer, 0, indices);

// Create the depth texture
const depthTexture = device.createTexture({
    size: [canvas.width, canvas.height],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
});

// Fetch and compile shaders
const code = await fetch('shader.wgsl').then(response => response.text());
const module = device.createShaderModule({ code });

// Create the pipeline
const vertexBufferLayout = {
    arrayStride: 32,
    attributes: [
        {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x4',
        },
        {
            shaderLocation: 1,
            offset: 16,
            format: 'float32x4',
        },
    ],
};

const pipeline = device.createRenderPipeline({
    vertex: {
        module,
        buffers: [vertexBufferLayout],
    },
    fragment: {
        module,
        targets: [{ format }],
    },
    depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
    },
    layout: 'auto',
});

// Create matrix buffer
const uniformBuffer = device.createBuffer({
    size: 16 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// Create the bind group
const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
    ]
});

// Create the scene

const model = new Node();
model.addComponent(new Transform());
/*
model.addComponent({
    update() {
        const time = performance.now() / 1000;
        const transform = model.getComponentOfType(Transform);
        const rotation = transform.rotation;

        quat.identity(rotation);
        quat.rotateX(rotation, rotation, time * 0.6);
        quat.rotateY(rotation, rotation, time * 0.7);
    }
});
*/

const camera = new Node();
camera.addComponent(new Camera({
    fovy: 1,
    aspect: 1,
}));
camera.addComponent(new Transform({
    translation: [0, 10, 15]
}));


const cameraSpeed = 0.1;
const keysPressed = {};
// nagne kamero navzdol
camera.addComponent({
    update() {
        const transform = camera.getComponentOfType(Transform);
        const rotation = transform.rotation;
        
        // Nagnjena kamera (~30 stopinj navzdol)
        quat.identity(rotation);
        quat.rotateX(rotation, rotation, -0.5);

        const forward = [0, 0, -cameraSpeed];
        const backward = [0, 0, cameraSpeed];
        const left = [-cameraSpeed, 0, 0];
        const right = [cameraSpeed, 0, 0];
        const up = [0, cameraSpeed, 0];
        const down = [0, -cameraSpeed, 0];

        if (keysPressed['w'] || keysPressed['W']) {
            transform.translation[2] += forward[2];
        }
        if (keysPressed['s'] || keysPressed['S']) {
            transform.translation[2] += backward[2];
        }
        if (keysPressed['a'] || keysPressed['A']) {
            transform.translation[0] += left[0];
        }
        if (keysPressed['d'] || keysPressed['D']) {
            transform.translation[0] += right[0];
        }
        if (keysPressed[' ']) { 
            transform.translation[1] += up[1];
        }
        if (keysPressed['Shift']) { 
            transform.translation[1] += down[1];
        }

    }
});

window.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
    // Handle special keys
    if (e.key === ' ') keysPressed[' '] = true;
    if (e.key === 'Shift') keysPressed['Shift'] = true;
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
    // Handle special keys
    if (e.key === ' ') keysPressed[' '] = false;
    if (e.key === 'Shift') keysPressed['Shift'] = false;
});


const scene = new Node();
scene.addChild(model);
scene.addChild(camera);

// Update all components
function update() {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.();
        }
    });
}

function render() {
    // Get the required matrices
    const modelMatrix = getGlobalModelMatrix(model);
    const viewMatrix = getGlobalViewMatrix(camera);
    const projectionMatrix = getProjectionMatrix(camera);

    // Upload the transformation matrix
    const matrix = mat4.create()
        .multiply(projectionMatrix)
        .multiply(viewMatrix)
        .multiply(modelMatrix);

    device.queue.writeBuffer(uniformBuffer, 0, matrix);

    // Render
    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: [0.7, 0.8, 0.9, 1],
            storeOp: 'store',
        }],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'discard',
        },
    });
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, 'uint32');
    renderPass.setBindGroup(0, bindGroup);
    renderPass.drawIndexed(indices.length);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
}

function frame() {
    update();
    render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
