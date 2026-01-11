import { quat, mat4 } from './glm.js';
import { Transform } from './Transform.js';
import { Camera } from './Camera.js';
import { Node } from './Node.js';
import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from './SceneUtils.js';
import { UNIFORM_BYTES, buildUniformData, lightingState } from "./Lighting.js";


export class Door {

    static imageBitmap = null;
    
    static async loadTexture(device) {
        if (Door.imageBitmap) return;

        this.imageBitmap = await fetch('door_texture.png')
        .then(r => r.blob())
        .then(b => createImageBitmap(b));

        this.device = device;
    }


    constructor(device, pipeline, camera, position) { 

        this.device = device;
        this.pipeline = pipeline;
        this.camera = camera;
        

        this.texture = device.createTexture({
            size: [Door.imageBitmap.width, Door.imageBitmap.height],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.COPY_DST,
        });

        device.queue.copyExternalImageToTexture(
            { source: Door.imageBitmap },
            { texture: this.texture },
            [Door.imageBitmap.width, Door.imageBitmap.height]);


        const sampler = device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: "linear",
        minFilter: "linear",
        });
        
        
         
        this.node = new Node();
        this.node.addComponent(new Transform({
            translation: position
        }));

        

        
        const door = new Float32Array([
            -0.75, 0, 0, 1,      0, 0,       
            0.75, 0, 0, 1,       0, 1,      
            0.75, 10, 0, 1,        1, 1,      
            -0.75, 10, 0, 1,         0, 1,       

            -0.75, 0, -0.2, 1,      1, 0,      
            0.75, 0, -0.2, 1,       0, 0,       
            0.75, 10, -0.2, 1,        0, 1,        
            -0.75, 10, -0.2, 1,         1, 1,      

            
        ]);

        

        this.doorBuffer = device.createBuffer({
            size: door.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });


        device.queue.writeBuffer(this.doorBuffer, 0, door);
      

        const doorIndices = new Uint32Array([
            0, 1, 2,
            2, 3, 0,  
            5, 4, 7,
            7, 6, 5,  
            4, 0, 3,
            3, 7, 4,   
            1, 5, 6,
            6, 2, 1,  
            3, 2, 6,
            6, 7, 3,  
            4, 5, 1,
            1, 0, 4,   
        ]);



        this.doorIndexBuffer = device.createBuffer({
            size: doorIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.doorIndexBuffer, 0, doorIndices);

        this.indexCount = doorIndices.length;

        
        this.doorUniformBuffer = device.createBuffer({
            size: UNIFORM_BYTES,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });



        this.doorBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.doorUniformBuffer } },
                { binding: 1, resource: this.texture.createView() },
                { binding: 2, resource: sampler },
            ]
        });

    }

    returnNode() {
        return this.node;
    }       

    updateRender() {
        const model = getGlobalModelMatrix(this.node);
        const view = getGlobalViewMatrix(this.camera);
        const proj = getProjectionMatrix(this.camera);

        const mvp = mat4.create()
            .multiply(proj)
            .multiply(view)
            .multiply(model);

       
        const cameraPos = this.camera.getComponentOfType(Transform).translation;

  
        const uniformData = buildUniformData({
          mvp,
          model,
          cameraPos,
          lightingState,
        });

   
        this.device.queue.writeBuffer(this.doorUniformBuffer, 0, uniformData);
    }

    draw(renderPass) {
        this.updateRender();

        renderPass.setPipeline(this.pipeline);
        renderPass.setVertexBuffer(0, this.doorBuffer);
        renderPass.setIndexBuffer(this.doorIndexBuffer, 'uint32');
        renderPass.setBindGroup(0, this.doorBindGroup);
        renderPass.drawIndexed(this.indexCount);

    }

        
}