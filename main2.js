import { ResizeSystem } from './engine/systems/ResizeSystem.js';
import { UpdateSystem } from './engine/systems/UpdateSystem.js';
import { GLTFLoader } from './engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from './engine/renderers/UnlitRenderer.js';
import { FirstPersonController } from './engine/controllers/FirstPersonController.js';
import { Renderer } from './Renderer.js';
//import { Light } from './Light.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from './SceneUtils.js';

import { Camera, Model } from './engine/core/core.js';

import {
    Entity,
    Transform,
} from './engine/core/core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from './engine/core/MeshUtils.js';


const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const gltfLoader = new GLTFLoader();
await gltfLoader.load('./models/Mapa.gltf');


const scene = gltfLoader.loadScene();

const camera = scene.find(entity => entity.getComponentOfType(Camera));


const model = scene.find(entity => entity.getComponentOfType(Model));

/*
const light = new Entity();
light.addComponent(new Transform({
    translation: [3, 3, 3],
}));
light.addComponent(new Light({
    ambient: 0.3,
}));
light.addComponent(new LinearAnimator(light, {
    startPosition: [3, 3, 3],
    endPosition: [-3, -3, -3],
    duration: 1,
    loop: true,
}));
scene.push(light);
*/




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


// nastavitve za premikanje ----------------------------------------------------------
const cameraSpeed = 0.2;
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
        console.log("Angle: " + angleBetween*(180/Math.PI));

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
            velocityA = 1;
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
            velocityD = 1;
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
            velocityUp = 0.5;
            }
        }
            transform.translation[1] += velocityUp;
        
        if (keysPressed['Shift']) { 
            //transform.translation[1] -= 1;
        }

        

        velocityW -= velocityFactor;
        if (velocityW < 0) velocityW = 0;
        velocityS -= velocityFactor;
        if (velocityS < 0) velocityS = 0;
        velocityA -= velocityFactor;
        if (velocityA < 0) velocityA = 0;
        velocityD -= velocityFactor;
        if (velocityD < 0) velocityD = 0;

        velocityUp -= velocityFactor*0.9;
        if (velocityUp < 0 && camera.getComponentOfType(Transform).translation[1] <= cameraDeafultZ) {
            velocityUp = 0;
            camera.getComponentOfType(Transform).translation[1] = cameraDeafultZ;
        } 

       // console.log("x:" + transform.translation[0] + " z:" + transform.translation[1] + " y:" + transform.translation[2]);
    }
});



window.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
    if (e.key === ' ') keysPressed[' '] = true;
});

window.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
    if (e.key === ' ') keysPressed[' '] = false;
});


function update(time, dt) {
    for (const entity of scene) {
        for (const component of entity.components) {
            component.update?.(time, dt);
        }
    }
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();