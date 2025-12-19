import { quat, mat4 } from './glm.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { Node } from './Node.js';
import { Wall } from './wall.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from './SceneUtils.js';

//import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';



// Initialize WebGPU
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const canvas = document.querySelector('canvas');
canvas.width = window.innerWidth * devicePixelRatio;
canvas.height = window.innerHeight * devicePixelRatio;
const context = canvas.getContext('webgpu');
const format = navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device,
    format,
    size: [canvas.width, canvas.height],
});
await Wall.loadTexture(device);


// Create vertex buffer
const vertex = new Float32Array([
// positions            //texcoords         
    -30, 0, -30,  1,     0, 0,  // 0 - spredaj levo (zelena trava)
     30, 0, -30,  1,     0, 1,  // 1 - spredaj desno
    -30, 0,  30,  1,     1,0,  // 2 - zadaj levo (temnejša)
     30, 0,  30,  1,     1, 1,  // 3 - zadaj desno
]);

const imageBitmap = await fetch('Red-carpet.jpg')
.then(response => response.blob())
.then(blob => createImageBitmap(blob));

const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height],
    format: 'rgba8unorm',
    usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.COPY_DST,
});

device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture },
    [imageBitmap.width, imageBitmap.height]);

const sampler = device.createSampler();



const vertexBuffer = device.createBuffer({
    size: vertex.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});



device.queue.writeBuffer(vertexBuffer, 0, vertex);


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
    arrayStride: 24,
     attributes: [
        {
            shaderLocation: 0,
            offset: 0,
            format: 'float32x4',
        },
        {
            shaderLocation: 1,
            offset: 16,
            format: 'float32x2',
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

//  for ground 
const uniformBuffer = device.createBuffer({
    size: 16 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});



// Create the bind group for texture
const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: sampler },
    ]
});


// Create the scene

const ground = new Node();
ground.addComponent(new Transform());  // Ground is at origin

const camera = new Node();
camera.addComponent(new Camera({
    fovy: 1,
    aspect: 1,
}));
camera.addComponent(new Transform({
    translation: [0, 10, 15]
}));

const wall1 = new Wall(device, pipeline, camera, [0, 0, 0], 1, 30);
const wall2 = new Wall(device, pipeline, camera, [-60, 0, 0], 1, 30); 
const wall3 = new Wall(device, pipeline, camera, [0, 0, 0], 0, 30);


const cameraSpeed = 0.1;
const keysPressed = {};

let MouseX = 0;
let MouseY = 0;
const sensitivity = 0.002;
// nagne kamero navzdol

camera.addComponent({
    update() {
        const transform = camera.getComponentOfType(Transform);
        const rotation = transform.rotation;
        
        // Nagnjena kamera (~30 stopinj navzdol)
        //quat.identity(rotation);
        //quat.rotateX(rotation, rotation, -0.5);

        quat.identity(rotation);

        quat.rotateY(rotation, rotation, -MouseX*sensitivity);
        quat.rotateX(rotation, rotation, -MouseY*sensitivity);


        // X+ (desno), X- (levo), Z+ (nazaj), Z- (naprej), Y+ (gor), Y- (dol)
        const forward = [0, 0, -cameraSpeed];
        const backward = [0, 0, cameraSpeed];
        const left = [-cameraSpeed, 0, 0];
        const right = [cameraSpeed, 0, 0];
        const up = [0, cameraSpeed, 0];
        const down = [0, -cameraSpeed, 0];

        window.addEventListener('mousemove', (e) => {
            const moveX = e.clientX - MouseX;
            const moveY = e.clientY - MouseY;
            MouseX = e.clientX;
            MouseY = e.clientY;

            
            
            quat.rotateY(rotation, rotation, -moveX * sensitivity);
            
            quat.rotateX(rotation, rotation, -moveY * sensitivity);

        });

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
        if (keysPressed['q'] || keysPressed['Q']) {
            transform.rotation[1] += 0.7854;
        }
        if (keysPressed['e'] || keysPressed['E']) {
            transform.rotation[1] -= 0.7854;
        }
        console.log("x:" + transform.translation[0] + " z:" + transform.translation[1] + " y:" + transform.translation[2]);
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


const scene = new Node(); // ----------------------------------------------------------
scene.addChild(ground);
scene.addChild(wall1.returnNode());
scene.addChild(wall2.returnNode());
scene.addChild(wall3.returnNode());
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
    const modelMatrix = getGlobalModelMatrix(ground);
    const viewMatrix = getGlobalViewMatrix(camera);
    const projectionMatrix = getProjectionMatrix(camera);

    // Upload the transformation matrix
    const matrix = mat4.create()
        .multiply(projectionMatrix)
        .multiply(viewMatrix)
        .multiply(modelMatrix);

    device.queue.writeBuffer(uniformBuffer, 0, matrix);

    
    wall1.updateRender();
    wall2.updateRender();
    wall3.updateRender();
    

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
    

    wall1.draw(renderPass);
    wall2.draw(renderPass);
    wall3.draw(renderPass);

    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
}

function frame() {
    update();
    render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
