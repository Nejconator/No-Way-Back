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
        
//const glftLoader = new GLTFLoader();
//await glftLoader.load(new URL('./'+name, import.meta.url));

export class Shard {

    

    constructor(name, position) {

        this.name = name;

        this.node = new Node();
        this.node.addComponent(new Transform({
            translation: position
        }));

        
    }
    
    



}