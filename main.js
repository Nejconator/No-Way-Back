import { quat, mat4, vec3 } from './glm.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { Node } from './Node.js';
import { Wall } from './wall.js';
import { monkey } from './monkey.js';
import { Collisions } from './Collisions.js';
import { floorSize, walls } from './Positions.js';
import { corners } from './corner.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from './SceneUtils.js';



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
await monkey.loadTexture(device);



const cornerCordinates = [
    [0,5,0],        //0
    [-2,5,-5],      //1
    [-10,5,-5],     //2
    [-10,5,11],     //3
    [-16,5,11],     //4
    [-22,5,11],     //5
    [-22,5,-9],     //6
    [-28,5,-9],     //7
    [-28,5,-17],    //8
    [-28,5,-28],    //9
    [-2,5,-28],     //10
    [-2,5,-17],     //11
    [28,5,-28],     //12
    [28,5,-13],     //13
    [12,5,-13],     //14
    [12,5,-5],      //15
    [12,5,2],       //16
    [24,5,2],       //17
    [24,5,20],      //18
    [12,5,20],      //19
    [12,5,28],      //20
    [-16,5,28],     //21
    [2,5,20],       //22
    [2,5,11],       //23
    [12,5,11],      //24
    [0,5,-5],       //25
    [],             //player 
]

const Corners = [];
let j=0;
for(const c of corners){
    Corners[j] = [];
    Corners[j][0]=c.c1;
    Corners[j][1]=c.c2;
    Corners[j][2]=c.c3;
    Corners[j][3]=c.c4;
    j++;
}

const repeatU = 30 / 2.5 ;
const repeatV = 30 / 2.5 ;

// Create vertex buffer
const vertex = new Float32Array([
// positions            //texcoords         
    -30, 0, -30,  1,     0, 0,  // 0 - spredaj levo (zelena trava)
     30, 0, -30,  1,     repeatU, 0,  // 1 - spredaj desno
    -30, 0,  30,  1,     0, repeatV,  // 2 - zadaj levo (temnejša)
     30, 0,  30,  1,     repeatU, repeatV,  // 3 - zadaj desno
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

    const sampler = device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: "linear",
        minFilter: "linear",
    });

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
    fovy: 1.5,
    aspect: 1,
}));
camera.addComponent(new Transform({
    translation: [0, 6.5, 0] //6
}));

let cameraDeafultZ = camera.getComponentOfType(Transform).translation[1];

/*
const wall1 = new Wall(device, pipeline, camera, [30, 0, 0], 1, 30);
const wall2 = new Wall(device, pipeline, camera, [-30, 0, 0], 1, 30); 
const wall3 = new Wall(device, pipeline, camera, [0, 0, -30], 0, 30);
const wall4 = new Wall(device, pipeline, camera, [-15, 0, 0], 1, 15);
*/

const Monkey = new monkey(device,pipeline,camera, [2,5,20]);

const wallsArray = []; 
let i = 0;
for (const w of walls) {
    if(w.rotation === 0){
    wallsArray[i] = new Wall(device, pipeline, camera, w.pos, w.rotation, w.size[0]/2);
    }
    if(w.rotation === 1){
        wallsArray[i] = new Wall(device, pipeline, camera, w.pos, w.rotation, w.size[2]/2);
    }
    i++;
}



// računaš točo eno mersko enoto pred tabo v smeri kamere
function getForwardVector(camera) {
    const world = getGlobalModelMatrix(camera);
    
    const forward = [-world[8], -world[9], -world[10]];
    const backward = [world[8], world[9], world[10]];
    
    const len = Math.hypot(forward[0], forward[1], forward[2]);
    forward[0] /= len; 
    forward[1] /= len; 
    forward[2] /= len;

    const ForwardPosition = camera.getComponentOfType(Transform).translation;
    const FrPosition = [ForwardPosition[0] + forward[0],
                        ForwardPosition[1] + forward[1],
                        ForwardPosition[2] + forward[2]];
    
    return FrPosition;
}

function AngleBetweenVectors(v1, v2) {
    let dot = vec3.dot(v1, v2);
    let mag = vec3.length(v1) * vec3.length(v2);
    let angleBetween = Math.acos(dot / mag);


    let cross = vec3.cross([], v1, v2);
    if (cross[1] < 0) {
        angleBetween = -angleBetween;
    }
    return angleBetween;
}

function VectLenght(vect){
    return Math.sqrt(vect[0]*vect[0] + vect[1]*vect[1] + vect[2]*vect[2]);
}

// nastavitve za premikanje ----------------------------------------------------------
const cameraSpeed = 0.1;
const keysPressed = {};
const sensitivity = 0.002;

let MouseX = 0;
let MouseY = 0;


canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});

window.addEventListener('mousemove', (e) => {
    MouseX += e.movementX;
    MouseY += e.movementY;
});



let velocityW = 0;
let velocityS = 0;
let velocityA = 0;
let velocityD = 0;
let velocityUp = 0;

camera.addComponent({
    update() {
        const transform = camera.getComponentOfType(Transform);
        const rotation = transform.rotation;
       

        quat.identity(rotation);
        quat.rotateY(rotation, rotation, -MouseX*sensitivity);
        //quat.rotateX(rotation, rotation, -MouseY*sensitivity);

        // X+ (desno), X- (levo), Z+ (nazaj), Z- (naprej), Y+ (gor), Y- (dol)
        const vecCamera = camera.getComponentOfType(Transform).translation;
        const Refvector = [vecCamera[0], vecCamera[1], vecCamera[2]-5];
        
        
        const vectorCameraToRef = [Refvector[0] - transform.translation[0],
                                   Refvector[1] - transform.translation[1],
                                   Refvector[2] - transform.translation[2]];
        
        const CameraFrVector = getForwardVector(camera);

        const vectorCameraToForward = [CameraFrVector[0] - transform.translation[0],
                                       CameraFrVector[1] - transform.translation[1],
                                       CameraFrVector[2] - transform.translation[2]];

        

        // računa kot za koliko je kamera rotirana glede na začetno smer
        let angleBetween = AngleBetweenVectors(vectorCameraToRef, vectorCameraToForward);
        //console.log("Angle: " + angleBetween*(180/Math.PI));

        //za forward in backward
        let Xtravel = Math.sin(angleBetween)*(cameraSpeed);
        let Ytravel = Math.cos(angleBetween)*(cameraSpeed); 

        //za sideways
        let Xsideways = Math.sin(angleBetween + Math.PI/2)*(cameraSpeed*0.6);
        if (angleBetween*(180/Math.PI) < 0) {
            Xsideways = -Xsideways;
        }
        let Ysideways = Math.cos(angleBetween + Math.PI/2)*(cameraSpeed*0.6);
        if (angleBetween*(180/Math.PI) < 0) {
            Ysideways = -Ysideways;
        }

        
        let velocityFactor = 0.025
        

        // tranlation[0] -> x axis
        // tranlation[1] -> y axis
        // tranlation[2] -> z axis
        if (keysPressed['w'] || keysPressed['W']) {
           velocityW = 1;
           velocityS = 0;
        }
        transform.translation[0] -= Xtravel * velocityW;
        transform.translation[2] -= Ytravel * velocityW;

        if (keysPressed['s'] || keysPressed['S']) {
            velocityS = 1;
            velocityW = 0;
        }
        transform.translation[0] += Xtravel * velocityS;
        transform.translation[2] += Ytravel * velocityS;

        if (keysPressed['a'] || keysPressed['A']) {
            velocityA = 0.7;
            velocityD = 0;
        }
            if(angleBetween*(180/Math.PI) < 0) {
            transform.translation[0] += Xsideways * velocityA;
            transform.translation[2] += Ysideways * velocityA;
            } else {
            transform.translation[0] -= Xsideways * velocityA;
            transform.translation[2] -= Ysideways * velocityA;
            }
        if (keysPressed['d'] || keysPressed['D']) {
            velocityD = 0.7;
            velocityA = 0;
        }
            if(angleBetween*(180/Math.PI) < 0) {
            transform.translation[0] -= Xsideways * velocityD;
            transform.translation[2] -= Ysideways * velocityD;
            } else {
            transform.translation[0] += Xsideways * velocityD;
            transform.translation[2] += Ysideways * velocityD;
            }

        if (keysPressed[' ']) { 
            if(camera.getComponentOfType(Transform).translation[1] <= cameraDeafultZ){
            velocityUp = 0.3;
            }
        }
            transform.translation[1] += velocityUp;
        
            /*
        if (keysPressed['Shift']) { 
            //transform.translation[1] -= 1;
        }
        */
        

        velocityW -= velocityFactor;
        if (velocityW < 0) velocityW = 0;
        velocityS -= velocityFactor;
        if (velocityS < 0) velocityS = 0;
        velocityA -= velocityFactor;
        if (velocityA < 0) velocityA = 0;
        velocityD -= velocityFactor;
        if (velocityD < 0) velocityD = 0;

        velocityUp -= velocityFactor*0.7;
        if (velocityUp < 0 && camera.getComponentOfType(Transform).translation[1] <= cameraDeafultZ) {
            velocityUp = 0;
            camera.getComponentOfType(Transform).translation[1] = cameraDeafultZ;
        } 

        //console.log("x:" + transform.translation[0] + " z:" + transform.translation[1] + " y:" + transform.translation[2]);
    }
});

let targetCornerIndex = 23;
let targetCorner = cornerCordinates[targetCornerIndex];
const MonkeySpeed = 0.075;
let distToCorner = 10;

Monkey.returnNode().addComponent({
    update(){
        const MonkeyTransform = Monkey.returnNode().getComponentOfType(Transform);
        const rotation = MonkeyTransform.rotation;

        const CameraPos = camera.getComponentOfType(Transform).translation;
        const vectToPlayer = [CameraPos[0] - MonkeyTransform.translation[0], CameraPos[1] - MonkeyTransform.translation[1], CameraPos[2] - MonkeyTransform.translation[2]];
        const distToPlyr = VectLenght(vectToPlayer);

        const pointUP = [MonkeyTransform.translation[0], MonkeyTransform.translation[1], MonkeyTransform.translation[2]-5];
        const vectUP = [pointUP[0] - MonkeyTransform.translation[0], pointUP[1] - MonkeyTransform.translation[1], pointUP[2] - MonkeyTransform.translation[2]];

        if(distToCorner<=0.05){
            
            const pointDOWN = [MonkeyTransform.translation[0], MonkeyTransform.translation[1], MonkeyTransform.translation[2]+5];
            const pointLEFT = [MonkeyTransform.translation[0]-5, MonkeyTransform.translation[1], MonkeyTransform.translation[2]];
            const pointRIGHT = [MonkeyTransform.translation[0]+5, MonkeyTransform.translation[1], MonkeyTransform.translation[2]];
            const vectDOWN = [pointDOWN[0] - MonkeyTransform.translation[0], pointDOWN[1] - MonkeyTransform.translation[1], pointDOWN[2] - MonkeyTransform.translation[2]];
            const vectLEFT = [pointLEFT[0] - MonkeyTransform.translation[0], pointLEFT[1] - MonkeyTransform.translation[1], pointLEFT[2] - MonkeyTransform.translation[2]];
            const vectRIGHT = [pointRIGHT[0] - MonkeyTransform.translation[0], pointRIGHT[1] - MonkeyTransform.translation[1], pointRIGHT[2] - MonkeyTransform.translation[2]];

            let angleToUP = AngleBetweenVectors(vectToPlayer, vectUP);
            let angleToDOWN = AngleBetweenVectors(vectToPlayer, vectDOWN);
            let angleToLEFT = AngleBetweenVectors(vectToPlayer, vectLEFT);
            let angleToRIGHT = AngleBetweenVectors(vectToPlayer, vectRIGHT);

            if(Corners[targetCornerIndex][0] == null) angleToUP = 999;
            if(Corners[targetCornerIndex][1] == null) angleToDOWN = 999;
            if(Corners[targetCornerIndex][2] == null) angleToLEFT = 999;
            if(Corners[targetCornerIndex][3] == null) angleToRIGHT = 999;

            let minAngle = Math.min(Math.abs(angleToUP), Math.abs(angleToDOWN), Math.abs(angleToLEFT), Math.abs(angleToRIGHT));

            if(minAngle === Math.abs(angleToUP)){
                targetCornerIndex = Corners[targetCornerIndex][0];
                targetCorner = cornerCordinates[targetCornerIndex];

            }else if(minAngle === Math.abs(angleToDOWN)){
                targetCornerIndex = Corners[targetCornerIndex][1];
                targetCorner = cornerCordinates[targetCornerIndex];

            }else if(minAngle === Math.abs(angleToLEFT)){
                targetCornerIndex = Corners[targetCornerIndex][2];
                targetCorner = cornerCordinates[targetCornerIndex];

            }else if(minAngle === Math.abs(angleToRIGHT)){
                targetCornerIndex = Corners[targetCornerIndex][3];
                targetCorner = cornerCordinates[targetCornerIndex];

            }
        }

        const vectToCorner = [targetCorner[0] - MonkeyTransform.translation[0], targetCorner[1] - MonkeyTransform.translation[1], targetCorner[2] - MonkeyTransform.translation[2]];
        distToCorner = VectLenght(vectToCorner);

        let angleToCorner = AngleBetweenVectors(vectToCorner, vectUP);
        console.log("pos: x:" + MonkeyTransform.translation[0] + " z:" + MonkeyTransform.translation[1] + " y:" + MonkeyTransform.translation[2]);
        console.log("dist to corner: " + distToCorner + " corner index: " + targetCornerIndex);

        let MonkeyXtravel = Math.sin(angleToCorner)*(MonkeySpeed);
        let MonkeyYtravel = Math.cos(angleToCorner)*(MonkeySpeed); 
        

        MonkeyTransform.translation[0] += MonkeyXtravel;
        MonkeyTransform.translation[2] -= MonkeyYtravel;
    }
});



window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keysPressed[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keysPressed[key] = false;
});

window.addEventListener('blur', () => {
    for (const key in keysPressed) keysPressed[key] = false;
});


const scene = new Node(); // ----------------------------------------------------------
scene.addChild(ground);
/*
scene.addChild(wall1.returnNode());
scene.addChild(wall2.returnNode());
scene.addChild(wall3.returnNode());
scene.addChild(wall4.returnNode());
*/

scene.addChild(Monkey.returnNode());

for (let j=0; j<wallsArray.length; j++) {
    scene.addChild(wallsArray[j].returnNode());
}

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

    /*
    wall1.updateRender();
    wall2.updateRender();
    wall3.updateRender();
    wall4.updateRender();
    */

    Monkey.updateRender();
    
    for (let j=0; j<wallsArray.length; j++) {
        wallsArray[j].updateRender();
    }
    

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
    
    /*
    wall1.draw(renderPass);
    wall2.draw(renderPass);
    wall3.draw(renderPass);
    wall4.draw(renderPass);
    */
    Monkey.draw(renderPass);

    
    for (let j=0; j<wallsArray.length; j++) {
        wallsArray[j].draw(renderPass);
    }
    
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
}

const wallColliders = [
    { 
        // wall1 (rotation 1 in main.js) = Side wall on the right
        node: { translation: [30, 7.5, 0] }, 
        size: [1, 25, 60], 
        meta: { type: 'wall' } 
    },
    { 
        // wall2 (rotation 1 in main.js) = Side wall on the left
        // position [-60, 0, 0] + vertex offset [30, 0, 0] = -30
        node: { translation: [-30, 7.5, 0] }, 
        size: [1, 25, 60], 
        meta: { type: 'wall' } 
    },
    { 
        // wall3 (rotation 0 in main.js) = Back wall
        node: { translation: [0, 7.5, -30] }, 
        size: [60, 25, 1], 
        meta: { type: 'wall' } 
    },
    { 
        // wall4 (rotation 0 in main.js) = Back wall
        node: { translation: [0, 7.5, 30] }, 
        size: [60, 25, 1], 
        meta: { type: 'wall' } 
    }

];  

for (const w of walls) {
    wallColliders.push({
        node: { translation: w.pos },
        size: w.size,
        meta: { type: "wall" }
    });
}
 
const orbColliders = []; 


const collisions = new Collisions({
    playerNode: camera,
    playerSize: [1, 6, 1],   
    wallColliders,
    orbColliders
});

collisions.onOrbCollect = (orbMeta) => {
    console.log('Orb collected!', orbMeta);
    // Example actions:
    // - remove orb from scene
    // - increment score
    // - mark orb as collected in orbColliders array
};

function frame() {
    update();
    collisions.update();
    render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
